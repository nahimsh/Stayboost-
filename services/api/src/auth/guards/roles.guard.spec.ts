import { describe, expect, it, vi } from "vitest";
import type { ExecutionContext } from "@nestjs/common";
import { ForbiddenException } from "@nestjs/common";
import type { Reflector } from "@nestjs/core";
import type { Role } from "@stayboost/domain";
import type { PrismaService } from "../../prisma/prisma.service";
import { RolesGuard } from "./roles.guard";

function makeContext(opts: {
  required?: Role[];
  user?: { id: string; email: string };
  params?: Record<string, string>;
  headers?: Record<string, string>;
}): { ctx: ExecutionContext; reflector: Reflector } {
  const reflector = { getAllAndOverride: vi.fn().mockReturnValue(opts.required) } as unknown as Reflector;
  const req = {
    user: opts.user,
    params: opts.params ?? {},
    header: (h: string) => opts.headers?.[h.toLowerCase()],
  };
  const ctx = {
    switchToHttp: () => ({ getRequest: () => req }),
    getHandler: () => null,
    getClass: () => null,
  } as unknown as ExecutionContext;
  return { ctx, reflector };
}

function prismaWith(memberships: Array<{ orgId: string; role: string }>): PrismaService {
  return { membership: { findMany: vi.fn().mockResolvedValue(memberships) } } as unknown as PrismaService;
}

describe("RolesGuard", () => {
  it("allows when no roles are required", async () => {
    const { ctx, reflector } = makeContext({});
    const guard = new RolesGuard(reflector, prismaWith([]));
    expect(await guard.canActivate(ctx)).toBe(true);
  });

  it("allows a higher role than required (hierarchical)", async () => {
    const { ctx, reflector } = makeContext({ required: ["manager"], user: { id: "u", email: "e" } });
    const guard = new RolesGuard(reflector, prismaWith([{ orgId: "o1", role: "owner" }]));
    expect(await guard.canActivate(ctx)).toBe(true);
  });

  it("denies a lower role than required", async () => {
    const { ctx, reflector } = makeContext({ required: ["manager"], user: { id: "u", email: "e" } });
    const guard = new RolesGuard(reflector, prismaWith([{ orgId: "o1", role: "staff" }]));
    await expect(guard.canActivate(ctx)).rejects.toBeInstanceOf(ForbiddenException);
  });

  it("super_admin passes everything", async () => {
    const { ctx, reflector } = makeContext({ required: ["owner"], user: { id: "u", email: "e" } });
    const guard = new RolesGuard(reflector, prismaWith([{ orgId: "o1", role: "super_admin" }]));
    expect(await guard.canActivate(ctx)).toBe(true);
  });

  it("scopes the check to the target org via x-org-id", async () => {
    const { ctx, reflector } = makeContext({
      required: ["owner"],
      user: { id: "u", email: "e" },
      headers: { "x-org-id": "o2" },
    });
    // owner in o1 but only staff in the requested o2 → denied
    const guard = new RolesGuard(
      reflector,
      prismaWith([
        { orgId: "o1", role: "owner" },
        { orgId: "o2", role: "staff" },
      ]),
    );
    await expect(guard.canActivate(ctx)).rejects.toBeInstanceOf(ForbiddenException);
  });
});

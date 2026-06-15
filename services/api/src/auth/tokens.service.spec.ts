import { describe, expect, it, vi } from "vitest";
import type { ConfigService } from "@nestjs/config";
import type { JwtService } from "@nestjs/jwt";
import { UnauthorizedException } from "@nestjs/common";
import type { PrismaService } from "../prisma/prisma.service";
import { TokensService } from "./tokens.service";
import { hashToken } from "./crypto.util";

function setup(sessionRow?: Record<string, unknown>) {
  const jwt = { signAsync: vi.fn().mockResolvedValue("access.jwt"), verifyAsync: vi.fn() } as unknown as JwtService;
  const create = vi.fn().mockResolvedValue({ id: "sess-new" });
  const findUnique = vi.fn().mockResolvedValue(sessionRow ?? null);
  const update = vi.fn().mockResolvedValue({});
  const updateMany = vi.fn().mockResolvedValue({ count: 0 });
  const prisma = { session: { create, findUnique, update, updateMany } } as unknown as PrismaService;
  const config = { get: vi.fn((k: string) => (k === "REFRESH_TTL_DAYS" ? 30 : "15m")) } as unknown as ConfigService;
  return { service: new TokensService(jwt, prisma, config), create, findUnique, update, updateMany, jwt };
}

const ctx = { ip: "1.2.3.4", userAgent: "vitest" };

describe("TokensService.issue", () => {
  it("creates a session and signs an access token", async () => {
    const { service, create, jwt } = setup();
    const tokens = await service.issue("user-1", "u@e.com", ctx);
    expect(create).toHaveBeenCalledOnce();
    expect(jwt.signAsync).toHaveBeenCalledWith({ sub: "user-1", email: "u@e.com" }, { expiresIn: "15m" });
    expect(tokens.refreshToken).toMatch(/^[A-Za-z0-9_-]+$/);
    expect(tokens.accessToken).toBe("access.jwt");
  });
});

describe("TokensService.rotate", () => {
  const future = new Date(Date.now() + 1_000_000);

  it("rotates a valid token and revokes the old session", async () => {
    const { service, update } = setup({ id: "sess-1", userId: "user-1", expiresAt: future, revokedAt: null });
    const tokens = await service.rotate("raw-refresh", "u@e.com", ctx);
    expect(tokens.refreshToken).toBeTruthy();
    // old session revoked and linked to the replacement
    expect(update).toHaveBeenCalledWith({
      where: { id: "sess-1" },
      data: expect.objectContaining({ replacedById: "sess-new" }),
    });
  });

  it("rejects an expired token", async () => {
    const { service } = setup({ id: "s", userId: "u", expiresAt: new Date(Date.now() - 1000), revokedAt: null });
    await expect(service.rotate("raw", "u@e.com", ctx)).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it("detects reuse of a revoked token and revokes all sessions", async () => {
    const { service, updateMany } = setup({ id: "s", userId: "user-1", expiresAt: future, revokedAt: new Date() });
    await expect(service.rotate("raw", "u@e.com", ctx)).rejects.toThrow(/reuse/i);
    expect(updateMany).toHaveBeenCalledWith({
      where: { userId: "user-1", revokedAt: null },
      data: expect.objectContaining({ revokedAt: expect.any(Date) }),
    });
  });
});

describe("TokensService.revoke", () => {
  it("revokes by refresh token hash", async () => {
    const { service, updateMany } = setup();
    await service.revoke("raw-refresh");
    expect(updateMany).toHaveBeenCalledWith({
      where: { refreshTokenHash: hashToken("raw-refresh"), revokedAt: null },
      data: expect.objectContaining({ revokedAt: expect.any(Date) }),
    });
  });
});

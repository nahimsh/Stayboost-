import { CanActivate, type ExecutionContext, ForbiddenException, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import type { Request } from "express";
import { ROLE_RANK, type Role } from "@stayboost/domain";
import { PrismaService } from "../../prisma/prisma.service";
import { ROLES_KEY, type AuthenticatedUser } from "../decorators";

/**
 * Hierarchical, org-scoped RBAC. Requires the caller to hold at least the lowest
 * required role. A `super_admin` membership passes everything. The target org is
 * taken from the route param `orgId` or the `x-org-id` header; without one, the
 * check passes if the user satisfies the role in ANY of their orgs.
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const required = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!required || required.length === 0) return true;

    const req = context.switchToHttp().getRequest<Request & { user?: AuthenticatedUser }>();
    const user = req.user;
    if (!user) throw new ForbiddenException("Authentication required");

    const minRank = Math.min(...required.map((r) => ROLE_RANK[r]));
    const memberships = await this.prisma.membership.findMany({
      where: { userId: user.id, status: "active" },
      select: { orgId: true, role: true },
    });

    if (memberships.some((m) => m.role === "super_admin")) return true;

    const targetOrgId =
      (req.params as Record<string, string>)?.orgId ?? req.header("x-org-id") ?? undefined;
    const relevant = targetOrgId
      ? memberships.filter((m) => m.orgId === targetOrgId)
      : memberships;

    const allowed = relevant.some((m) => (ROLE_RANK[m.role as Role] ?? 0) >= minRank);
    if (!allowed) throw new ForbiddenException("Insufficient role");
    return true;
  }
}

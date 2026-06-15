import { CanActivate, type ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import type { Request } from "express";
import { TokensService } from "../tokens.service";
import { ACCESS_COOKIE } from "../cookies";
import { IS_PUBLIC_KEY, type AuthenticatedUser } from "../decorators";

/** Authenticates requests via the access JWT (cookie or Bearer header). */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly tokens: TokensService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const req = context.switchToHttp().getRequest<Request & { user?: AuthenticatedUser }>();
    const token = this.extractToken(req);
    if (!token) throw new UnauthorizedException("Authentication required");

    const claims = await this.tokens.verifyAccessToken(token);
    req.user = { id: claims.sub, email: claims.email };
    return true;
  }

  private extractToken(req: Request): string | null {
    const cookie = (req.cookies as Record<string, string> | undefined)?.[ACCESS_COOKIE];
    if (cookie) return cookie;
    const header = req.header("authorization");
    if (header?.startsWith("Bearer ")) return header.slice(7);
    return null;
  }
}

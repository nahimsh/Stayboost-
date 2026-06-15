import { CanActivate, type ExecutionContext, ForbiddenException, Injectable } from "@nestjs/common";
import type { Request } from "express";
import { CSRF_COOKIE } from "../cookies";
import { safeEqual } from "../crypto.util";

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

/**
 * Double-submit CSRF protection for cookie-authenticated, state-changing requests.
 * The client echoes the readable CSRF cookie in the X-CSRF-Token header; we require
 * the two to match. Safe (read-only) methods are exempt.
 */
@Injectable()
export class CsrfGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<Request>();
    if (SAFE_METHODS.has(req.method)) return true;

    const cookieToken = (req.cookies as Record<string, string> | undefined)?.[CSRF_COOKIE];
    const headerToken = req.header("x-csrf-token");
    if (!cookieToken || !headerToken || !safeEqual(cookieToken, headerToken)) {
      throw new ForbiddenException("CSRF token missing or invalid");
    }
    return true;
  }
}

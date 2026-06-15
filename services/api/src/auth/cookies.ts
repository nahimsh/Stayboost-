import { randomBytes } from "node:crypto";
import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import type { CookieOptions, Response } from "express";

export const ACCESS_COOKIE = "sb_access";
export const REFRESH_COOKIE = "sb_refresh";
export const CSRF_COOKIE = "sb_csrf";

const ACCESS_MAX_AGE_MS = 15 * 60 * 1000;

/** Sets/clears the auth cookies with production-safe flags. */
@Injectable()
export class CookieService {
  private readonly secure: boolean;
  private readonly domain: string | undefined;
  private readonly refreshMaxAgeMs: number;

  constructor(config: ConfigService) {
    this.secure = config.get<boolean>("AUTH_COOKIE_SECURE") ?? false;
    this.domain = config.get<string>("COOKIE_DOMAIN");
    this.refreshMaxAgeMs = (config.get<number>("REFRESH_TTL_DAYS") ?? 30) * 24 * 60 * 60 * 1000;
  }

  private base(httpOnly: boolean, maxAge: number, path = "/"): CookieOptions {
    return {
      httpOnly,
      secure: this.secure,
      sameSite: "lax",
      path,
      maxAge,
      ...(this.domain ? { domain: this.domain } : {}),
    };
  }

  /** Set access (httpOnly), refresh (httpOnly, scoped to /v1/auth), and a readable
   *  CSRF token. Returns the CSRF token so it can also be sent in the body. */
  setAuth(res: Response, accessToken: string, refreshToken: string): string {
    const csrfToken = randomBytes(24).toString("base64url");
    res.cookie(ACCESS_COOKIE, accessToken, this.base(true, ACCESS_MAX_AGE_MS));
    res.cookie(REFRESH_COOKIE, refreshToken, this.base(true, this.refreshMaxAgeMs, "/v1/auth"));
    // Not httpOnly: the SPA reads it to echo in the X-CSRF-Token header (double-submit).
    res.cookie(CSRF_COOKIE, csrfToken, { ...this.base(false, this.refreshMaxAgeMs), sameSite: "strict" });
    return csrfToken;
  }

  clear(res: Response): void {
    res.clearCookie(ACCESS_COOKIE, { path: "/", ...(this.domain ? { domain: this.domain } : {}) });
    res.clearCookie(REFRESH_COOKIE, { path: "/v1/auth", ...(this.domain ? { domain: this.domain } : {}) });
    res.clearCookie(CSRF_COOKIE, { path: "/", ...(this.domain ? { domain: this.domain } : {}) });
  }
}

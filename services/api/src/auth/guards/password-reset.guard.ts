import { Injectable } from "@nestjs/common";
import { ThrottlerGuard } from "@nestjs/throttler";
import type { Request } from "express";

/**
 * Throttles password-reset requests by email address (not IP).
 *
 * Why: the default ThrottlerGuard keys on the client IP, which makes it easy
 * to bypass by rotating IPs — and it over-blocks shared egress (NAT/proxies).
 * For password-reset the meaningful key is the email being targeted: an
 * attacker can't trigger resets for the same mailbox faster than this limit
 * regardless of how many IPs they use. Falls back to IP when the body lacks
 * a valid email (e.g. malformed requests).
 */
@Injectable()
export class PasswordResetThrottlerGuard extends ThrottlerGuard {
  protected override async getTracker(req: Record<string, unknown>): Promise<string> {
    const request = req as unknown as Request;
    const body = request.body as Record<string, unknown> | undefined;
    const email = body?.["email"];
    if (typeof email === "string" && email.length > 0) {
      return `pwd-reset:${email.toLowerCase()}`;
    }
    return `pwd-reset:ip:${request.ip ?? "unknown"}`;
  }
}

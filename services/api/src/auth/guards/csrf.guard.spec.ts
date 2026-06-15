import { describe, expect, it } from "vitest";
import type { ExecutionContext } from "@nestjs/common";
import { ForbiddenException } from "@nestjs/common";
import { CsrfGuard } from "./csrf.guard";
import { CSRF_COOKIE } from "../cookies";

function ctxFor(method: string, cookieToken?: string, headerToken?: string): ExecutionContext {
  const req = {
    method,
    cookies: cookieToken ? { [CSRF_COOKIE]: cookieToken } : {},
    header: (h: string) => (h.toLowerCase() === "x-csrf-token" ? headerToken : undefined),
  };
  return { switchToHttp: () => ({ getRequest: () => req }) } as unknown as ExecutionContext;
}

describe("CsrfGuard", () => {
  const guard = new CsrfGuard();

  it("exempts safe methods", () => {
    expect(guard.canActivate(ctxFor("GET"))).toBe(true);
  });

  it("allows when cookie and header tokens match", () => {
    expect(guard.canActivate(ctxFor("POST", "tok-123", "tok-123"))).toBe(true);
  });

  it("rejects when tokens differ", () => {
    expect(() => guard.canActivate(ctxFor("POST", "tok-123", "tok-999"))).toThrow(ForbiddenException);
  });

  it("rejects when the header is missing", () => {
    expect(() => guard.canActivate(ctxFor("POST", "tok-123"))).toThrow(ForbiddenException);
  });
});

import { describe, expect, it, vi } from "vitest";
import type { ConfigService } from "@nestjs/config";
import { BadRequestException } from "@nestjs/common";
import { GoogleService } from "./google.service";

function configured(): ConfigService {
  const values: Record<string, string> = {
    GOOGLE_CLIENT_ID: "client-id",
    GOOGLE_CLIENT_SECRET: "client-secret",
    GOOGLE_REDIRECT_URI: "https://app.test/v1/auth/google/callback",
  };
  return { get: (k: string) => values[k] } as unknown as ConfigService;
}

function jsonResponse(body: unknown, ok = true): Response {
  return new Response(JSON.stringify(body), { status: ok ? 200 : 400 });
}

describe("GoogleService", () => {
  it("reports disabled when not configured", () => {
    const svc = new GoogleService({ get: () => undefined } as unknown as ConfigService);
    expect(svc.enabled).toBe(false);
    expect(() => svc.buildAuthUrl("state")).toThrow(BadRequestException);
  });

  it("builds a consent URL carrying client id, redirect, and state", () => {
    const svc = new GoogleService(configured());
    const url = new URL(svc.buildAuthUrl("xyz-state"));
    expect(url.searchParams.get("client_id")).toBe("client-id");
    expect(url.searchParams.get("state")).toBe("xyz-state");
    expect(url.searchParams.get("response_type")).toBe("code");
  });

  it("exchanges a code for a normalized profile", async () => {
    const svc = new GoogleService(configured());
    svc.fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse({ access_token: "at-1" }))
      .mockResolvedValueOnce(
        jsonResponse({ sub: "google-123", email: "User@Gmail.com", name: "Real User", email_verified: true }),
      ) as unknown as typeof fetch;

    const profile = await svc.exchangeCode("auth-code");
    expect(profile).toEqual({
      providerAccountId: "google-123",
      email: "user@gmail.com",
      name: "Real User",
      emailVerified: true,
    });
  });

  it("throws when the token exchange fails", async () => {
    const svc = new GoogleService(configured());
    svc.fetchImpl = vi.fn().mockResolvedValue(jsonResponse({}, false)) as unknown as typeof fetch;
    await expect(svc.exchangeCode("bad")).rejects.toBeInstanceOf(BadRequestException);
  });
});

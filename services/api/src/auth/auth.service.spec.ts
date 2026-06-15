import { describe, expect, it, vi, beforeEach } from "vitest";
import { ConflictException, UnauthorizedException } from "@nestjs/common";
import type { ConfigService } from "@nestjs/config";
import type { PrismaService } from "../prisma/prisma.service";
import type { MailService } from "../mail/mail.service";
import type { TokensService } from "./tokens.service";
import type { AuditService } from "./audit.service";
import type { GoogleService } from "./google.service";
import { AuthService } from "./auth.service";
import { hashPassword } from "./crypto.util";

const ctx = { ip: "1.2.3.4", userAgent: "vitest" };
const issued = { accessToken: "a", refreshToken: "r", sessionId: "s" };

function makeHarness() {
  const prisma = {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn().mockResolvedValue({ id: "u1", email: "u@e.com", name: "U" }),
      findUniqueOrThrow: vi.fn().mockResolvedValue({
        id: "u1",
        email: "u@e.com",
        name: "U",
        emailVerifiedAt: null,
        memberships: [{ orgId: "o1", role: "owner", organization: { id: "o1", name: "Org" } }],
      }),
    },
    organization: { create: vi.fn().mockResolvedValue({ id: "o1" }) },
    membership: { create: vi.fn() },
    session: { updateMany: vi.fn().mockResolvedValue({ count: 1 }) },
    verificationToken: {
      create: vi.fn().mockResolvedValue({}),
      findUnique: vi.fn(),
      updateMany: vi.fn().mockResolvedValue({ count: 1 }),
    },
    oAuthAccount: { findUnique: vi.fn(), create: vi.fn() },
    $transaction: vi.fn(async (arg: unknown) =>
      typeof arg === "function" ? (arg as (tx: unknown) => unknown)(prisma) : Promise.resolve(arg),
    ),
  };
  const tokens = { issue: vi.fn().mockResolvedValue(issued) } as unknown as TokensService;
  const mail = { send: vi.fn().mockResolvedValue(undefined) } as unknown as MailService;
  const audit = { record: vi.fn().mockResolvedValue(undefined) } as unknown as AuditService;
  const google = {} as unknown as GoogleService;
  const config = { get: () => "http://localhost:3000" } as unknown as ConfigService;
  const service = new AuthService(prisma as unknown as PrismaService, tokens, mail, audit, google, config);
  return { service, prisma, tokens, mail, audit };
}

let h: ReturnType<typeof makeHarness>;
beforeEach(() => {
  h = makeHarness();
});

const signupInput = {
  name: "Maya",
  email: "maya@example.com",
  password: "ValidPassw0rd!!",
  organizationName: "Sea Breeze",
};

describe("signup", () => {
  it("creates org + owner membership, sends verification, and issues tokens", async () => {
    h.prisma.user.findUnique.mockResolvedValue(null);
    h.prisma.user.create.mockResolvedValue({ id: "u1", email: "maya@example.com", name: "Maya" });

    const result = await h.service.signup(signupInput, ctx);

    expect(h.prisma.organization.create).toHaveBeenCalledOnce();
    expect(h.prisma.membership.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ role: "owner" }),
    });
    expect(h.mail.send).toHaveBeenCalledOnce(); // verification email
    expect(h.tokens.issue).toHaveBeenCalledOnce();
    expect(result.tokens).toEqual(issued);
  });

  it("rejects a duplicate email", async () => {
    h.prisma.user.findUnique.mockResolvedValue({ id: "existing" });
    await expect(h.service.signup(signupInput, ctx)).rejects.toBeInstanceOf(ConflictException);
  });
});

describe("login", () => {
  it("rejects bad credentials with a generic error and audits the failure", async () => {
    h.prisma.user.findUnique.mockResolvedValue(null);
    await expect(h.service.login({ email: "x@y.com", password: "nope" }, ctx)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
    expect(h.audit.record).toHaveBeenCalledWith(expect.objectContaining({ action: "auth.login_failed" }));
  });

  it("logs in with a correct password", async () => {
    const passwordHash = await hashPassword("ValidPassw0rd!!");
    h.prisma.user.findUnique.mockResolvedValue({ id: "u1", email: "u@e.com", passwordHash, status: "active" });

    const result = await h.service.login({ email: "u@e.com", password: "ValidPassw0rd!!" }, ctx);

    expect(h.tokens.issue).toHaveBeenCalledOnce();
    expect(result.user.email).toBe("u@e.com");
  });
});

describe("verifyEmail / resetPassword token flows", () => {
  const future = new Date(Date.now() + 100000);

  it("verifies email by consuming a valid token", async () => {
    h.prisma.verificationToken.findUnique.mockResolvedValue({
      id: "t1",
      userId: "u1",
      type: "email_verify",
      consumedAt: null,
      expiresAt: future,
    });
    await h.service.verifyEmail("raw-token");
    expect(h.prisma.user.update).toHaveBeenCalledWith({
      where: { id: "u1" },
      data: { emailVerifiedAt: expect.any(Date) },
    });
  });

  it("rejects an expired or wrong-type token", async () => {
    h.prisma.verificationToken.findUnique.mockResolvedValue({
      id: "t1",
      userId: "u1",
      type: "password_reset",
      consumedAt: null,
      expiresAt: future,
    });
    await expect(h.service.verifyEmail("raw")).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it("reset revokes all sessions for the user", async () => {
    h.prisma.verificationToken.findUnique.mockResolvedValue({
      id: "t1",
      userId: "u1",
      type: "password_reset",
      consumedAt: null,
      expiresAt: future,
    });
    await h.service.resetPassword("raw", "NewPassw0rd!!");
    expect(h.prisma.session.updateMany).toHaveBeenCalledWith({
      where: { userId: "u1", revokedAt: null },
      data: expect.objectContaining({ revokedAt: expect.any(Date) }),
    });
  });
});

describe("password reset request", () => {
  it("does not reveal whether an account exists", async () => {
    h.prisma.user.findUnique.mockResolvedValue(null);
    await expect(h.service.requestPasswordReset("ghost@e.com", ctx)).resolves.toBeUndefined();
    expect(h.mail.send).not.toHaveBeenCalled();
  });
});

import { randomBytes } from "node:crypto";
import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import type {
  AuthUser,
  LoginInput,
  Role,
  SignupInput,
} from "@stayboost/domain";
import { PrismaService } from "../prisma/prisma.service";
import { MailService } from "../mail/mail.service";
import { TokensService, type IssuedTokens, type RequestContext } from "./tokens.service";
import { AuditService } from "./audit.service";
import { GoogleService, type GoogleProfile } from "./google.service";
import { generateToken, hashPassword, hashToken, verifyPassword } from "./crypto.util";
import {
  magicLinkTemplate,
  passwordResetTemplate,
  verifyEmailTemplate,
} from "./auth.templates";

type TokenType = "email_verify" | "password_reset" | "magic_link";

const TTL = {
  email_verify: 24 * 60 * 60 * 1000,
  password_reset: 60 * 60 * 1000,
  magic_link: 15 * 60 * 1000,
} as const;

export interface AuthResult {
  user: AuthUser;
  tokens: IssuedTokens;
}

@Injectable()
export class AuthService {
  private readonly appUrl: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly tokens: TokensService,
    private readonly mail: MailService,
    private readonly audit: AuditService,
    private readonly google: GoogleService,
    config: ConfigService,
  ) {
    this.appUrl = config.get<string>("APP_URL") ?? "http://localhost:3000";
  }

  // ---- Email / password ----

  async signup(input: SignupInput, ctx: RequestContext): Promise<AuthResult> {
    const existing = await this.prisma.user.findUnique({ where: { email: input.email } });
    if (existing) throw new ConflictException("An account with this email already exists");

    const passwordHash = await hashPassword(input.password);
    const slug = await this.uniqueSlug(input.organizationName);

    const { user } = await this.prisma.$transaction(async (tx) => {
      const org = await tx.organization.create({
        data: { name: input.organizationName, slug },
      });
      const created = await tx.user.create({
        data: { email: input.email, name: input.name, passwordHash },
      });
      await tx.membership.create({
        data: { orgId: org.id, userId: created.id, role: "owner" satisfies Role },
      });
      return { user: created };
    });

    await this.sendToken(user.id, user.name, user.email, "email_verify");
    const tokens = await this.tokens.issue(user.id, user.email, ctx);
    await this.audit.record({
      action: "auth.signup",
      actorUserId: user.id,
      ip: ctx.ip,
      userAgent: ctx.userAgent,
    });
    return { user: await this.buildAuthUser(user.id), tokens };
  }

  async login(input: LoginInput, ctx: RequestContext): Promise<AuthResult> {
    const user = await this.prisma.user.findUnique({ where: { email: input.email } });
    const ok = user ? await verifyPassword(input.password, user.passwordHash) : false;
    if (!user || !ok) {
      await this.audit.record({
        action: "auth.login_failed",
        ip: ctx.ip,
        userAgent: ctx.userAgent,
        metadata: { email: input.email },
      });
      throw new UnauthorizedException("Invalid email or password");
    }
    if (user.status !== "active") throw new UnauthorizedException("Account is not active");

    await this.prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
    const tokens = await this.tokens.issue(user.id, user.email, ctx);
    await this.audit.record({ action: "auth.login", actorUserId: user.id, ip: ctx.ip, userAgent: ctx.userAgent });
    return { user: await this.buildAuthUser(user.id), tokens };
  }

  // ---- Tokens / sessions ----

  async refresh(refreshToken: string, ctx: RequestContext): Promise<IssuedTokens> {
    const session = await this.prisma.session.findUnique({
      where: { refreshTokenHash: hashToken(refreshToken) },
      select: { user: { select: { email: true } } },
    });
    if (!session) throw new UnauthorizedException("Invalid refresh token");
    return this.tokens.rotate(refreshToken, session.user.email, ctx);
  }

  async logout(refreshToken: string | undefined): Promise<void> {
    if (refreshToken) await this.tokens.revoke(refreshToken);
  }

  // ---- Email verification ----

  async verifyEmail(rawToken: string): Promise<void> {
    const userId = await this.consumeToken(rawToken, "email_verify");
    await this.prisma.user.update({ where: { id: userId }, data: { emailVerifiedAt: new Date() } });
    await this.audit.record({ action: "auth.email_verified", actorUserId: userId });
  }

  async resendVerification(userId: string, name: string, email: string): Promise<void> {
    await this.sendToken(userId, name, email, "email_verify");
  }

  // ---- Password reset (no account enumeration) ----

  async requestPasswordReset(email: string, ctx: RequestContext): Promise<void> {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (user) {
      await this.sendToken(user.id, user.name, user.email, "password_reset");
      await this.audit.record({ action: "auth.password_reset_requested", actorUserId: user.id, ip: ctx.ip });
    }
  }

  async resetPassword(rawToken: string, newPassword: string): Promise<void> {
    const userId = await this.consumeToken(rawToken, "password_reset");
    const passwordHash = await hashPassword(newPassword);
    await this.prisma.$transaction([
      this.prisma.user.update({ where: { id: userId }, data: { passwordHash } }),
      // Reset is a security event: revoke every existing session.
      this.prisma.session.updateMany({ where: { userId, revokedAt: null }, data: { revokedAt: new Date() } }),
    ]);
    await this.audit.record({ action: "auth.password_reset", actorUserId: userId });
  }

  // ---- Magic link (existing users; no enumeration) ----

  async requestMagicLink(email: string, ctx: RequestContext): Promise<void> {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (user) {
      await this.sendToken(user.id, user.name, user.email, "magic_link");
      await this.audit.record({ action: "auth.magic_link_requested", actorUserId: user.id, ip: ctx.ip });
    }
  }

  async consumeMagicLink(rawToken: string, ctx: RequestContext): Promise<AuthResult> {
    const userId = await this.consumeToken(rawToken, "magic_link");
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: { emailVerifiedAt: new Date(), lastLoginAt: new Date() },
    });
    const tokens = await this.tokens.issue(user.id, user.email, ctx);
    await this.audit.record({ action: "auth.magic_link_login", actorUserId: user.id, ip: ctx.ip });
    return { user: await this.buildAuthUser(user.id), tokens };
  }

  // ---- Google OAuth ----

  buildGoogleUrl(state: string): string {
    return this.google.buildAuthUrl(state);
  }

  async loginWithGoogle(profile: GoogleProfile, ctx: RequestContext): Promise<AuthResult> {
    let user = await this.resolveGoogleUser(profile);
    user ??= await this.createGoogleUser(profile);
    const tokens = await this.tokens.issue(user.id, user.email, ctx);
    await this.audit.record({ action: "auth.google_login", actorUserId: user.id, ip: ctx.ip });
    return { user: await this.buildAuthUser(user.id), tokens };
  }

  // ---- Shared ----

  async buildAuthUser(userId: string): Promise<AuthUser> {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      include: { memberships: { include: { organization: { select: { id: true, name: true } } } } },
    });
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      emailVerified: user.emailVerifiedAt !== null,
      organizations: user.memberships.map((m) => ({
        orgId: m.orgId,
        orgName: m.organization.name,
        role: m.role as Role,
      })),
    };
  }

  private async resolveGoogleUser(profile: GoogleProfile): Promise<{ id: string; email: string } | null> {
    const account = await this.prisma.oAuthAccount.findUnique({
      where: { provider_providerAccountId: { provider: "google", providerAccountId: profile.providerAccountId } },
      select: { user: { select: { id: true, email: true } } },
    });
    if (account) return account.user;

    const byEmail = await this.prisma.user.findUnique({ where: { email: profile.email } });
    if (byEmail) {
      await this.prisma.oAuthAccount.create({
        data: { userId: byEmail.id, provider: "google", providerAccountId: profile.providerAccountId },
      });
      return { id: byEmail.id, email: byEmail.email };
    }
    return null;
  }

  private async createGoogleUser(profile: GoogleProfile): Promise<{ id: string; email: string }> {
    const slug = await this.uniqueSlug(`${profile.name}'s properties`);
    return this.prisma.$transaction(async (tx) => {
      const org = await tx.organization.create({ data: { name: `${profile.name}'s Properties`, slug } });
      const user = await tx.user.create({
        data: {
          email: profile.email,
          name: profile.name,
          emailVerifiedAt: profile.emailVerified ? new Date() : null,
        },
      });
      await tx.membership.create({ data: { orgId: org.id, userId: user.id, role: "owner" } });
      await tx.oAuthAccount.create({
        data: { userId: user.id, provider: "google", providerAccountId: profile.providerAccountId },
      });
      return { id: user.id, email: user.email };
    });
  }

  private async sendToken(userId: string, name: string, email: string, type: TokenType): Promise<void> {
    const raw = generateToken();
    await this.prisma.verificationToken.create({
      data: { userId, type, tokenHash: hashToken(raw), expiresAt: new Date(Date.now() + TTL[type]) },
    });
    const link = this.tokenLink(type, raw);
    const tmpl =
      type === "email_verify"
        ? verifyEmailTemplate(name, link)
        : type === "password_reset"
          ? passwordResetTemplate(link)
          : magicLinkTemplate(link);
    await this.mail.send({ to: email, subject: tmpl.subject, html: tmpl.html });
  }

  private tokenLink(type: TokenType, token: string): string {
    const path =
      type === "email_verify"
        ? "/verify-email"
        : type === "password_reset"
          ? "/reset-password"
          : "/magic-link";
    return `${this.appUrl}${path}?token=${token}`;
  }

  /** Consume a single-use token atomically (marks consumed; rejects reuse/expiry). */
  private async consumeToken(rawToken: string, type: TokenType): Promise<string> {
    const tokenHash = hashToken(rawToken);
    const record = await this.prisma.verificationToken.findUnique({ where: { tokenHash } });
    if (!record || record.type !== type || record.consumedAt || record.expiresAt < new Date()) {
      throw new UnauthorizedException("Invalid or expired token");
    }
    const consumed = await this.prisma.verificationToken.updateMany({
      where: { id: record.id, consumedAt: null },
      data: { consumedAt: new Date() },
    });
    if (consumed.count === 0) throw new UnauthorizedException("Invalid or expired token");
    return record.userId;
  }

  private async uniqueSlug(name: string): Promise<string> {
    const base =
      name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 40) || "org";
    return `${base}-${randomBytes(3).toString("hex")}`;
  }
}

import { Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import { PrismaService } from "../prisma/prisma.service";
import { generateToken, hashToken } from "./crypto.util";

export interface AccessClaims {
  sub: string;
  email: string;
}

export interface IssuedTokens {
  accessToken: string;
  refreshToken: string;
  sessionId: string;
}

export interface RequestContext {
  ip?: string | undefined;
  userAgent?: string | undefined;
}

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/** Issues short-lived access JWTs and manages opaque, rotating refresh sessions. */
@Injectable()
export class TokensService {
  private readonly accessTtl: string;
  private readonly refreshTtlDays: number;

  constructor(
    private readonly jwt: JwtService,
    private readonly prisma: PrismaService,
    config: ConfigService,
  ) {
    this.accessTtl = config.get<string>("JWT_ACCESS_TTL") ?? "15m";
    this.refreshTtlDays = config.get<number>("REFRESH_TTL_DAYS") ?? 30;
  }

  signAccessToken(claims: AccessClaims): Promise<string> {
    return this.jwt.signAsync(claims, { expiresIn: this.accessTtl });
  }

  async verifyAccessToken(token: string): Promise<AccessClaims> {
    try {
      return await this.jwt.verifyAsync<AccessClaims>(token);
    } catch {
      throw new UnauthorizedException("Invalid or expired access token");
    }
  }

  /** Create a brand-new session + tokens (login/signup). */
  async issue(userId: string, email: string, ctx: RequestContext): Promise<IssuedTokens> {
    const refreshToken = generateToken();
    const session = await this.prisma.session.create({
      data: {
        userId,
        refreshTokenHash: hashToken(refreshToken),
        userAgent: ctx.userAgent ?? null,
        ip: ctx.ip ?? null,
        expiresAt: new Date(Date.now() + this.refreshTtlDays * MS_PER_DAY),
      },
      select: { id: true },
    });
    const accessToken = await this.signAccessToken({ sub: userId, email });
    return { accessToken, refreshToken, sessionId: session.id };
  }

  /**
   * Rotate a refresh token. Detects reuse of an already-rotated/revoked token and
   * defensively revokes the whole chain for that user (token theft response).
   */
  async rotate(refreshToken: string, email: string, ctx: RequestContext): Promise<IssuedTokens> {
    const current = await this.prisma.session.findUnique({
      where: { refreshTokenHash: hashToken(refreshToken) },
    });

    if (!current || current.expiresAt < new Date()) {
      throw new UnauthorizedException("Invalid refresh token");
    }
    if (current.revokedAt) {
      // Reuse of a rotated token → likely theft. Revoke every active session.
      await this.prisma.session.updateMany({
        where: { userId: current.userId, revokedAt: null },
        data: { revokedAt: new Date() },
      });
      throw new UnauthorizedException("Refresh token reuse detected");
    }

    const newRefresh = generateToken();
    const next = await this.prisma.session.create({
      data: {
        userId: current.userId,
        refreshTokenHash: hashToken(newRefresh),
        userAgent: ctx.userAgent ?? null,
        ip: ctx.ip ?? null,
        expiresAt: new Date(Date.now() + this.refreshTtlDays * MS_PER_DAY),
      },
      select: { id: true },
    });
    await this.prisma.session.update({
      where: { id: current.id },
      data: { revokedAt: new Date(), replacedById: next.id },
    });

    const accessToken = await this.signAccessToken({ sub: current.userId, email });
    return { accessToken, refreshToken: newRefresh, sessionId: next.id };
  }

  /** Revoke a single session by its refresh token (logout). */
  async revoke(refreshToken: string): Promise<void> {
    await this.prisma.session.updateMany({
      where: { refreshTokenHash: hashToken(refreshToken), revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }
}

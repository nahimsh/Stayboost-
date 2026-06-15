import { randomBytes } from "node:crypto";
import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Post,
  Query,
  Req,
  Res,
  UseGuards,
  UsePipes,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Throttle } from "@nestjs/throttler";
import type { Request, Response } from "express";
import {
  loginInputSchema,
  magicLinkConsumeInputSchema,
  magicLinkRequestInputSchema,
  requestPasswordResetInputSchema,
  resetPasswordInputSchema,
  signupInputSchema,
  verifyEmailInputSchema,
  type AuthUser,
  type LoginInput,
  type MagicLinkConsumeInput,
  type MagicLinkRequestInput,
  type RequestPasswordResetInput,
  type ResetPasswordInput,
  type SignupInput,
  type VerifyEmailInput,
} from "@stayboost/domain";
import { ZodValidationPipe } from "../common/zod-validation.pipe";
import { AuthService, type AuthResult } from "./auth.service";
import { GoogleService } from "./google.service";
import { CookieService, REFRESH_COOKIE } from "./cookies";
import { CsrfGuard } from "./guards/csrf.guard";
import { JwtAuthGuard } from "./guards/jwt-auth.guard";
import { CurrentUser, Public, type AuthenticatedUser } from "./decorators";
import { safeEqual } from "./crypto.util";
import { type RequestContext } from "./tokens.service";

const OAUTH_STATE_COOKIE = "sb_oauth_state";

interface AuthResponse {
  user: AuthUser;
  csrfToken: string;
}

@Controller({ path: "auth", version: "1" })
export class AuthController {
  private readonly appUrl: string;

  constructor(
    private readonly auth: AuthService,
    private readonly google: GoogleService,
    private readonly cookies: CookieService,
    config: ConfigService,
  ) {
    this.appUrl = config.get<string>("APP_URL") ?? "http://localhost:3000";
  }

  @Public()
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post("signup")
  @UsePipes(new ZodValidationPipe(signupInputSchema))
  async signup(@Body() body: SignupInput, @Req() req: Request, @Res({ passthrough: true }) res: Response): Promise<AuthResponse> {
    return this.complete(await this.auth.signup(body, ctx(req)), res);
  }

  @Public()
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @Post("login")
  @UsePipes(new ZodValidationPipe(loginInputSchema))
  async login(@Body() body: LoginInput, @Req() req: Request, @Res({ passthrough: true }) res: Response): Promise<AuthResponse> {
    return this.complete(await this.auth.login(body, ctx(req)), res);
  }

  @Public()
  @UseGuards(CsrfGuard)
  @Throttle({ default: { limit: 30, ttl: 60_000 } })
  @Post("refresh")
  async refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response): Promise<{ csrfToken: string }> {
    const refreshToken = readRefresh(req);
    if (!refreshToken) throw new BadRequestException("Missing refresh token");
    const tokens = await this.auth.refresh(refreshToken, ctx(req));
    const csrfToken = this.cookies.setAuth(res, tokens.accessToken, tokens.refreshToken);
    return { csrfToken };
  }

  @Public()
  @UseGuards(CsrfGuard)
  @Post("logout")
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response): Promise<{ ok: true }> {
    await this.auth.logout(readRefresh(req));
    this.cookies.clear(res);
    return { ok: true };
  }

  @UseGuards(JwtAuthGuard)
  @Get("me")
  async me(@CurrentUser() user: AuthenticatedUser): Promise<AuthUser> {
    return this.auth.buildAuthUser(user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Post("resend-verification")
  async resendVerification(@CurrentUser() user: AuthenticatedUser): Promise<{ ok: true }> {
    await this.auth.resendVerification(user.id, user.email, user.email);
    return { ok: true };
  }

  @Public()
  @Post("verify-email")
  @UsePipes(new ZodValidationPipe(verifyEmailInputSchema))
  async verifyEmail(@Body() body: VerifyEmailInput): Promise<{ ok: true }> {
    await this.auth.verifyEmail(body.token);
    return { ok: true };
  }

  @Public()
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post("password/forgot")
  @UsePipes(new ZodValidationPipe(requestPasswordResetInputSchema))
  async forgotPassword(@Body() body: RequestPasswordResetInput, @Req() req: Request): Promise<{ ok: true }> {
    await this.auth.requestPasswordReset(body.email, ctx(req));
    return { ok: true }; // Always ok — no account enumeration.
  }

  @Public()
  @Post("password/reset")
  @UsePipes(new ZodValidationPipe(resetPasswordInputSchema))
  async resetPassword(@Body() body: ResetPasswordInput): Promise<{ ok: true }> {
    await this.auth.resetPassword(body.token, body.password);
    return { ok: true };
  }

  @Public()
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post("magic-link")
  @UsePipes(new ZodValidationPipe(magicLinkRequestInputSchema))
  async magicLink(@Body() body: MagicLinkRequestInput, @Req() req: Request): Promise<{ ok: true }> {
    await this.auth.requestMagicLink(body.email, ctx(req));
    return { ok: true };
  }

  @Public()
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @Post("magic-link/consume")
  @UsePipes(new ZodValidationPipe(magicLinkConsumeInputSchema))
  async magicLinkConsume(@Body() body: MagicLinkConsumeInput, @Req() req: Request, @Res({ passthrough: true }) res: Response): Promise<AuthResponse> {
    return this.complete(await this.auth.consumeMagicLink(body.token, ctx(req)), res);
  }

  @Public()
  @Get("google")
  google_start(@Res({ passthrough: true }) res: Response): { url: string } {
    const state = randomBytes(16).toString("base64url");
    res.cookie(OAUTH_STATE_COOKIE, state, { httpOnly: true, sameSite: "lax", maxAge: 600_000, path: "/v1/auth" });
    return { url: this.auth.buildGoogleUrl(state) };
  }

  @Public()
  @Get("google/callback")
  async googleCallback(@Query("code") code: string, @Query("state") state: string, @Req() req: Request, @Res() res: Response): Promise<void> {
    const expected = (req.cookies as Record<string, string> | undefined)?.[OAUTH_STATE_COOKIE];
    if (!code || !state || !expected || !safeEqual(state, expected)) {
      res.redirect(`${this.appUrl}/login?error=oauth`);
      return;
    }
    res.clearCookie(OAUTH_STATE_COOKIE, { path: "/v1/auth" });
    try {
      const profile = await this.google.exchangeCode(code);
      const result = await this.auth.loginWithGoogle(profile, ctx(req));
      this.cookies.setAuth(res, result.tokens.accessToken, result.tokens.refreshToken);
      res.redirect(`${this.appUrl}/dashboard`);
    } catch {
      res.redirect(`${this.appUrl}/login?error=oauth`);
    }
  }

  private complete(result: AuthResult, res: Response): AuthResponse {
    const csrfToken = this.cookies.setAuth(res, result.tokens.accessToken, result.tokens.refreshToken);
    return { user: result.user, csrfToken };
  }
}

function ctx(req: Request): RequestContext {
  return { ip: req.ip, userAgent: req.header("user-agent") ?? undefined };
}

function readRefresh(req: Request): string | undefined {
  return (req.cookies as Record<string, string> | undefined)?.[REFRESH_COOKIE];
}

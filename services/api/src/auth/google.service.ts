import { BadRequestException, Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

export interface GoogleProfile {
  providerAccountId: string;
  email: string;
  name: string;
  emailVerified: boolean;
}

const AUTH_ENDPOINT = "https://accounts.google.com/o/oauth2/v2/auth";
const TOKEN_ENDPOINT = "https://oauth2.googleapis.com/token";
const USERINFO_ENDPOINT = "https://openidconnect.googleapis.com/v1/userinfo";

/** Google OAuth 2.0 (authorization-code) helper. `fetch` is injectable for tests. */
@Injectable()
export class GoogleService {
  private readonly clientId: string | undefined;
  private readonly clientSecret: string | undefined;
  private readonly redirectUri: string | undefined;

  /** Overridable in tests; defaults to the global fetch. */
  fetchImpl: typeof fetch = fetch;

  constructor(config: ConfigService) {
    this.clientId = config.get<string>("GOOGLE_CLIENT_ID");
    this.clientSecret = config.get<string>("GOOGLE_CLIENT_SECRET");
    this.redirectUri = config.get<string>("GOOGLE_REDIRECT_URI");
  }

  get enabled(): boolean {
    return Boolean(this.clientId && this.clientSecret && this.redirectUri);
  }

  /** Build the consent-screen URL; `state` is the CSRF guard for the OAuth flow. */
  buildAuthUrl(state: string): string {
    if (!this.enabled) throw new BadRequestException("Google sign-in is not configured");
    const params = new URLSearchParams({
      client_id: this.clientId as string,
      redirect_uri: this.redirectUri as string,
      response_type: "code",
      scope: "openid email profile",
      access_type: "online",
      state,
      prompt: "select_account",
    });
    return `${AUTH_ENDPOINT}?${params.toString()}`;
  }

  /** Exchange the auth code for tokens, then fetch the verified profile. */
  async exchangeCode(code: string): Promise<GoogleProfile> {
    if (!this.enabled) throw new BadRequestException("Google sign-in is not configured");

    const tokenRes = await this.fetchImpl(TOKEN_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: this.clientId as string,
        client_secret: this.clientSecret as string,
        redirect_uri: this.redirectUri as string,
        grant_type: "authorization_code",
      }).toString(),
    });
    if (!tokenRes.ok) throw new BadRequestException("Failed to exchange Google authorization code");
    const { access_token: accessToken } = (await tokenRes.json()) as { access_token?: string };
    if (!accessToken) throw new BadRequestException("Google did not return an access token");

    const infoRes = await this.fetchImpl(USERINFO_ENDPOINT, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!infoRes.ok) throw new BadRequestException("Failed to load Google profile");
    const info = (await infoRes.json()) as {
      sub?: string;
      email?: string;
      name?: string;
      email_verified?: boolean;
    };
    if (!info.sub || !info.email) throw new BadRequestException("Incomplete Google profile");

    return {
      providerAccountId: info.sub,
      email: info.email.toLowerCase(),
      name: info.name ?? info.email,
      emailVerified: info.email_verified ?? false,
    };
  }
}

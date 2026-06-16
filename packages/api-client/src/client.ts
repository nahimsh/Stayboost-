import type {
  AuthUser,
  ContactLeadInput,
  DashboardSnapshot,
  GrowthReport,
  LoginInput,
  MagicLinkConsumeInput,
  MagicLinkRequestInput,
  PropertyProfileInput,
  PropertySetupInput,
  PropertySummary,
  RequestPasswordResetInput,
  ResetPasswordInput,
  SignupInput,
  VerifyEmailInput,
} from "@stayboost/domain";
import { errorFromResponse } from "./errors";

export interface ApiClientOptions {
  readonly baseUrl: string;
  /** Injectable for tests / SSR; defaults to the global fetch. */
  readonly fetch?: typeof fetch;
  /** Returns the CSRF token (read from the readable cookie) for protected mutations. */
  readonly csrfToken?: () => string | undefined;
}

export interface ContactResponse {
  readonly id: string | null;
  readonly accepted: true;
}

export interface AnalyzerResult {
  readonly token: string;
  readonly report: GrowthReport;
}

export interface AuthResponse {
  readonly user: AuthUser;
  readonly csrfToken: string;
}

export interface ApiClient {
  readonly contact: { submit(input: ContactLeadInput): Promise<ContactResponse> };
  readonly analyzer: {
    run(input: PropertyProfileInput): Promise<AnalyzerResult>;
    getReport(token: string): Promise<AnalyzerResult>;
  };
  readonly auth: {
    signup(input: SignupInput): Promise<AuthResponse>;
    login(input: LoginInput): Promise<AuthResponse>;
    logout(): Promise<{ ok: true }>;
    me(): Promise<AuthUser>;
    verifyEmail(input: VerifyEmailInput): Promise<{ ok: true }>;
    forgotPassword(input: RequestPasswordResetInput): Promise<{ ok: true }>;
    resetPassword(input: ResetPasswordInput): Promise<{ ok: true }>;
    requestMagicLink(input: MagicLinkRequestInput): Promise<{ ok: true }>;
    consumeMagicLink(input: MagicLinkConsumeInput): Promise<AuthResponse>;
    googleUrl(): Promise<{ url: string }>;
  };
  readonly dashboard: { snapshot(): Promise<DashboardSnapshot> };
  readonly properties: {
    create(input: PropertySetupInput): Promise<PropertySummary>;
    list(): Promise<PropertySummary[]>;
  };
}

export function createApiClient({ baseUrl, fetch: fetchImpl, csrfToken }: ApiClientOptions): ApiClient {
  const doFetch = fetchImpl ?? globalThis.fetch;
  const url = (path: string): string => `${baseUrl.replace(/\/$/, "")}${path}`;

  async function request<T>(path: string, init?: RequestInit): Promise<T> {
    // credentials:include sends/receives the auth cookies.
    const response = await doFetch(url(path), { credentials: "include", ...init });
    if (!response.ok) throw await errorFromResponse(response);
    return (await response.json()) as T;
  }

  function post<T>(path: string, body?: unknown, withCsrf = false): Promise<T> {
    const csrf = withCsrf ? csrfToken?.() : undefined;
    return request<T>(path, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(csrf ? { "X-CSRF-Token": csrf } : {}),
      },
      ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
    });
  }

  return {
    contact: {
      submit: (input) => post<ContactResponse>("/v1/contact", input),
    },
    analyzer: {
      run: (input) => post<AnalyzerResult>("/v1/analyzer/run", input),
      getReport: (token) =>
        request<AnalyzerResult>(`/v1/analyzer/reports/${encodeURIComponent(token)}`),
    },
    auth: {
      signup: (input) => post<AuthResponse>("/v1/auth/signup", input),
      login: (input) => post<AuthResponse>("/v1/auth/login", input),
      logout: () => post<{ ok: true }>("/v1/auth/logout", undefined, true),
      me: () => request<AuthUser>("/v1/auth/me"),
      verifyEmail: (input) => post<{ ok: true }>("/v1/auth/verify-email", input),
      forgotPassword: (input) => post<{ ok: true }>("/v1/auth/password/forgot", input),
      resetPassword: (input) => post<{ ok: true }>("/v1/auth/password/reset", input),
      requestMagicLink: (input) => post<{ ok: true }>("/v1/auth/magic-link", input),
      consumeMagicLink: (input) => post<AuthResponse>("/v1/auth/magic-link/consume", input),
      googleUrl: () => request<{ url: string }>("/v1/auth/google"),
    },
    dashboard: {
      snapshot: () => request<DashboardSnapshot>("/v1/dashboard"),
    },
    properties: {
      create: (input) => post<PropertySummary>("/v1/properties", input, true),
      list: () => request<PropertySummary[]>("/v1/properties"),
    },
  };
}

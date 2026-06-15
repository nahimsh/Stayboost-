import { createApiClient } from "@stayboost/api-client";

const baseUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

/** Reads the readable CSRF cookie set by the API (double-submit pattern). */
function readCsrfToken(): string | undefined {
  if (typeof document === "undefined") return undefined;
  const match = document.cookie.match(/(?:^|;\s*)sb_csrf=([^;]+)/);
  return match?.[1] ? decodeURIComponent(match[1]) : undefined;
}

/** The shared, typed API client for browser-side calls. */
export const api = createApiClient({ baseUrl, csrfToken: readCsrfToken });

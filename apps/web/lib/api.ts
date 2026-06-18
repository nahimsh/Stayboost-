import { createApiClient } from "@stayboost/api-client";

const configured = process.env.NEXT_PUBLIC_API_URL;
const baseUrl = configured ?? "http://localhost:4000";

// In production the browser must call the deployed API, not localhost. If
// NEXT_PUBLIC_API_URL is missing, every request fails (mixed-content / refused)
// with an opaque network error — make that loud in the console.
if (!configured && typeof window !== "undefined" && window.location.hostname !== "localhost") {
  // eslint-disable-next-line no-console
  console.error(
    "[StayBoost] NEXT_PUBLIC_API_URL is not set — API calls will fail. " +
      "Set it in your Vercel project to the deployed API origin (e.g. https://api.stayboost.com), then redeploy.",
  );
}

/** Reads the readable CSRF cookie set by the API (double-submit pattern). */
function readCsrfToken(): string | undefined {
  if (typeof document === "undefined") return undefined;
  const match = document.cookie.match(/(?:^|;\s*)sb_csrf=([^;]+)/);
  return match?.[1] ? decodeURIComponent(match[1]) : undefined;
}

/** The shared, typed API client for browser-side calls. */
export const api = createApiClient({ baseUrl, csrfToken: readCsrfToken });

import { withSentryConfig } from "@sentry/nextjs";

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

// Pragmatic CSP for a Next.js App Router app. 'unsafe-inline' is required for
// Next's hydration/runtime styles+scripts; everything else is locked to self +
// the known API origin. Tighten to nonces once a CSP middleware is in place.
const csp = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'none'",
  "form-action 'self'",
  "img-src 'self' data: https:",
  "font-src 'self' data:",
  "style-src 'self' 'unsafe-inline'",
  "script-src 'self' 'unsafe-inline'" + (process.env.NODE_ENV === "production" ? "" : " 'unsafe-eval'"),
  `connect-src 'self' ${apiUrl}`,
]
  .join("; ")
  .trim();

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  transpilePackages: [
    "@stayboost/ui",
    "@stayboost/utils",
    "@stayboost/i18n",
    "@stayboost/domain",
    "@stayboost/api-client",
  ],
  experimental: {
    optimizePackageImports: ["lucide-react", "@stayboost/ui"],
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "Content-Security-Policy", value: csp },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
    ];
  },
};

// Wrap with Sentry webpack plugin. Options here are build-time only (source map
// upload, tunnel). Runtime config lives in sentry.{client,server,edge}.config.ts.
//
// To enable source map upload set these in CI/Vercel:
//   SENTRY_ORG, SENTRY_PROJECT, SENTRY_AUTH_TOKEN
//
// The tunnelRoute proxies Sentry events through /api/sentry-tunnel on our own
// origin, so no external Sentry domain is needed in the Content-Security-Policy
// and requests survive ad-blockers that block sentry.io outright.
export default withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,
  // Route browser SDK events through our own origin → no CSP exception needed
  tunnelRoute: "/api/sentry-tunnel",
  // Don't expose source maps in the browser network tab
  hideSourceMaps: true,
  // Suppress verbose Sentry CLI output in dev and CI logs
  silent: true,
  // Suppress the Sentry SDK logger in the client bundle (saves ~20 KB)
  disableLogger: true,
});

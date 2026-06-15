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

export default nextConfig;

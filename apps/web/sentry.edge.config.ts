import * as Sentry from "@sentry/nextjs";

// Minimal init for the Edge runtime (middleware). Same DSN and PII rules.
Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  enabled: process.env.NODE_ENV === "production",
  tracesSampleRate: 0,
  sendDefaultPii: false,
});

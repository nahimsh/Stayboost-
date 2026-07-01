import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  // Only report in production — avoids noise during local development
  enabled: process.env.NODE_ENV === "production",
  tracesSampleRate: 0, // Error monitoring only; performance tracing opt-in later
  sendDefaultPii: false, // Never auto-attach cookies, IP, or session to events

  beforeSend(event) {
    // Scrub PII from user context — only the anonymous user ID is safe to send
    if (event.user) {
      delete event.user.email;
      delete event.user.username;
      delete event.user.name;
    }
    // Scrub PII from breadcrumb data (e.g. form inputs, XHR args)
    event.breadcrumbs?.forEach((crumb) => {
      if (crumb.data) {
        delete crumb.data["email"];
        delete crumb.data["name"];
        delete crumb.data["phone"];
        delete crumb.data["guest_name"];
      }
    });
    return event;
  },
});

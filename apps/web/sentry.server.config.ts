import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  enabled: process.env.NODE_ENV === "production",
  tracesSampleRate: 0,
  sendDefaultPii: false,

  beforeSend(event) {
    if (event.user) {
      delete event.user.email;
      delete event.user.username;
      delete event.user.name;
    }
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

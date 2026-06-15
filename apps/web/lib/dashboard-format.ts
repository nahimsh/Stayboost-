import { getDictionary } from "@stayboost/i18n";

const t = getDictionary().dashboard;

/** Format an ISO date as Today / Tomorrow / "Mon 16 Jun". */
export function formatStayDate(iso: string, locale = "en-US"): string {
  const date = new Date(`${iso}T00:00:00Z`);
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  const diffDays = Math.round((date.getTime() - today.getTime()) / 86_400_000);
  if (diffDays === 0) return t.today;
  if (diffDays === 1) return t.tomorrow;
  return new Intl.DateTimeFormat(locale, { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" }).format(date);
}

/** Relative time like "3h ago" / "2d ago" for notifications & leads. */
export function formatRelative(iso: string, locale = "en-US"): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.round(diffMs / 60_000);
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });
  if (mins < 60) return rtf.format(-mins, "minute");
  const hours = Math.round(mins / 60);
  if (hours < 24) return rtf.format(-hours, "hour");
  return rtf.format(-Math.round(hours / 24), "day");
}

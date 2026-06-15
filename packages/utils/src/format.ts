/** Locale-aware formatting helpers used at the rendering edge. */

export function formatPercent(value: number, locale = "en-US", fractionDigits = 0): string {
  return new Intl.NumberFormat(locale, {
    style: "percent",
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(value);
}

export function formatNumber(value: number, locale = "en-US"): string {
  return new Intl.NumberFormat(locale).format(value);
}

/**
 * Format a UTC instant in a property's timezone. Storage is always UTC; the
 * timezone is applied only for display.
 */
export function formatDateTime(
  isoUtc: string,
  timeZone: string,
  locale = "en-US",
): string {
  return new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone,
  }).format(new Date(isoUtc));
}

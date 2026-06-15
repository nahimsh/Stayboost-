import { en, type Dictionary } from "./locales/en";

export type { Dictionary } from "./locales/en";

export const DEFAULT_LOCALE = "en" as const;

/** Locales whose script is written right-to-left. */
const RTL_LOCALES = new Set(["ar", "he", "fa", "ur"]);

const DICTIONARIES = {
  en,
} satisfies Record<string, Dictionary>;

export type Locale = keyof typeof DICTIONARIES;

export const SUPPORTED_LOCALES = Object.keys(DICTIONARIES) as Locale[];

export function isLocale(value: string): value is Locale {
  return value in DICTIONARIES;
}

export function getDictionary(locale: Locale = DEFAULT_LOCALE): Dictionary {
  return DICTIONARIES[locale];
}

export function textDirection(locale: string): "ltr" | "rtl" {
  return RTL_LOCALES.has(locale.split("-")[0] ?? locale) ? "rtl" : "ltr";
}

/**
 * Money is always represented as integer minor units + an ISO-4217 currency
 * code. Never use floats for money. These helpers convert at the edge only
 * (display / parsing user input), never for storage or arithmetic.
 */

export interface Money {
  readonly amountMinor: number;
  readonly currency: string;
}

/** Currencies whose minor unit is not 1/100 of the major unit. */
const MINOR_UNIT_EXPONENT: Readonly<Record<string, number>> = {
  JPY: 0,
  KRW: 0,
  VND: 0,
  CLP: 0,
  ISK: 0,
  BHD: 3,
  KWD: 3,
  OMR: 3,
  TND: 3,
};

const DEFAULT_EXPONENT = 2;

export function minorUnitExponent(currency: string): number {
  return MINOR_UNIT_EXPONENT[currency.toUpperCase()] ?? DEFAULT_EXPONENT;
}

export function makeMoney(amountMinor: number, currency: string): Money {
  if (!Number.isInteger(amountMinor)) {
    throw new TypeError(`Money amountMinor must be an integer, got ${amountMinor}`);
  }
  if (!/^[A-Z]{3}$/.test(currency)) {
    throw new TypeError(`Currency must be a 3-letter ISO code, got "${currency}"`);
  }
  return { amountMinor, currency };
}

/** Convert a major-unit number (e.g. 49.99) into minor units (4999). */
export function toMinorUnits(amountMajor: number, currency: string): number {
  const factor = 10 ** minorUnitExponent(currency);
  return Math.round(amountMajor * factor);
}

/**
 * Format money for display in a given locale. Edge-only — uses Intl, so the
 * stored integer is converted to a major-unit value purely for rendering.
 */
export function formatMoney(money: Money, locale = "en-US"): string {
  const factor = 10 ** minorUnitExponent(money.currency);
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: money.currency,
  }).format(money.amountMinor / factor);
}

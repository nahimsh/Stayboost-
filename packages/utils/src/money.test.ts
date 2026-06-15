import { describe, expect, it } from "vitest";
import { formatMoney, makeMoney, minorUnitExponent, toMinorUnits } from "./money";

describe("money", () => {
  it("rejects non-integer minor units", () => {
    expect(() => makeMoney(10.5, "USD")).toThrow(TypeError);
  });

  it("rejects malformed currency codes", () => {
    expect(() => makeMoney(1000, "usd")).toThrow(TypeError);
    expect(() => makeMoney(1000, "US")).toThrow(TypeError);
  });

  it("knows zero-decimal currencies", () => {
    expect(minorUnitExponent("JPY")).toBe(0);
    expect(minorUnitExponent("USD")).toBe(2);
    expect(minorUnitExponent("KWD")).toBe(3);
  });

  it("converts major to minor units per currency", () => {
    expect(toMinorUnits(49.99, "USD")).toBe(4999);
    expect(toMinorUnits(5000, "JPY")).toBe(5000);
    expect(toMinorUnits(1.5, "KWD")).toBe(1500);
  });

  it("formats money for display without float drift", () => {
    expect(formatMoney(makeMoney(4999, "USD"), "en-US")).toBe("$49.99");
    expect(formatMoney(makeMoney(5000, "JPY"), "ja-JP")).toBe("￥5,000");
  });
});

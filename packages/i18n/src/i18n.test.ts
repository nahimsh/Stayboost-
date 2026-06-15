import { describe, expect, it } from "vitest";
import { getDictionary, isLocale, textDirection } from "./index";

describe("i18n", () => {
  it("returns the english dictionary by default", () => {
    expect(getDictionary().common.brand).toBe("StayBoost");
  });

  it("detects supported locales", () => {
    expect(isLocale("en")).toBe(true);
    expect(isLocale("xx")).toBe(false);
  });

  it("resolves text direction including region subtags", () => {
    expect(textDirection("en")).toBe("ltr");
    expect(textDirection("ar")).toBe("rtl");
    expect(textDirection("ar-EG")).toBe("rtl");
  });
});

import { describe, expect, it } from "vitest";
import { PLAN_IDS, PLAN_LIST, PLANS, planSchema, priceForPeriod } from "./plans";

describe("plans catalog", () => {
  it("defines every plan id and validates against the schema", () => {
    for (const id of PLAN_IDS) {
      expect(() => planSchema.parse(PLANS[id])).not.toThrow();
    }
  });

  it("orders the plan list by tier", () => {
    expect(PLAN_LIST.map((p) => p.id)).toEqual(["starter", "growth", "pro", "portfolio"]);
  });

  it("annual pricing is cheaper than monthly for paid, non-custom plans", () => {
    for (const plan of PLAN_LIST) {
      const monthly = plan.price.monthlyMinor;
      const annual = plan.price.annualMonthlyMinor;
      if (monthly && annual) {
        expect(annual).toBeLessThan(monthly);
      }
    }
  });

  it("returns null price for the custom portfolio plan", () => {
    expect(priceForPeriod(PLANS.portfolio, "monthly")).toBeNull();
    expect(priceForPeriod(PLANS.growth, "annual")).toBe(3900);
  });
});

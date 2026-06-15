import { describe, expect, it } from "vitest";
import { propertyProfileInputSchema } from "./property-profile";
import { growthReportSchema } from "./growth-report";

const validProfile = {
  propertyName: "Sea Breeze Villa",
  propertyType: "villa" as const,
  country: "Portugal",
  city: "Lagos",
  unitsCount: 1,
  currency: "EUR",
  channels: ["airbnb", "direct"] as const,
  biggestChallenge: "more_bookings" as const,
};

describe("propertyProfileInputSchema", () => {
  it("accepts a minimal valid profile", () => {
    expect(propertyProfileInputSchema.safeParse(validProfile).success).toBe(true);
  });

  it("coerces numeric strings from the form", () => {
    const parsed = propertyProfileInputSchema.parse({
      ...validProfile,
      unitsCount: "3",
      occupancyPctLast30: "62.5",
    });
    expect(parsed.unitsCount).toBe(3);
    expect(parsed.occupancyPctLast30).toBe(62.5);
  });

  it("rejects an empty channel list and bad currency", () => {
    expect(propertyProfileInputSchema.safeParse({ ...validProfile, channels: [] }).success).toBe(false);
    expect(propertyProfileInputSchema.safeParse({ ...validProfile, currency: "eur" }).success).toBe(false);
  });
});

describe("growthReportSchema", () => {
  it("requires exactly four pillars and a confidence in [0,1]", () => {
    const report = growthReportSchema.safeParse({
      summary: "Strong direct-booking opportunity.",
      overallScore: 72,
      estimatedMonthlyUplift: { lowMinor: 50000, highMinor: 120000, currency: "EUR" },
      pillars: [],
      quickWins: [{ title: "Reply to reviews", action: "Enable AI review replies", pillar: "delight" }],
      confidence: 0.6,
      model: "heuristic-v1",
      engine: "heuristic",
      generatedAt: new Date().toISOString(),
    });
    // pillars length 0 != 4 → invalid
    expect(report.success).toBe(false);
  });
});

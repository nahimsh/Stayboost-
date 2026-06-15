import { describe, expect, it } from "vitest";
import { dashboardSnapshotSchema } from "./dashboard";

const snapshot = {
  property: { id: "p1", name: "Sea Breeze Villa", type: "villa" },
  generatedAt: new Date().toISOString(),
  demo: true,
  revenue: {
    currency: "EUR",
    monthToDateMinor: 1_840_00,
    trend: { deltaPct: 12.4, direction: "up" as const },
    adrMinor: 18_000,
    revparMinor: 12_600,
    dailyMinor: [10000, 12000, 9000],
  },
  occupancy: {
    currentPct: 70,
    targetPct: 80,
    occupiedUnits: 7,
    totalUnits: 10,
    next7Days: [{ date: "2026-06-16", pct: 72 }],
  },
  checkIns: [
    { id: "s1", guestName: "Ana", unitName: "Unit 1", date: "2026-06-16", nights: 3, guests: 2, status: "confirmed" as const },
  ],
  checkOuts: [],
  recommendations: [
    { id: "r1", pillar: "acquire" as const, title: "Raise weekend rates", detail: "Demand is high.", impactLabel: "+€120/wk", severity: "high" as const },
  ],
  health: { score: 82, grade: "A" as const, factors: [{ label: "Reviews", score: 90, weightPct: 25 }] },
  leads: [
    { id: "l1", name: "Sam", source: "website" as const, interest: "Direct booking", createdAt: new Date().toISOString(), status: "new" as const },
  ],
  notifications: [
    { id: "n1", type: "booking" as const, title: "New booking", body: "3 nights", createdAt: new Date().toISOString(), read: false, severity: "low" as const },
  ],
};

describe("dashboardSnapshotSchema", () => {
  it("accepts a complete snapshot", () => {
    expect(dashboardSnapshotSchema.safeParse(snapshot).success).toBe(true);
  });

  it("rejects an out-of-range occupancy", () => {
    const bad = { ...snapshot, occupancy: { ...snapshot.occupancy, currentPct: 140 } };
    expect(dashboardSnapshotSchema.safeParse(bad).success).toBe(false);
  });

  it("rejects an invalid health grade", () => {
    const bad = { ...snapshot, health: { ...snapshot.health, grade: "F" } };
    expect(dashboardSnapshotSchema.safeParse(bad).success).toBe(false);
  });
});

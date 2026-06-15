import { describe, expect, it } from "vitest";
import { dashboardSnapshotSchema } from "@stayboost/domain";
import { SampleDashboardProvider } from "./sample-data.provider";

describe("SampleDashboardProvider", () => {
  const provider = new SampleDashboardProvider();

  it("produces a snapshot that satisfies the shared contract", () => {
    const snapshot = provider.build();
    expect(() => dashboardSnapshotSchema.parse(snapshot)).not.toThrow();
  });

  it("is deterministic for the same day", () => {
    const a = provider.build();
    const b = provider.build();
    expect(a.revenue.dailyMinor).toEqual(b.revenue.dailyMinor);
    expect(a.occupancy.next7Days).toEqual(b.occupancy.next7Days);
  });

  it("marks the data as demo and includes all eight widgets' data", () => {
    const s = provider.build();
    expect(s.demo).toBe(true);
    expect(s.revenue.dailyMinor.length).toBeGreaterThan(0);
    expect(s.checkIns.length).toBeGreaterThan(0);
    expect(s.checkOuts.length).toBeGreaterThan(0);
    expect(s.recommendations.length).toBeGreaterThan(0);
    expect(s.leads.length).toBeGreaterThan(0);
    expect(s.notifications.length).toBeGreaterThan(0);
  });

  it("uses the passed property name", () => {
    expect(provider.build("Mountain Lodge").property.name).toBe("Mountain Lodge");
  });
});

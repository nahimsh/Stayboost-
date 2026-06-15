import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { GrowthReport } from "@stayboost/domain";
import { GrowthReportView } from "./growth-report-view";

const report: GrowthReport = {
  summary: "Strong direct-booking opportunity for your villa.",
  overallScore: 68,
  estimatedMonthlyUplift: { lowMinor: 50000, highMinor: 120000, currency: "EUR" },
  pillars: [
    { pillar: "acquire", score: 60, headline: "Fill more nights", findings: [
      { title: "No direct channel", severity: "high", rationale: "All via OTAs.", recommendedAction: "Launch direct funnel.", estimatedImpact: "Save 15%" },
    ] },
    { pillar: "monetize", score: 65, headline: "Grow revenue", findings: [] },
    { pillar: "automate", score: 70, headline: "Save time", findings: [] },
    { pillar: "delight", score: 72, headline: "5-star reviews", findings: [] },
  ],
  quickWins: [{ title: "Turn on dynamic pricing", action: "Let AI price your nights.", pillar: "acquire" }],
  confidence: 0.55,
  model: "heuristic-v1",
  engine: "heuristic",
  generatedAt: new Date().toISOString(),
};

describe("GrowthReportView", () => {
  it("renders the overall score and a formatted uplift range", () => {
    render(<GrowthReportView report={report} />);
    expect(screen.getByText("68")).toBeInTheDocument();
    // EUR minor units formatted as currency
    expect(screen.getByText(/€500.*€1,200/)).toBeInTheDocument();
  });

  it("renders all four pillars and the quick win", () => {
    render(<GrowthReportView report={report} />);
    for (const name of ["Acquire", "Monetize", "Automate", "Delight"]) {
      expect(screen.getByRole("heading", { name })).toBeInTheDocument();
    }
    expect(screen.getByText("Turn on dynamic pricing")).toBeInTheDocument();
  });
});

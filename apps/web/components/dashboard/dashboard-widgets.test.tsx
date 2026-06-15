import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { RevenueOverview, Stay } from "@stayboost/domain";
import { getDictionary } from "@stayboost/i18n";
import { RevenueWidget } from "./revenue-widget";
import { StaysWidget } from "./stays-widget";

const revenue: RevenueOverview = {
  currency: "EUR",
  monthToDateMinor: 184_000,
  trend: { deltaPct: 12.4, direction: "up" },
  adrMinor: 18_500,
  revparMinor: 13_320,
  dailyMinor: [10000, 12000, 9000, 14000],
};

describe("RevenueWidget", () => {
  it("renders the month-to-date total and ADR/RevPAR", () => {
    render(<RevenueWidget data={revenue} />);
    expect(screen.getByText("€1,840.00")).toBeInTheDocument();
    expect(screen.getByText("€185.00")).toBeInTheDocument(); // ADR
  });
});

describe("StaysWidget", () => {
  const d = getDictionary().dashboard;
  const stays: Stay[] = [
    { id: "s1", guestName: "Ana Ferreira", unitName: "Ocean Suite", date: "2026-06-16", nights: 4, guests: 2, status: "due" },
  ];

  it("renders a stay with its status badge", () => {
    render(<StaysWidget title={d.widgets.checkIns.title} stays={stays} emptyMessage={d.widgets.checkIns.empty} />);
    expect(screen.getByText("Ana Ferreira")).toBeInTheDocument();
    expect(screen.getByText(d.stayStatus.due)).toBeInTheDocument();
  });

  it("shows the empty state when there are no stays", () => {
    render(<StaysWidget title={d.widgets.checkOuts.title} stays={[]} emptyMessage={d.widgets.checkOuts.empty} />);
    expect(screen.getByText(d.widgets.checkOuts.empty)).toBeInTheDocument();
  });
});

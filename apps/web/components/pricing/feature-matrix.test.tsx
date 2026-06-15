import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { getDictionary } from "@stayboost/i18n";
import { FeatureMatrix } from "./feature-matrix";

describe("FeatureMatrix", () => {
  const t = getDictionary().pricing;

  it("renders a column header for every plan (in the desktop table)", () => {
    render(<FeatureMatrix />);
    const table = screen.getByRole("table");
    for (const plan of ["Starter", "Growth", "Pro", "Portfolio"]) {
      expect(within(table).getByRole("columnheader", { name: plan })).toBeInTheDocument();
    }
  });

  it("renders every feature as a row header", () => {
    render(<FeatureMatrix />);
    const table = screen.getByRole("table");
    for (const row of t.matrix.rows) {
      expect(within(table).getByRole("rowheader", { name: row.label })).toBeInTheDocument();
    }
  });
});

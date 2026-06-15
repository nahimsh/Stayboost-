import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { getDictionary } from "@stayboost/i18n";
import { GrowthLoop } from "./growth-loop";

describe("GrowthLoop", () => {
  const t = getDictionary().landing.loop;

  it("renders the section heading", () => {
    render(<GrowthLoop />);
    expect(screen.getByRole("heading", { level: 2, name: t.title })).toBeInTheDocument();
  });

  it("renders every step in an ordered list", () => {
    render(<GrowthLoop />);
    for (const step of t.steps) {
      expect(screen.getByRole("heading", { level: 3, name: step.title })).toBeInTheDocument();
    }
  });
});

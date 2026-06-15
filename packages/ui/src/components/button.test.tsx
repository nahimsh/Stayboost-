import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Button } from "./button";

describe("Button", () => {
  it("renders its label", () => {
    render(<Button>Analyze</Button>);
    expect(screen.getByRole("button", { name: "Analyze" })).toBeDefined();
  });

  it("defaults to type=button to avoid accidental form submits", () => {
    render(<Button>Safe</Button>);
    expect(screen.getByRole("button").getAttribute("type")).toBe("button");
  });

  it("applies the requested variant classes", () => {
    render(<Button variant="accent">Go</Button>);
    expect(screen.getByRole("button").className).toContain("bg-accent");
  });
});

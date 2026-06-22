import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { dashboardSnapshotSchema } from "@stayboost/domain";
import { getDictionary } from "@stayboost/i18n";
import { DEMO_USER, demoSnapshot } from "@/lib/demo-data";
import { DemoDashboard } from "./demo-dashboard";

const push = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
  usePathname: () => "/demo",
}));

const t = getDictionary().dashboard;

describe("demoSnapshot", () => {
  it("satisfies the shared dashboard contract and is flagged as demo", () => {
    const snapshot = demoSnapshot();
    expect(() => dashboardSnapshotSchema.parse(snapshot)).not.toThrow();
    expect(snapshot.demo).toBe(true);
  });
});

describe("DemoDashboard", () => {
  it("renders the command center with sample data and no API calls", () => {
    render(<DemoDashboard />);
    expect(screen.getByText(t.demo.title)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: t.demo.signup })).toHaveAttribute("href", "/signup");
    // Greets the fictional demo operator, proving sample data rendered.
    const firstName = DEMO_USER.name.split(/\s+/)[0] ?? DEMO_USER.name;
    expect(screen.getByRole("heading", { name: `${t.greeting}, ${firstName}` })).toBeInTheDocument();
  });
});

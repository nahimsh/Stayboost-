import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { getDictionary } from "@stayboost/i18n";
import { OnboardingWizard } from "./onboarding-wizard";

const replace = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ replace }) }));

const me = vi.fn();
const create = vi.fn();
vi.mock("@/lib/api", () => ({
  api: { auth: { me: () => me() }, properties: { create: (i: unknown) => create(i) } },
}));

const t = getDictionary().onboarding;

beforeEach(() => {
  replace.mockClear();
  me.mockReset();
  create.mockReset();
});

describe("OnboardingWizard", () => {
  it("redirects already-onboarded users to the dashboard", async () => {
    me.mockResolvedValue({ onboardingComplete: true });
    render(<OnboardingWizard />);
    await waitFor(() => expect(replace).toHaveBeenCalledWith("/dashboard"));
  });

  it("redirects unauthenticated users to login", async () => {
    me.mockRejectedValue(new Error("401"));
    render(<OnboardingWizard />);
    await waitFor(() => expect(replace).toHaveBeenCalledWith("/login"));
  });

  it("advances from basics to channels once required fields are filled", async () => {
    me.mockResolvedValue({ onboardingComplete: false });
    render(<OnboardingWizard />);

    const nameInput = await screen.findByLabelText(t.fields.name);
    fireEvent.change(nameInput, { target: { value: "Sea Breeze Villa" } });
    fireEvent.change(screen.getByLabelText(t.fields.country), { target: { value: "Portugal" } });
    fireEvent.change(screen.getByLabelText(t.fields.city), { target: { value: "Lagos" } });
    fireEvent.click(screen.getByRole("button", { name: t.next }));

    expect(await screen.findByLabelText(/Airbnb listing URL/i)).toBeInTheDocument();
  });
});

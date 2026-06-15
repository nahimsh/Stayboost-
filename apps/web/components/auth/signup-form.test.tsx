import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { getDictionary } from "@stayboost/i18n";
import { SignupForm } from "./signup-form";

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));
vi.mock("@/lib/api", () => ({ api: { auth: { signup: vi.fn(), googleUrl: vi.fn() } } }));

describe("SignupForm", () => {
  const t = getDictionary().auth;

  it("renders the key fields and Google option", () => {
    render(<SignupForm />);
    expect(screen.getByLabelText(t.common.nameLabel)).toBeInTheDocument();
    expect(screen.getByLabelText(t.common.orgLabel)).toBeInTheDocument();
    expect(screen.getByLabelText(t.common.passwordLabel)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: t.common.continueWithGoogle })).toBeInTheDocument();
  });

  it("blocks submission and does not call the API on a weak password", async () => {
    render(<SignupForm />);
    fireEvent.change(screen.getByLabelText(t.common.nameLabel), { target: { value: "Maya Host" } });
    fireEvent.change(screen.getByLabelText(t.common.orgLabel), { target: { value: "Sea Breeze" } });
    fireEvent.change(screen.getByLabelText(t.common.emailLabel), { target: { value: "maya@example.com" } });
    fireEvent.change(screen.getByLabelText(t.common.passwordLabel), { target: { value: "weak" } });
    fireEvent.click(screen.getByRole("button", { name: t.signup.submit }));

    expect(await screen.findByRole("alert")).toHaveTextContent(t.common.invalidFields);
    const { api } = await import("@/lib/api");
    expect(api.auth.signup).not.toHaveBeenCalled();
  });
});

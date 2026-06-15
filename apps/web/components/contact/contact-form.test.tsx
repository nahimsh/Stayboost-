import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { getDictionary } from "@stayboost/i18n";
import { ContactForm } from "./contact-form";

// The form should never hit the network when client validation fails.
vi.mock("@/lib/api", () => ({
  api: { contact: { submit: vi.fn() } },
}));

describe("ContactForm", () => {
  const t = getDictionary().contact;

  it("renders all labelled fields", () => {
    render(<ContactForm />);
    expect(screen.getByLabelText(t.form.name)).toBeInTheDocument();
    expect(screen.getByLabelText(t.form.email)).toBeInTheDocument();
    expect(screen.getByLabelText(t.form.message)).toBeInTheDocument();
  });

  it("blocks submission and shows an error when fields are empty", async () => {
    render(<ContactForm />);
    fireEvent.click(screen.getByRole("button", { name: t.form.submit }));
    expect(await screen.findByRole("alert")).toHaveTextContent(t.error.required);
    const { api } = await import("@/lib/api");
    expect(api.contact.submit).not.toHaveBeenCalled();
  });
});

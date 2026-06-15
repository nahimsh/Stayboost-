import { describe, expect, it } from "vitest";
import { contactLeadInputSchema } from "./contact-lead";

const valid = {
  name: "Maya Host",
  email: "Maya@Example.com",
  reason: "sales" as const,
  message: "I run three villas and want more direct bookings.",
};

describe("contactLeadInputSchema", () => {
  it("accepts a valid lead and normalizes the email", () => {
    const parsed = contactLeadInputSchema.parse(valid);
    expect(parsed.email).toBe("maya@example.com");
  });

  it("rejects short messages and bad emails", () => {
    expect(contactLeadInputSchema.safeParse({ ...valid, message: "hi" }).success).toBe(false);
    expect(contactLeadInputSchema.safeParse({ ...valid, email: "nope" }).success).toBe(false);
  });

  it("accepts the honeypot field (server decides what to do with it)", () => {
    const parsed = contactLeadInputSchema.safeParse({ ...valid, website: "spam" });
    expect(parsed.success).toBe(true);
  });

  it("coerces propertyCount from a string", () => {
    const parsed = contactLeadInputSchema.parse({ ...valid, propertyCount: "12" });
    expect(parsed.propertyCount).toBe(12);
  });
});

import { describe, expect, it } from "vitest";
import { passwordSchema, roleAtLeast, signupInputSchema } from "./auth";

describe("roleAtLeast", () => {
  it("ranks roles by privilege", () => {
    expect(roleAtLeast("owner", "manager")).toBe(true);
    expect(roleAtLeast("staff", "manager")).toBe(false);
    expect(roleAtLeast("super_admin", "owner")).toBe(true);
    expect(roleAtLeast("manager", "manager")).toBe(true);
  });
});

describe("passwordSchema", () => {
  it("requires length and a character mix", () => {
    expect(passwordSchema.safeParse("short1A").success).toBe(false);
    expect(passwordSchema.safeParse("alllowercase123").success).toBe(false);
    expect(passwordSchema.safeParse("ValidPassw0rd!!").success).toBe(true);
  });
});

describe("signupInputSchema", () => {
  it("normalizes email and enforces password policy", () => {
    const parsed = signupInputSchema.parse({
      name: "Maya Host",
      email: "Maya@Example.com",
      password: "ValidPassw0rd!!",
      organizationName: "Sea Breeze Villas",
    });
    expect(parsed.email).toBe("maya@example.com");
  });

  it("rejects weak passwords", () => {
    expect(
      signupInputSchema.safeParse({
        name: "Maya",
        email: "m@e.com",
        password: "weak",
        organizationName: "Org",
      }).success,
    ).toBe(false);
  });
});

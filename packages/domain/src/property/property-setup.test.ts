import { describe, expect, it } from "vitest";
import { propertySetupInputSchema } from "./property-setup";

const base = {
  name: "Sea Breeze Villa",
  type: "villa" as const,
  country: "Portugal",
  city: "Lagos",
  roomsCount: 4,
};

describe("propertySetupInputSchema", () => {
  it("accepts a minimal property and coerces room count", () => {
    const parsed = propertySetupInputSchema.parse({ ...base, roomsCount: "4" });
    expect(parsed.roomsCount).toBe(4);
  });

  it("treats blank optional URLs as undefined", () => {
    const parsed = propertySetupInputSchema.parse({ ...base, airbnbUrl: "", websiteUrl: "  " });
    expect(parsed.airbnbUrl).toBeUndefined();
    expect(parsed.websiteUrl).toBeUndefined();
  });

  it("validates provided URLs and emails", () => {
    expect(propertySetupInputSchema.safeParse({ ...base, airbnbUrl: "not-a-url" }).success).toBe(false);
    expect(propertySetupInputSchema.safeParse({ ...base, contactEmail: "bad" }).success).toBe(false);
    expect(
      propertySetupInputSchema.safeParse({
        ...base,
        airbnbUrl: "https://airbnb.com/rooms/123",
        contactEmail: "Host@Example.com",
      }).success,
    ).toBe(true);
  });

  it("requires at least one room", () => {
    expect(propertySetupInputSchema.safeParse({ ...base, roomsCount: 0 }).success).toBe(false);
  });
});

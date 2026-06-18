import { describe, expect, it } from "vitest";
import { createChannelConnectionInputSchema, reservationSchema } from "./reservation";

describe("reservationSchema", () => {
  it("accepts a normalized reservation", () => {
    const r = reservationSchema.safeParse({
      id: "r1",
      propertyId: "p1",
      channel: "airbnb",
      source: "ical:airbnb",
      externalId: "abc123",
      status: "confirmed",
      checkIn: "2026-06-20",
      checkOut: "2026-06-24",
      nights: 4,
      guestName: "Ana",
    });
    expect(r.success).toBe(true);
  });

  it("rejects an unknown channel/status", () => {
    expect(reservationSchema.safeParse({ channel: "myspace" }).success).toBe(false);
  });
});

describe("createChannelConnectionInputSchema", () => {
  it("requires a valid iCal URL and provider", () => {
    expect(
      createChannelConnectionInputSchema.safeParse({
        propertyId: "11111111-1111-1111-1111-111111111111",
        provider: "airbnb",
        icalUrl: "https://www.airbnb.com/calendar/ical/123.ics?s=abc",
      }).success,
    ).toBe(true);
    expect(
      createChannelConnectionInputSchema.safeParse({
        propertyId: "11111111-1111-1111-1111-111111111111",
        provider: "airbnb",
        icalUrl: "not-a-url",
      }).success,
    ).toBe(false);
  });
});

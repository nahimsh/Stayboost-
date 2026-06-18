import { describe, expect, it } from "vitest";
import { normalizeEvent, parseIcal, reservationsFromIcal } from "./ical";

const SAMPLE = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Airbnb Inc//Hosting Calendar//EN
BEGIN:VEVENT
DTSTART;VALUE=DATE:20260620
DTEND;VALUE=DATE:20260624
UID:abc123@airbnb.com
SUMMARY:Reserved
DESCRIPTION:Reservation URL: https://www.airbnb.com/hosting/reservations/details/HMABC
END:VEVENT
BEGIN:VEVENT
DTSTART;VALUE=DATE:20260701
DTEND;VALUE=DATE:20260705
UID:block-1@airbnb.com
SUMMARY:Airbnb (Not available)
END:VEVENT
BEGIN:VEVENT
DTSTART:20260710T150000Z
DTEND:20260712T110000Z
UID:dt-1@airbnb.com
SUMMARY:Maria Gomez
END:VEVENT
END:VCALENDAR`;

describe("parseIcal", () => {
  it("parses VEVENTs with DATE and DATE-TIME values", () => {
    const events = parseIcal(SAMPLE);
    expect(events).toHaveLength(3);
    expect(events[0]).toMatchObject({ uid: "abc123@airbnb.com", start: "2026-06-20", end: "2026-06-24" });
    expect(events[2]?.start).toBe("2026-07-10");
  });

  it("unfolds folded lines (one leading whitespace is removed per RFC 5545)", () => {
    const folded = "BEGIN:VEVENT\nUID:u1\nSUMMARY:Long\n Name\nDTSTART;VALUE=DATE:20260101\nDTEND;VALUE=DATE:20260102\nEND:VEVENT";
    expect(parseIcal(folded)[0]?.summary).toBe("LongName");
  });
});

describe("normalizeEvent", () => {
  const ev = (i: number) => {
    const e = parseIcal(SAMPLE)[i];
    if (!e) throw new Error(`no event at ${i}`);
    return e;
  };

  it("maps a reservation to confirmed with correct nights", () => {
    const norm = normalizeEvent(ev(0), "airbnb");
    expect(norm.status).toBe("confirmed");
    expect(norm.nights).toBe(4);
    expect(norm.channel).toBe("airbnb");
    expect(norm.source).toBe("ical:airbnb");
    expect(norm.guestName).toBeNull(); // "Reserved" is generic
  });

  it("flags calendar blocks as blocked", () => {
    expect(normalizeEvent(ev(1), "airbnb").status).toBe("blocked");
  });

  it("captures a guest name when the summary is a real name", () => {
    expect(normalizeEvent(ev(2), "airbnb").guestName).toBe("Maria Gomez");
  });
});

describe("reservationsFromIcal", () => {
  it("returns one canonical reservation per event", () => {
    expect(reservationsFromIcal(SAMPLE, "booking_com")).toHaveLength(3);
  });
});

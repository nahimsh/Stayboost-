import type { CanonicalReservation, Channel, ChannelProvider } from "@stayboost/domain";

export interface IcalEvent {
  uid: string;
  summary: string;
  start: string; // YYYY-MM-DD
  end: string; // YYYY-MM-DD (exclusive, per iCal convention)
}

/** Unfold RFC-5545 folded lines (continuations begin with a space or tab). */
function unfold(text: string): string[] {
  const raw = text.replace(/\r\n/g, "\n").split("\n");
  const out: string[] = [];
  for (const line of raw) {
    if ((line.startsWith(" ") || line.startsWith("\t")) && out.length > 0) {
      out[out.length - 1] += line.slice(1);
    } else {
      out.push(line);
    }
  }
  return out;
}

/** Extract YYYY-MM-DD from a DTSTART/DTEND value (DATE or DATE-TIME). */
function toDate(value: string): string | null {
  const m = value.match(/(\d{4})(\d{2})(\d{2})/);
  return m ? `${m[1]}-${m[2]}-${m[3]}` : null;
}

/** Parse the VEVENT blocks of an iCalendar document into typed events. */
export function parseIcal(text: string): IcalEvent[] {
  const lines = unfold(text);
  const events: IcalEvent[] = [];
  let cur: Partial<IcalEvent> | null = null;

  for (const line of lines) {
    if (line === "BEGIN:VEVENT") {
      cur = {};
      continue;
    }
    if (line === "END:VEVENT") {
      if (cur?.uid && cur.start && cur.end) {
        events.push({ uid: cur.uid, summary: cur.summary ?? "", start: cur.start, end: cur.end });
      }
      cur = null;
      continue;
    }
    if (!cur) continue;

    const idx = line.indexOf(":");
    if (idx === -1) continue;
    const key = line.slice(0, idx).split(";")[0]?.toUpperCase() ?? "";
    const value = line.slice(idx + 1);

    if (key === "UID") cur.uid = value.trim();
    else if (key === "SUMMARY") cur.summary = value.trim();
    else if (key === "DTSTART") {
      const d = toDate(value);
      if (d) cur.start = d;
    } else if (key === "DTEND") {
      const d = toDate(value);
      if (d) cur.end = d;
    }
  }
  return events;
}

const BLOCK_KEYWORDS = ["not available", "blocked", "closed", "unavailable"];
const GENERIC_SUMMARIES = new Set(["reserved", "reservation", "busy", "airbnb", "booking.com"]);

function nightsBetween(start: string, end: string): number {
  const ms = Date.parse(`${end}T00:00:00Z`) - Date.parse(`${start}T00:00:00Z`);
  return Math.max(1, Math.round(ms / 86_400_000));
}

function channelFor(provider: ChannelProvider): Channel {
  if (provider === "airbnb") return "airbnb";
  if (provider === "booking_com") return "booking_com";
  return "other";
}

/** Normalize an iCal event into a canonical reservation for a given provider. */
export function normalizeEvent(event: IcalEvent, provider: ChannelProvider): CanonicalReservation {
  const summaryLower = event.summary.toLowerCase();
  const isBlock = BLOCK_KEYWORDS.some((k) => summaryLower.includes(k));
  const guestName =
    !isBlock && event.summary && !GENERIC_SUMMARIES.has(summaryLower) ? event.summary : null;

  return {
    channel: channelFor(provider),
    source: `ical:${provider}`,
    externalId: event.uid,
    status: isBlock ? "blocked" : "confirmed",
    checkIn: event.start,
    checkOut: event.end,
    nights: nightsBetween(event.start, event.end),
    guestName,
  };
}

/** Parse + normalize an iCal document into canonical reservations. */
export function reservationsFromIcal(
  text: string,
  provider: ChannelProvider,
): CanonicalReservation[] {
  return parseIcal(text).map((e) => normalizeEvent(e, provider));
}

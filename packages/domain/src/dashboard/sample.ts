import type {
  AiRecommendation,
  DashboardSnapshot,
  Lead,
  NotificationItem,
  Stay,
} from "./dashboard";

/**
 * Context that personalises the sample dashboard to a real property when one is
 * known (name, type, unit count). Everything else is deterministic sample data.
 */
export interface SampleDashboardContext {
  propertyName?: string;
  propertyType?: string;
  totalUnits?: number;
}

/** Deterministic seeded RNG so the demo snapshot is stable across requests/tests. */
function mulberry32(seed: number): () => number {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function isoDateOffset(days: number): string {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

function isoAgo(hours: number): string {
  return new Date(Date.now() - hours * 3_600_000).toISOString();
}

const CURRENCY = "EUR";

function sampleCheckIns(): Stay[] {
  return [
    { id: "ci-1", guestName: "Ana Ferreira", unitName: "Ocean Suite", date: isoDateOffset(0), nights: 4, guests: 2, status: "due" },
    { id: "ci-2", guestName: "Marcus Lind", unitName: "Garden Room", date: isoDateOffset(0), nights: 2, guests: 1, status: "confirmed" },
    { id: "ci-3", guestName: "The Patels", unitName: "Pool Villa", date: isoDateOffset(1), nights: 6, guests: 5, status: "confirmed" },
    { id: "ci-4", guestName: "Yuki Tanaka", unitName: "Cliff Studio", date: isoDateOffset(2), nights: 3, guests: 2, status: "pending" },
  ];
}

function sampleCheckOuts(): Stay[] {
  return [
    { id: "co-1", guestName: "Sofia Rossi", unitName: "Ocean Suite", date: isoDateOffset(0), nights: 5, guests: 3, status: "checked_in" },
    { id: "co-2", guestName: "James Okoro", unitName: "Cliff Studio", date: isoDateOffset(1), nights: 2, guests: 2, status: "checked_in" },
  ];
}

function sampleRecommendations(): AiRecommendation[] {
  return [
    { id: "rec-1", pillar: "acquire", title: "Raise weekend rates by ~8%", detail: "Demand for next weekend is outpacing supply in your area.", impactLabel: "+€220 est.", severity: "high" },
    { id: "rec-2", pillar: "delight", title: "3 reviews awaiting a reply", detail: "Responding within 24h lifts ranking and guest trust.", impactLabel: "Ranking boost", severity: "medium" },
    { id: "rec-3", pillar: "monetize", title: "Offer early check-in to 2 arrivals", detail: "Both guests arrive after long-haul flights — a likely upsell.", impactLabel: "+€60 est.", severity: "low" },
  ];
}

function sampleLeads(): Lead[] {
  return [
    { id: "ld-1", name: "Priya Nair", source: "website", interest: "Direct booking — 7 nights", createdAt: isoAgo(3), status: "new" },
    { id: "ld-2", name: "Tom Becker", source: "campaign", interest: "Win-back offer", createdAt: isoAgo(9), status: "contacted" },
    { id: "ld-3", name: "Elena Costa", source: "referral", interest: "Group stay enquiry", createdAt: isoAgo(26), status: "qualified" },
  ];
}

function sampleNotifications(): NotificationItem[] {
  return [
    { id: "nt-1", type: "booking", title: "New booking", body: "Pool Villa · 6 nights · The Patels", createdAt: isoAgo(1), read: false, severity: "low" },
    { id: "nt-2", type: "review", title: "New 5★ review", body: "“Stunning views and spotless.”", createdAt: isoAgo(5), read: false, severity: "low" },
    { id: "nt-3", type: "pricing", title: "Price suggestion ready", body: "AI suggests raising weekend rates.", createdAt: isoAgo(7), read: true, severity: "medium" },
  ];
}

/**
 * Builds a realistic dashboard snapshot from sample data. This is the seam the
 * real Reservations / Revenue / Reviews modules will replace — the API contract
 * and the frontend stay unchanged when live data lands. Always marked
 * `demo: true`. Used by the API's sample provider and by the public `/demo` page.
 */
export function buildSampleDashboardSnapshot(ctx: SampleDashboardContext = {}): DashboardSnapshot {
  const propertyName = ctx.propertyName ?? "Sea Breeze Villa";
  const totalUnits = Math.max(1, ctx.totalUnits ?? 10);
  const occupiedUnits = Math.round(totalUnits * 0.7);
  const rng = mulberry32(42);
  const dayOfMonth = new Date().getUTCDate();

  // Daily revenue for the month so far: a believable noisy upward series.
  const dailyMinor = Array.from({ length: dayOfMonth }, (_, i) => {
    const base = 14_000 + i * 120;
    const noise = Math.round((rng() - 0.4) * 6_000);
    return Math.max(0, base + noise);
  });
  const monthToDateMinor = dailyMinor.reduce((sum, v) => sum + v, 0);

  return {
    property: { id: "demo-property", name: propertyName, type: ctx.propertyType ?? "villa" },
    generatedAt: new Date().toISOString(),
    demo: true,
    revenue: {
      currency: CURRENCY,
      monthToDateMinor,
      trend: { deltaPct: 12.4, direction: "up" },
      adrMinor: 18_500,
      revparMinor: 13_320,
      dailyMinor,
    },
    occupancy: {
      currentPct: 72,
      targetPct: 80,
      occupiedUnits,
      totalUnits,
      next7Days: Array.from({ length: 7 }, (_, i) => ({
        date: isoDateOffset(i),
        pct: Math.round(55 + rng() * 40),
      })),
    },
    checkIns: sampleCheckIns(),
    checkOuts: sampleCheckOuts(),
    recommendations: sampleRecommendations(),
    health: {
      score: 84,
      grade: "A",
      factors: [
        { label: "Review score", score: 92, weightPct: 30 },
        { label: "Response time", score: 70, weightPct: 25 },
        { label: "Pricing health", score: 88, weightPct: 25 },
        { label: "Channel mix", score: 80, weightPct: 20 },
      ],
    },
    leads: sampleLeads(),
    notifications: sampleNotifications(),
  };
}

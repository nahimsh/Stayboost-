import { describe, expect, it, vi, beforeEach } from "vitest";
import { dashboardSnapshotSchema } from "@stayboost/domain";
import { DashboardService } from "./dashboard.service";

const PROPERTY = {
  id: "prop-1",
  name: "Sea View Hotel",
  type: "hotel" as const,
  roomsCount: 10,
  country: "US",
  city: "Miami",
  airbnbUrl: null,
  bookingUrl: null,
  websiteUrl: null,
};
const ORG_ID = "org-1";

function makeMetrics(hasData: boolean) {
  if (!hasData) {
    return {
      hasData: false,
      checkIns: [],
      checkOuts: [],
      occupancy: {
        currentPct: 0,
        targetPct: 80,
        occupiedUnits: 0,
        totalUnits: 10,
        next7Days: Array.from({ length: 7 }, (_, i) => ({
          date: new Date(Date.now() + i * 86_400_000).toISOString().slice(0, 10),
          pct: 0,
        })),
      },
    };
  }
  return {
    hasData: true,
    checkIns: [
      {
        id: "r-1",
        guestName: "Alice",
        unitName: "Sea View Hotel",
        date: new Date().toISOString().slice(0, 10),
        nights: 3,
        guests: 1,
        status: "confirmed" as const,
      },
    ],
    checkOuts: [],
    occupancy: {
      currentPct: 71,
      targetPct: 80,
      occupiedUnits: 5,
      totalUnits: 10,
      next7Days: Array.from({ length: 7 }, (_, i) => ({
        date: new Date(Date.now() + i * 86_400_000).toISOString().slice(0, 10),
        pct: i < 5 ? 100 : 0,
      })),
    },
  };
}

function makePrisma(opts: {
  notifications?: object[];
  leads?: object[];
  connections?: object[];
}) {
  const notifications = opts.notifications ?? [];
  const leads = opts.leads ?? [];
  const connections = opts.connections ?? [];

  return {
    withTenant: vi.fn((_orgId: string, fn: (tx: unknown) => Promise<unknown>) =>
      fn({
        notification: {
          findMany: vi.fn().mockResolvedValue(notifications),
        },
        channelConnection: {
          findMany: vi.fn().mockResolvedValue(connections),
        },
      }),
    ),
    contactLead: {
      findMany: vi.fn().mockResolvedValue(leads),
    },
  };
}

describe("DashboardService", () => {
  describe("snapshot — no live data", () => {
    let service: DashboardService;
    beforeEach(() => {
      const prisma = makePrisma({});
      const reservations = { metrics: vi.fn().mockResolvedValue(makeMetrics(false)) };
      service = new DashboardService(prisma as never, reservations as never);
    });

    it("returns a valid DashboardSnapshot", async () => {
      const result = await service.snapshot(ORG_ID, PROPERTY);
      expect(() => dashboardSnapshotSchema.parse(result)).not.toThrow();
    });

    it("sets demo:true when no reservation data exists", async () => {
      const result = await service.snapshot(ORG_ID, PROPERTY);
      expect(result.demo).toBe(true);
    });

    it("falls back to sample notifications when DB is empty", async () => {
      const result = await service.snapshot(ORG_ID, PROPERTY);
      expect(result.notifications.length).toBeGreaterThan(0);
    });

    it("falls back to sample leads when DB is empty", async () => {
      const result = await service.snapshot(ORG_ID, PROPERTY);
      expect(result.leads.length).toBeGreaterThan(0);
    });

    it("returns health with grade D when no channels connected", async () => {
      const result = await service.snapshot(ORG_ID, PROPERTY);
      expect(result.health.grade).toBe("D");
      expect(result.health.score).toBe(0);
    });
  });

  describe("snapshot — live reservation data", () => {
    let service: DashboardService;
    beforeEach(() => {
      const prisma = makePrisma({
        notifications: [
          {
            id: "n-1",
            orgId: ORG_ID,
            propertyId: PROPERTY.id,
            type: "booking",
            title: "New booking",
            body: "Alice checked in.",
            severity: "low",
            read: false,
            createdAt: new Date(),
          },
        ],
        leads: [
          {
            id: "l-1",
            name: "Bob",
            email: "bob@example.com",
            reason: "Trial",
            status: "new",
            source: "web",
            createdAt: new Date(),
          },
        ],
        connections: [
          {
            id: "c-1",
            orgId: ORG_ID,
            propertyId: PROPERTY.id,
            provider: "airbnb",
            icalUrl: "https://example.com/feed.ics",
            status: "active",
            lastSyncedAt: new Date(),
            lastError: null,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
      });
      const reservations = { metrics: vi.fn().mockResolvedValue(makeMetrics(true)) };
      service = new DashboardService(prisma as never, reservations as never);
    });

    it("sets demo:false when reservations exist", async () => {
      const result = await service.snapshot(ORG_ID, PROPERTY);
      expect(result.demo).toBe(false);
    });

    it("returns live checkIns from reservations", async () => {
      const result = await service.snapshot(ORG_ID, PROPERTY);
      expect(result.checkIns[0]?.guestName).toBe("Alice");
    });

    it("serves real notifications from the DB", async () => {
      const result = await service.snapshot(ORG_ID, PROPERTY);
      expect(result.notifications[0]?.title).toBe("New booking");
    });

    it("serves real leads from contact_leads", async () => {
      const result = await service.snapshot(ORG_ID, PROPERTY);
      expect(result.leads[0]?.name).toBe("Bob");
    });

    it("returns health score above 60 (grade B+) when a channel is synced recently", async () => {
      const result = await service.snapshot(ORG_ID, PROPERTY);
      expect(result.health.score).toBeGreaterThan(60);
      expect(["A", "B"]).toContain(result.health.grade);
    });

    it("satisfies the shared schema contract end-to-end", async () => {
      const result = await service.snapshot(ORG_ID, PROPERTY);
      expect(() => dashboardSnapshotSchema.parse(result)).not.toThrow();
    });
  });

  describe("money invariant", () => {
    it("all revenue amounts are non-negative integers", async () => {
      const prisma = makePrisma({});
      const reservations = { metrics: vi.fn().mockResolvedValue(makeMetrics(false)) };
      const service = new DashboardService(prisma as never, reservations as never);
      const result = await service.snapshot(ORG_ID, PROPERTY);
      expect(Number.isInteger(result.revenue.monthToDateMinor)).toBe(true);
      expect(result.revenue.monthToDateMinor).toBeGreaterThanOrEqual(0);
      expect(Number.isInteger(result.revenue.adrMinor)).toBe(true);
      expect(Number.isInteger(result.revenue.revparMinor)).toBe(true);
      for (const v of result.revenue.dailyMinor) {
        expect(Number.isInteger(v)).toBe(true);
        expect(v).toBeGreaterThanOrEqual(0);
      }
    });
  });
});

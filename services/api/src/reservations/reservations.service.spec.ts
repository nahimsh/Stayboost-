import { describe, expect, it, vi } from "vitest";
import type { CanonicalReservation } from "@stayboost/domain";
import type { PrismaService, TenantClient } from "../prisma/prisma.service";
import type { AuditService } from "../auth/audit.service";
import type { ChannelsService } from "./channels.service";
import type { IcalConnector } from "./ical-connector.service";
import { ReservationsService } from "./reservations.service";

function dayOffset(days: number): Date {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  d.setUTCDate(d.getUTCDate() + days);
  return d;
}

function harness(opts: {
  incoming?: CanonicalReservation[];
  findUnique?: ReturnType<typeof vi.fn>;
  rows?: unknown[];
}) {
  const tx = {
    reservation: {
      findUnique: opts.findUnique ?? vi.fn().mockResolvedValue(null),
      upsert: vi.fn().mockResolvedValue({}),
      findMany: vi.fn().mockResolvedValue(opts.rows ?? []),
    },
    channelConnection: { update: vi.fn().mockResolvedValue({}) },
    syncLog: { create: vi.fn().mockResolvedValue({}) },
    property: { findFirst: vi.fn() },
  };
  const prisma = {
    withTenant: vi.fn((_org: string, fn: (t: TenantClient) => unknown) => fn(tx as unknown as TenantClient)),
  } as unknown as PrismaService;
  const channels = {
    requireConnection: vi.fn().mockResolvedValue({
      id: "conn-1",
      propertyId: "prop-1",
      provider: "airbnb",
      icalUrl: "https://airbnb/ical.ics",
    }),
  } as unknown as ChannelsService;
  const connector = {
    fetchReservations: vi.fn().mockResolvedValue(opts.incoming ?? []),
  } as unknown as IcalConnector;
  const audit = { record: vi.fn().mockResolvedValue(undefined) } as unknown as AuditService;
  return { service: new ReservationsService(prisma, channels, connector, audit), tx, connector };
}

const confirmed: CanonicalReservation = {
  channel: "airbnb",
  source: "ical:airbnb",
  externalId: "res-1",
  status: "confirmed",
  checkIn: "2026-06-20",
  checkOut: "2026-06-24",
  nights: 4,
  guestName: "Ana",
};
const block: CanonicalReservation = { ...confirmed, externalId: "blk-1", status: "blocked", guestName: null };

describe("ReservationsService.sync", () => {
  it("imports new reservations, counts blocks, and marks the connection active", async () => {
    const { service, tx } = harness({ incoming: [confirmed, block] });
    const result = await service.sync("org-1", "conn-1", "user-1");

    expect(result).toMatchObject({ imported: 2, updated: 0, blocked: 1, status: "active" });
    expect(tx.reservation.upsert).toHaveBeenCalledTimes(2);
    expect(tx.channelConnection.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ status: "active", lastSyncedAt: expect.any(Date) }) }),
    );
    expect(tx.syncLog.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ status: "success", imported: 2, blocked: 1 }) }),
    );
  });

  it("counts an existing reservation as updated", async () => {
    const findUnique = vi.fn().mockResolvedValue({ id: "existing" });
    const { service } = harness({ incoming: [confirmed], findUnique });
    const result = await service.sync("org-1", "conn-1", "user-1");
    expect(result).toMatchObject({ imported: 0, updated: 1 });
  });

  it("marks the connection errored and rethrows when the feed fails", async () => {
    const { service, connector, tx } = harness({});
    (connector.fetchReservations as ReturnType<typeof vi.fn>).mockRejectedValue(new Error("502 feed"));
    await expect(service.sync("org-1", "conn-1", "user-1")).rejects.toThrow(/feed/);
    expect(tx.channelConnection.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ status: "error" }) }),
    );
    expect(tx.syncLog.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ status: "error" }) }),
    );
  });
});

describe("ReservationsService.metrics", () => {
  it("returns empty widgets when there are no reservations", async () => {
    const { service } = harness({ rows: [] });
    const m = await service.metrics("org-1", "prop-1", "Villa", 4);
    expect(m.hasData).toBe(false);
    expect(m.occupancy.totalUnits).toBe(4);
    expect(m.occupancy.next7Days).toHaveLength(7);
  });

  it("derives check-ins, check-outs and occupancy from live rows", async () => {
    const rows = [
      // Active now: started yesterday, ends in 2 days -> drives occupancy + a checkout
      { id: "r1", channel: "airbnb", source: "ical:airbnb", externalId: "res-1", status: "confirmed", checkIn: dayOffset(-1), checkOut: dayOffset(2), nights: 3, guestName: "Ana" },
      // Future check-in within window
      { id: "r2", channel: "airbnb", source: "ical:airbnb", externalId: "res-2", status: "confirmed", checkIn: dayOffset(3), checkOut: dayOffset(6), nights: 3, guestName: null },
    ];
    const { service } = harness({ rows });
    const m = await service.metrics("org-1", "prop-1", "Sea Breeze", 1);

    expect(m.hasData).toBe(true);
    expect(m.checkIns.map((s) => s.id)).toContain("r2");
    expect(m.checkOuts.map((s) => s.id)).toContain("r1");
    expect(m.occupancy.currentPct).toBeGreaterThan(0); // some of next 7 days covered
    expect(m.checkIns.find((s) => s.id === "r2")?.guestName).toBe("Guest"); // null -> fallback
  });
});

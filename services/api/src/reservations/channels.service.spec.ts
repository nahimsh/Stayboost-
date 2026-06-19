import { describe, expect, it, vi } from "vitest";
import type { PrismaService, TenantClient } from "../prisma/prisma.service";
import type { AuditService } from "../auth/audit.service";
import { ChannelsService } from "./channels.service";

function makeService(tx: Record<string, unknown>) {
  const prisma = {
    withTenant: vi.fn((_o: string, fn: (t: TenantClient) => unknown) => fn(tx as unknown as TenantClient)),
  } as unknown as PrismaService;
  const audit = { record: vi.fn().mockResolvedValue(undefined) } as unknown as AuditService;
  return new ChannelsService(prisma, audit);
}

const baseConn = { id: "c1", propertyId: "p1", provider: "vrbo", icalUrl: "https://vrbo/ical", lastError: null };

describe("ChannelsService health", () => {
  it("derives never_synced / healthy / stale / error", async () => {
    const threeHoursAgo = new Date(Date.now() - 3 * 60 * 60 * 1000);
    const rows = [
      { ...baseConn, id: "never", status: "active", lastSyncedAt: null },
      { ...baseConn, id: "ok", status: "active", lastSyncedAt: new Date() },
      { ...baseConn, id: "stale", status: "active", lastSyncedAt: threeHoursAgo },
      { ...baseConn, id: "err", status: "error", lastSyncedAt: new Date(), lastError: "boom" },
    ];
    const svc = makeService({ channelConnection: { findMany: vi.fn().mockResolvedValue(rows) } });
    const list = await svc.list("org-1");
    const health = Object.fromEntries(list.map((c) => [c.id, c.health]));
    expect(health).toEqual({ never: "never_synced", ok: "healthy", stale: "stale", err: "error" });
  });
});

describe("ChannelsService.create", () => {
  it("rejects a property that isn't in the tenant", async () => {
    const svc = makeService({
      property: { findFirst: vi.fn().mockResolvedValue(null) },
      channelConnection: { create: vi.fn() },
    });
    await expect(
      svc.create("org-1", { propertyId: "11111111-1111-1111-1111-111111111111", provider: "airbnb", icalUrl: "https://a/ical" }, { userId: "u1" }),
    ).rejects.toThrow(/Property not found/);
  });
});

describe("ChannelsService.listLogs", () => {
  it("returns mapped sync logs for an owned connection", async () => {
    const createdAt = new Date();
    const tx = {
      channelConnection: { findFirst: vi.fn().mockResolvedValue({ ...baseConn, status: "active", lastSyncedAt: new Date() }) },
      syncLog: {
        findMany: vi.fn().mockResolvedValue([
          { id: "l1", connectionId: "c1", status: "success", imported: 3, updated: 1, blocked: 0, durationMs: 120, message: null, createdAt },
        ]),
      },
    };
    const svc = makeService(tx);
    const logs = await svc.listLogs("org-1", "c1");
    expect(logs).toHaveLength(1);
    expect(logs[0]).toMatchObject({ status: "success", imported: 3, durationMs: 120 });
    expect(logs[0]?.createdAt).toBe(createdAt.toISOString());
  });
});

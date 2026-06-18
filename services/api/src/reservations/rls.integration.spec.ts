import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { randomUUID } from "node:crypto";
import { PrismaService } from "../prisma/prisma.service";

/**
 * Cross-tenant isolation (RLS) integration test. Runs only when DATABASE_URL is
 * set against a MIGRATED Postgres (CI/staging); skipped locally so the unit gate
 * stays green without a database. Proves the P0 guarantee in CLAUDE.md: a tenant
 * context can never read or write another tenant's reservations.
 */
const HAS_DB = Boolean(process.env.DATABASE_URL);

describe.skipIf(!HAS_DB)("Reservations RLS tenant isolation", () => {
  const prisma = new PrismaService();
  const tag = randomUUID().slice(0, 8);
  let orgA = "";
  let orgB = "";
  let propA = "";
  let propB = "";

  async function makeOrg(name: string): Promise<{ orgId: string; propertyId: string }> {
    const org = await prisma.organization.create({ data: { name, slug: `${name}-${tag}` } });
    const property = await prisma.property.create({
      data: { orgId: org.id, name: `${name} Villa`, type: "villa", country: "PT", city: "Lagos", roomsCount: 1 },
    });
    return { orgId: org.id, propertyId: property.id };
  }

  beforeAll(async () => {
    await prisma.$connect();
    ({ orgId: orgA, propertyId: propA } = await makeOrg(`rls-a-${tag}`));
    ({ orgId: orgB, propertyId: propB } = await makeOrg(`rls-b-${tag}`));

    const seed = (orgId: string, propertyId: string, ext: string) =>
      prisma.withTenant(orgId, (tx) =>
        tx.reservation.create({
          data: {
            orgId,
            propertyId,
            channel: "airbnb",
            source: "ical:airbnb",
            externalId: ext,
            status: "confirmed",
            checkIn: new Date("2026-07-01T00:00:00Z"),
            checkOut: new Date("2026-07-04T00:00:00Z"),
            nights: 3,
          },
        }),
      );
    await seed(orgA, propA, "res-a");
    await seed(orgB, propB, "res-b");
  });

  afterAll(async () => {
    if (orgA) await prisma.organization.delete({ where: { id: orgA } }).catch(() => undefined);
    if (orgB) await prisma.organization.delete({ where: { id: orgB } }).catch(() => undefined);
    await prisma.$disconnect();
  });

  it("a tenant sees only its own reservations", async () => {
    const aRows = await prisma.withTenant(orgA, (tx) => tx.reservation.findMany());
    const bRows = await prisma.withTenant(orgB, (tx) => tx.reservation.findMany());
    expect(aRows.every((r) => r.orgId === orgA)).toBe(true);
    expect(aRows.some((r) => r.externalId === "res-a")).toBe(true);
    expect(aRows.some((r) => r.externalId === "res-b")).toBe(false);
    expect(bRows.some((r) => r.externalId === "res-a")).toBe(false);
  });

  it("a tenant cannot write a row for another org (WITH CHECK)", async () => {
    await expect(
      prisma.withTenant(orgA, (tx) =>
        tx.reservation.create({
          data: {
            orgId: orgB, // foreign tenant
            propertyId: propB,
            channel: "airbnb",
            source: "ical:airbnb",
            externalId: "evil",
            status: "confirmed",
            checkIn: new Date("2026-07-01T00:00:00Z"),
            checkOut: new Date("2026-07-02T00:00:00Z"),
            nights: 1,
          },
        }),
      ),
    ).rejects.toThrow();
  });
});

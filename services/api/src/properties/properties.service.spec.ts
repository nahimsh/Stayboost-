import { describe, expect, it, vi } from "vitest";
import type { PropertySetupInput } from "@stayboost/domain";
import type { PrismaService } from "../prisma/prisma.service";
import type { AuditService } from "../auth/audit.service";
import { PropertiesService } from "./properties.service";

const input: PropertySetupInput = {
  name: "Sea Breeze Villa",
  type: "villa",
  country: "Portugal",
  city: "Lagos",
  roomsCount: 4,
  airbnbUrl: "https://airbnb.com/rooms/1",
};

const row = {
  id: "prop-1",
  name: "Sea Breeze Villa",
  type: "villa",
  country: "Portugal",
  city: "Lagos",
  roomsCount: 4,
  airbnbUrl: "https://airbnb.com/rooms/1",
  bookingUrl: null,
  websiteUrl: null,
};

function makeService() {
  const create = vi.fn().mockResolvedValue(row);
  const findFirst = vi.fn().mockResolvedValue(row);
  const record = vi.fn().mockResolvedValue(undefined);
  const prisma = { property: { create, findFirst, findMany: vi.fn() } } as unknown as PrismaService;
  const audit = { record } as unknown as AuditService;
  return { service: new PropertiesService(prisma, audit), create, record };
}

describe("PropertiesService", () => {
  it("creates a property scoped to the actor's org and audits it", async () => {
    const { service, create, record } = makeService();
    const summary = await service.create(input, { userId: "u1", orgId: "org-1" });

    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ orgId: "org-1", name: "Sea Breeze Villa" }) }),
    );
    // Optional fields default to null, not undefined.
    expect(create.mock.calls[0]?.[0].data.bookingUrl).toBeNull();
    expect(record).toHaveBeenCalledWith(
      expect.objectContaining({ action: "property.created", orgId: "org-1", targetType: "property" }),
    );
    expect(summary.id).toBe("prop-1");
  });

  it("returns the primary property summary for an org", async () => {
    const { service } = makeService();
    const summary = await service.primaryForOrg("org-1");
    expect(summary?.name).toBe("Sea Breeze Villa");
  });
});

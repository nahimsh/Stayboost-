import { Injectable } from "@nestjs/common";
import type { PropertySetupInput, PropertySummary } from "@stayboost/domain";
import { PrismaService } from "../prisma/prisma.service";
import { AuditService } from "../auth/audit.service";

interface ActorContext {
  userId: string;
  orgId: string;
  ip?: string | undefined;
  userAgent?: string | undefined;
}

@Injectable()
export class PropertiesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async create(input: PropertySetupInput, actor: ActorContext): Promise<PropertySummary> {
    const property = await this.prisma.property.create({
      data: {
        orgId: actor.orgId,
        name: input.name,
        type: input.type,
        country: input.country,
        city: input.city,
        airbnbUrl: input.airbnbUrl ?? null,
        bookingUrl: input.bookingUrl ?? null,
        websiteUrl: input.websiteUrl ?? null,
        roomsCount: input.roomsCount,
        contactName: input.contactName ?? null,
        contactEmail: input.contactEmail ?? null,
        contactPhone: input.contactPhone ?? null,
      },
    });
    await this.audit.record({
      action: "property.created",
      actorUserId: actor.userId,
      orgId: actor.orgId,
      targetType: "property",
      targetId: property.id,
      ip: actor.ip,
      userAgent: actor.userAgent,
    });
    return this.toSummary(property);
  }

  async listForOrg(orgId: string): Promise<PropertySummary[]> {
    const rows = await this.prisma.property.findMany({
      where: { orgId },
      orderBy: { createdAt: "asc" },
    });
    return rows.map((r) => this.toSummary(r));
  }

  async primaryForOrg(orgId: string): Promise<PropertySummary | null> {
    const row = await this.prisma.property.findFirst({
      where: { orgId },
      orderBy: { createdAt: "asc" },
    });
    return row ? this.toSummary(row) : null;
  }

  private toSummary(p: {
    id: string;
    name: string;
    type: string;
    country: string;
    city: string;
    roomsCount: number;
    airbnbUrl: string | null;
    bookingUrl: string | null;
    websiteUrl: string | null;
  }): PropertySummary {
    return {
      id: p.id,
      name: p.name,
      type: p.type as PropertySummary["type"],
      country: p.country,
      city: p.city,
      roomsCount: p.roomsCount,
      airbnbUrl: p.airbnbUrl,
      bookingUrl: p.bookingUrl,
      websiteUrl: p.websiteUrl,
    };
  }
}

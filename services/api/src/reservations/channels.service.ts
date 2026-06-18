import { ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import type { ChannelConnection, CreateChannelConnectionInput } from "@stayboost/domain";
import { PrismaService } from "../prisma/prisma.service";
import { AuditService } from "../auth/audit.service";

function toDto(c: {
  id: string;
  propertyId: string;
  provider: string;
  icalUrl: string;
  status: string;
  lastSyncedAt: Date | null;
  lastError: string | null;
}): ChannelConnection {
  return {
    id: c.id,
    propertyId: c.propertyId,
    provider: c.provider as ChannelConnection["provider"],
    icalUrl: c.icalUrl,
    status: c.status as ChannelConnection["status"],
    lastSyncedAt: c.lastSyncedAt?.toISOString() ?? null,
    lastError: c.lastError,
  };
}

@Injectable()
export class ChannelsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async create(
    orgId: string,
    input: CreateChannelConnectionInput,
    actor: { userId: string },
  ): Promise<ChannelConnection> {
    const connection = await this.prisma.withTenant(orgId, async (tx) => {
      // Verify the property belongs to this tenant (RLS also enforces it).
      const property = await tx.property.findFirst({ where: { id: input.propertyId, orgId } });
      if (!property) throw new ForbiddenException("Property not found for this organization");
      return tx.channelConnection.create({
        data: {
          orgId,
          propertyId: input.propertyId,
          provider: input.provider,
          icalUrl: input.icalUrl,
        },
      });
    });
    await this.audit.record({
      action: "channel.connected",
      actorUserId: actor.userId,
      orgId,
      targetType: "channel_connection",
      targetId: connection.id,
      metadata: { provider: input.provider },
    });
    return toDto(connection);
  }

  list(orgId: string): Promise<ChannelConnection[]> {
    return this.prisma.withTenant(orgId, async (tx) => {
      const rows = await tx.channelConnection.findMany({ orderBy: { createdAt: "asc" } });
      return rows.map(toDto);
    });
  }

  async requireConnection(orgId: string, connectionId: string) {
    const connection = await this.prisma.withTenant(orgId, (tx) =>
      tx.channelConnection.findFirst({ where: { id: connectionId } }),
    );
    if (!connection) throw new NotFoundException("Channel connection not found");
    return connection;
  }
}

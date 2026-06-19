import { ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import type {
  ChannelConnection,
  ConnectionHealth,
  CreateChannelConnectionInput,
  SyncLog,
} from "@stayboost/domain";
import { PrismaService } from "../prisma/prisma.service";
import { AuditService } from "../auth/audit.service";

const STALE_AFTER_MS = 2 * 60 * 60 * 1000; // a feed not synced in 2h is "stale"

function computeHealth(status: string, lastSyncedAt: Date | null): ConnectionHealth {
  if (status === "error") return "error";
  if (!lastSyncedAt) return "never_synced";
  return Date.now() - lastSyncedAt.getTime() > STALE_AFTER_MS ? "stale" : "healthy";
}

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
    health: computeHealth(c.status, c.lastSyncedAt),
    lastSyncedAt: c.lastSyncedAt?.toISOString() ?? null,
    lastError: c.lastError,
  };
}

function logToDto(l: {
  id: string;
  connectionId: string;
  status: string;
  imported: number;
  updated: number;
  blocked: number;
  durationMs: number;
  message: string | null;
  createdAt: Date;
}): SyncLog {
  return {
    id: l.id,
    connectionId: l.connectionId,
    status: l.status as SyncLog["status"],
    imported: l.imported,
    updated: l.updated,
    blocked: l.blocked,
    durationMs: l.durationMs,
    message: l.message,
    createdAt: l.createdAt.toISOString(),
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

  async listLogs(orgId: string, connectionId: string, limit = 20): Promise<SyncLog[]> {
    await this.requireConnection(orgId, connectionId); // 404 if not this tenant's
    return this.prisma.withTenant(orgId, async (tx) => {
      const rows = await tx.syncLog.findMany({
        where: { connectionId },
        orderBy: { createdAt: "desc" },
        take: Math.min(limit, 100),
      });
      return rows.map(logToDto);
    });
  }
}

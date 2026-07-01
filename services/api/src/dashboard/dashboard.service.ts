import { Injectable } from "@nestjs/common";
import {
  buildSampleDashboardSnapshot,
  type DashboardSnapshot,
  type NotificationItem,
  type Lead,
  type PropertyHealth,
  type PropertySummary,
} from "@stayboost/domain";
import { PrismaService } from "../prisma/prisma.service";
import { ReservationsService } from "../reservations/reservations.service";

const DAY_MS = 86_400_000;

@Injectable()
export class DashboardService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly reservations: ReservationsService,
  ) {}

  async snapshot(orgId: string, property: PropertySummary): Promise<DashboardSnapshot> {
    const sampleBase = buildSampleDashboardSnapshot({
      propertyName: property.name,
      propertyType: property.type,
      totalUnits: property.roomsCount,
    });

    const [metrics, notifications, leads, health] = await Promise.all([
      this.reservations.metrics(orgId, property.id, property.name, property.roomsCount),
      this.getNotifications(orgId),
      this.getLeads(),
      this.getHealth(orgId, property.id),
    ]);

    const hasLiveData = metrics.hasData;

    return {
      ...sampleBase,
      demo: !hasLiveData,
      property: { id: property.id, name: property.name, type: property.type },
      ...(hasLiveData
        ? {
            checkIns: metrics.checkIns,
            checkOuts: metrics.checkOuts,
            occupancy: metrics.occupancy,
          }
        : {}),
      health,
      notifications: notifications.length > 0 ? notifications : sampleBase.notifications,
      leads: leads.length > 0 ? leads : sampleBase.leads,
    };
  }

  private async getNotifications(orgId: string): Promise<NotificationItem[]> {
    const rows = await this.prisma.withTenant(orgId, (tx) =>
      tx.notification.findMany({
        where: { orgId },
        orderBy: { createdAt: "desc" },
        take: 20,
      }),
    );

    return rows.map((r) => ({
      id: r.id,
      type: r.type as NotificationItem["type"],
      title: r.title,
      body: r.body,
      createdAt: r.createdAt.toISOString(),
      read: r.read,
      severity: r.severity as NotificationItem["severity"],
    }));
  }

  private async getLeads(): Promise<Lead[]> {
    const cutoff = new Date(Date.now() - 90 * DAY_MS);
    const rows = await this.prisma.contactLead.findMany({
      where: { createdAt: { gte: cutoff } },
      orderBy: { createdAt: "desc" },
      take: 10,
    });

    return rows.map((r) => ({
      id: r.id,
      name: r.name,
      source: "website" as Lead["source"],
      interest: r.reason,
      createdAt: r.createdAt.toISOString(),
      status: r.status as Lead["status"],
    }));
  }

  private async getHealth(orgId: string, propertyId: string): Promise<PropertyHealth> {
    const connections = await this.prisma.withTenant(orgId, (tx) =>
      tx.channelConnection.findMany({
        where: { propertyId, status: "active" },
        orderBy: { lastSyncedAt: "desc" },
        take: 10,
      }),
    );

    const channelScore = Math.min(100, connections.length * 33);

    const now = Date.now();
    const mostRecent = connections.find((c) => c.lastSyncedAt != null);
    let syncScore = 0;
    if (mostRecent?.lastSyncedAt) {
      const ageMs = now - mostRecent.lastSyncedAt.getTime();
      if (ageMs < DAY_MS) syncScore = 100;
      else if (ageMs < 7 * DAY_MS) syncScore = 60;
      else syncScore = 30;
    }

    const score = connections.length === 0 ? 0 : Math.round((channelScore + syncScore) / 2);
    const grade = score >= 80 ? "A" : score >= 60 ? "B" : score >= 40 ? "C" : "D";

    return {
      score,
      grade,
      factors: [
        { label: "Channel connections", score: channelScore, weightPct: 50 },
        { label: "Sync recency", score: syncScore, weightPct: 50 },
      ],
    };
  }
}

import { Injectable } from "@nestjs/common";
import type { OccupancyWidget, Reservation, Stay, SyncResult } from "@stayboost/domain";
import { PrismaService } from "../prisma/prisma.service";
import { AuditService } from "../auth/audit.service";
import { ChannelsService } from "./channels.service";
import { IcalConnector } from "./ical-connector.service";

const DAY_MS = 86_400_000;

function isoDay(d: Date): string {
  return d.toISOString().slice(0, 10);
}
function todayUtc(): Date {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

export interface ReservationMetrics {
  hasData: boolean;
  checkIns: Stay[];
  checkOuts: Stay[];
  occupancy: OccupancyWidget;
}

interface ReservationRow {
  id: string;
  channel: string;
  source: string;
  externalId: string;
  status: string;
  checkIn: Date;
  checkOut: Date;
  nights: number;
  guestName: string | null;
}

@Injectable()
export class ReservationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly channels: ChannelsService,
    private readonly connector: IcalConnector,
    private readonly audit: AuditService,
  ) {}

  /** Pull the connection's iCal feed and upsert reservations (idempotent re-sync). */
  async sync(orgId: string, connectionId: string, actorUserId: string): Promise<SyncResult> {
    const connection = await this.channels.requireConnection(orgId, connectionId);

    let incoming;
    try {
      incoming = await this.connector.fetchReservations(
        connection.icalUrl,
        connection.provider as "airbnb" | "booking_com" | "ical",
      );
    } catch (error) {
      await this.prisma.withTenant(orgId, (tx) =>
        tx.channelConnection.update({
          where: { id: connection.id },
          data: { status: "error", lastError: (error as Error).message.slice(0, 500) },
        }),
      );
      throw error;
    }

    let imported = 0;
    let updated = 0;
    let blocked = 0;

    await this.prisma.withTenant(orgId, async (tx) => {
      for (const r of incoming) {
        if (r.status === "blocked") blocked += 1;
        const where = { orgId_source_externalId: { orgId, source: r.source, externalId: r.externalId } };
        const existing = await tx.reservation.findUnique({ where, select: { id: true } });
        await tx.reservation.upsert({
          where,
          create: {
            orgId,
            propertyId: connection.propertyId,
            channel: r.channel,
            source: r.source,
            externalId: r.externalId,
            status: r.status,
            checkIn: new Date(`${r.checkIn}T00:00:00Z`),
            checkOut: new Date(`${r.checkOut}T00:00:00Z`),
            nights: r.nights,
            guestName: r.guestName,
          },
          update: {
            status: r.status,
            checkIn: new Date(`${r.checkIn}T00:00:00Z`),
            checkOut: new Date(`${r.checkOut}T00:00:00Z`),
            nights: r.nights,
            guestName: r.guestName,
          },
        });
        if (existing) updated += 1;
        else imported += 1;
      }
      await tx.channelConnection.update({
        where: { id: connection.id },
        data: { status: "active", lastError: null, lastSyncedAt: new Date() },
      });
    });

    await this.audit.record({
      action: "channel.synced",
      actorUserId,
      orgId,
      targetType: "channel_connection",
      targetId: connection.id,
      metadata: { imported, updated, blocked },
    });

    return { connectionId: connection.id, imported, updated, blocked, status: "active" };
  }

  async listForProperty(orgId: string, propertyId: string): Promise<Reservation[]> {
    return this.prisma.withTenant(orgId, async (tx) => {
      const rows = await tx.reservation.findMany({
        where: { propertyId, status: "confirmed" },
        orderBy: { checkIn: "asc" },
      });
      return rows.map((r: ReservationRow) => this.toDto(r, propertyId));
    });
  }

  /** Build the reservation-derived dashboard widgets from live data. */
  async metrics(
    orgId: string,
    propertyId: string,
    propertyName: string,
    totalUnits: number,
  ): Promise<ReservationMetrics> {
    const today = todayUtc();
    const horizon = new Date(today.getTime() + 21 * DAY_MS);

    const rows = await this.prisma.withTenant(orgId, (tx) =>
      tx.reservation.findMany({
        where: { propertyId, checkOut: { gte: today }, checkIn: { lte: horizon } },
        orderBy: { checkIn: "asc" },
      }),
    );

    if (rows.length === 0) {
      return { hasData: false, checkIns: [], checkOuts: [], occupancy: this.emptyOccupancy(totalUnits) };
    }

    const confirmed = rows.filter((r: ReservationRow) => r.status === "confirmed");
    const windowEnd = new Date(today.getTime() + 14 * DAY_MS);

    const checkIns = confirmed
      .filter((r: ReservationRow) => r.checkIn >= today && r.checkIn <= windowEnd)
      .map((r: ReservationRow) => this.toStay(r, propertyName, "in"));
    const checkOuts = confirmed
      .filter((r: ReservationRow) => r.checkOut >= today && r.checkOut <= windowEnd)
      .map((r: ReservationRow) => this.toStay(r, propertyName, "out"));

    return { hasData: true, checkIns, checkOuts, occupancy: this.occupancy(rows, today, totalUnits) };
  }

  private emptyOccupancy(totalUnits: number): OccupancyWidget {
    const today = todayUtc();
    return {
      currentPct: 0,
      targetPct: 80,
      occupiedUnits: 0,
      totalUnits: Math.max(1, totalUnits),
      next7Days: Array.from({ length: 7 }, (_, i) => ({
        date: isoDay(new Date(today.getTime() + i * DAY_MS)),
        pct: 0,
      })),
    };
  }

  private occupancy(rows: ReservationRow[], today: Date, totalUnits: number): OccupancyWidget {
    const covers = (day: Date): boolean =>
      rows.some((r) => r.checkIn <= day && r.checkOut > day);
    const next7Days = Array.from({ length: 7 }, (_, i) => {
      const day = new Date(today.getTime() + i * DAY_MS);
      return { date: isoDay(day), pct: covers(day) ? 100 : 0 };
    });
    const coveredDays = next7Days.filter((d) => d.pct === 100).length;
    const occupiedToday = covers(today);
    return {
      currentPct: Math.round((coveredDays / 7) * 100),
      targetPct: 80,
      occupiedUnits: occupiedToday ? 1 : 0,
      totalUnits: Math.max(1, totalUnits),
      next7Days,
    };
  }

  private toStay(r: ReservationRow, unitName: string, kind: "in" | "out"): Stay {
    const today = isoDay(todayUtc());
    const checkIn = isoDay(r.checkIn);
    const checkOut = isoDay(r.checkOut);
    const status =
      kind === "out" ? "checked_in" : checkIn === today ? "due" : "confirmed";
    return {
      id: r.id,
      guestName: r.guestName ?? "Guest",
      unitName,
      date: kind === "in" ? checkIn : checkOut,
      nights: r.nights,
      guests: 1,
      status,
    };
  }

  private toDto(r: ReservationRow, propertyId: string): Reservation {
    return {
      id: r.id,
      propertyId,
      channel: r.channel as Reservation["channel"],
      source: r.source,
      externalId: r.externalId,
      status: r.status as Reservation["status"],
      checkIn: isoDay(r.checkIn),
      checkOut: isoDay(r.checkOut),
      nights: r.nights,
      guestName: r.guestName,
    };
  }
}

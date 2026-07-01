import { Worker, UnrecoverableError, type Job } from "bullmq";
import type { CanonicalReservation, ChannelProvider } from "@stayboost/domain";
import { reservationsFromIcal } from "@stayboost/domain";
import type IORedis from "ioredis";
import { prisma, withTenant } from "../db";
import { QUEUE_SYNC_CHANNEL, type SyncChannelPayload } from "../queues";

const FETCH_TIMEOUT_MS = 20_000;
const MAX_BYTES = 5_000_000;
const MAX_ERROR_MSG = 500;

async function fetchIcal(url: string): Promise<string> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { Accept: "text/calendar, text/plain" },
    });
    if (!res.ok) throw new Error(`iCal feed responded ${res.status}`);
    const text = await res.text();
    if (text.length > MAX_BYTES) throw new Error("iCal feed is too large");
    return text;
  } finally {
    clearTimeout(timeout);
  }
}

interface SyncOutcome {
  imported: number;
  updated: number;
  blocked: number;
  durationMs: number;
}

async function performSync(orgId: string, connectionId: string): Promise<SyncOutcome> {
  const connection = await withTenant(orgId, (tx) =>
    tx.channelConnection.findFirst({ where: { id: connectionId } }),
  );

  if (!connection) {
    // Connection was deleted between enqueue and processing — don't retry.
    throw new UnrecoverableError(`Channel connection ${connectionId} not found`);
  }
  if (connection.status === "disabled") {
    throw new UnrecoverableError(`Channel connection ${connectionId} is disabled`);
  }

  const startedAt = Date.now();

  let incoming: CanonicalReservation[];
  try {
    const text = await fetchIcal(connection.icalUrl);
    incoming = reservationsFromIcal(text, connection.provider as ChannelProvider);
  } catch (error) {
    if (error instanceof UnrecoverableError) throw error;
    const message = String((error as Error).message ?? error).slice(0, MAX_ERROR_MSG);
    await withTenant(orgId, async (tx) => {
      await tx.channelConnection.update({
        where: { id: connectionId },
        data: { status: "error", lastError: message },
      });
      await tx.syncLog.create({
        data: {
          orgId,
          connectionId,
          status: "error",
          durationMs: Date.now() - startedAt,
          message,
        },
      });
    });
    throw error;
  }

  let imported = 0;
  let updated = 0;
  let blocked = 0;

  await withTenant(orgId, async (tx) => {
    for (const r of incoming) {
      if (r.status === "blocked") blocked += 1;
      const where = {
        orgId_source_externalId: { orgId, source: r.source, externalId: r.externalId },
      };
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
      where: { id: connectionId },
      data: { status: "active", lastError: null, lastSyncedAt: new Date() },
    });

    await tx.syncLog.create({
      data: {
        orgId,
        connectionId,
        status: "success",
        imported,
        updated,
        blocked,
        durationMs: Date.now() - startedAt,
      },
    });
  });

  // System-initiated audit entry (no human actor).
  await prisma.auditLog.create({
    data: {
      action: "channel.synced",
      orgId,
      targetType: "channel_connection",
      targetId: connectionId,
      metadata: { imported, updated, blocked },
    },
  });

  return { imported, updated, blocked, durationMs: Date.now() - startedAt };
}

export function createChannelSyncWorker(connection: IORedis): Worker<SyncChannelPayload> {
  const worker = new Worker<SyncChannelPayload>(
    QUEUE_SYNC_CHANNEL,
    async (job: Job<SyncChannelPayload>) => {
      const { connectionId, orgId } = job.data;
      const result = await performSync(orgId, connectionId);
      console.log(
        `[channel-sync] ${connectionId} ok — ` +
          `imported=${result.imported} updated=${result.updated} blocked=${result.blocked} ` +
          `duration=${result.durationMs}ms`,
      );
      return result;
    },
    { connection },
  );

  // On permanent failure (all retries exhausted), mark the connection as error so
  // the dashboard health indicator reflects the broken feed.
  worker.on("failed", async (job: Job<SyncChannelPayload> | undefined, err: Error) => {
    if (!job) return;
    const maxAttempts = job.opts.attempts ?? 3;
    if (job.attemptsMade >= maxAttempts) {
      const { connectionId, orgId } = job.data;
      try {
        await withTenant(orgId, (tx) =>
          tx.channelConnection.update({
            where: { id: connectionId },
            data: {
              status: "error",
              lastError: err.message.slice(0, MAX_ERROR_MSG),
            },
          }),
        );
      } catch (updateErr) {
        console.error(`[channel-sync] failed to mark connection ${connectionId} as error`, updateErr);
      }
    }
  });

  return worker;
}

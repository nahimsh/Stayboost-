import { Worker, Queue, type Job, type BulkJobOptions } from "bullmq";
import type IORedis from "ioredis";
import { prisma, withTenant } from "../db";
import { QUEUE_SYNC_ALL_CHANNELS, QUEUE_SYNC_CHANNEL, type SyncChannelPayload } from "../queues";

/** Retry options applied to every SYNC_CHANNEL job — exponential: 2 s → 4 s → 8 s. */
export const SYNC_JOB_OPTIONS: BulkJobOptions = {
  attempts: 3,
  backoff: { type: "exponential", delay: 2_000 },
};

export function createSyncAllWorker(connection: IORedis): Worker {
  // Producer queue used to fan-out individual sync jobs.
  const syncQueue = new Queue<SyncChannelPayload>(QUEUE_SYNC_CHANNEL, { connection });

  const worker = new Worker(
    QUEUE_SYNC_ALL_CHANNELS,
    async (_job: Job) => {
      // organizations has no RLS — safe to query directly across all tenants.
      const orgs = await prisma.organization.findMany({
        select: { id: true },
        where: { status: "active" },
      });

      const jobItems: Array<{ name: "sync"; data: SyncChannelPayload; opts: BulkJobOptions }> = [];

      await Promise.all(
        orgs.map(async (org) => {
          const connections = await withTenant(org.id, (tx) =>
            tx.channelConnection.findMany({
              where: { status: { not: "disabled" } },
              select: { id: true },
            }),
          );
          for (const conn of connections) {
            jobItems.push({
              name: "sync",
              data: { connectionId: conn.id, orgId: org.id },
              opts: SYNC_JOB_OPTIONS,
            });
          }
        }),
      );

      if (jobItems.length > 0) {
        await syncQueue.addBulk(jobItems);
      }

      console.log(`[sync-all] enqueued ${jobItems.length} sync jobs across ${orgs.length} orgs`);
      return { enqueued: jobItems.length };
    },
    { connection },
  );

  return worker;
}

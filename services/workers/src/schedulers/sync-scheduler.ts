import { Queue } from "bullmq";
import type IORedis from "ioredis";
import { QUEUE_SYNC_ALL_CHANNELS } from "../queues";

const REPEAT_EVERY_MS = 30 * 60 * 1000; // 30 minutes

/**
 * Ensures there is exactly one repeating SYNC_ALL_CHANNELS job in the queue.
 * Idempotent — calling this multiple times (e.g. after a restart) does not
 * create duplicate repeatables; BullMQ deduplicates by key.
 *
 * Also enqueues an immediate fan-out on startup so the first sync does not have
 * to wait up to 30 minutes.
 */
export async function startSyncScheduler(connection: IORedis): Promise<void> {
  const queue = new Queue(QUEUE_SYNC_ALL_CHANNELS, { connection });

  // Upsert the repeating job (BullMQ deduplicates by name + repeat options).
  await queue.add(
    "scheduled",
    {},
    {
      repeat: { every: REPEAT_EVERY_MS },
      // jobId is derived from the repeat key, so this is idempotent across restarts.
    },
  );

  // Fire once immediately so the first sync runs now, not 30 min from now.
  await queue.add("startup", {});

  console.log(`[sync-scheduler] repeating sync scheduled every ${REPEAT_EVERY_MS / 60_000} minutes`);
}

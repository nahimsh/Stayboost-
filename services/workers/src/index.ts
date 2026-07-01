import IORedis from "ioredis";
import { loadEnv } from "./env";
import { prisma } from "./db";
import { createChannelSyncWorker } from "./workers/channel-sync.worker";
import { createSyncAllWorker } from "./workers/sync-all.worker";
import { startSyncScheduler } from "./schedulers/sync-scheduler";

async function main(): Promise<void> {
  const env = loadEnv();

  // Shared Redis connection — all BullMQ components reuse it.
  // enableOfflineQueue=false so the process fails fast when Redis is unreachable
  // rather than silently buffering commands.
  const redis = new IORedis(env.REDIS_URL, {
    maxRetriesPerRequest: null, // required by BullMQ
    enableOfflineQueue: false,
    lazyConnect: false,
  });

  redis.on("error", (err) => {
    console.error("[redis] connection error:", err);
  });

  const channelSyncWorker = createChannelSyncWorker(redis);
  const syncAllWorker = createSyncAllWorker(redis);

  // Schedule recurring sync (idempotent — safe to call on every restart).
  await startSyncScheduler(redis);

  console.log("[workers] started — listening for jobs");

  // Graceful shutdown: drain in-flight jobs before exiting.
  async function shutdown(signal: string): Promise<void> {
    console.log(`[workers] received ${signal}, shutting down…`);
    await Promise.all([channelSyncWorker.close(), syncAllWorker.close()]);
    await prisma.$disconnect();
    redis.disconnect();
    process.exit(0);
  }

  process.on("SIGTERM", () => void shutdown("SIGTERM"));
  process.on("SIGINT", () => void shutdown("SIGINT"));
}

main().catch((err) => {
  console.error("[workers] fatal startup error:", err);
  process.exit(1);
});

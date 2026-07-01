import { Injectable, Logger, type OnModuleDestroy, type OnModuleInit } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Queue } from "bullmq";
import IORedis from "ioredis";

// Queue and payload types come from the workers package definition.
// We declare them inline to avoid a cross-service import; the wire format
// is authoritative in services/workers/src/queues.ts.
const QUEUE_SYNC_CHANNEL = "sync:channel";

interface SyncChannelPayload {
  connectionId: string;
  orgId: string;
}

/** Accepted response returned to the caller when a sync job is enqueued. */
export interface SyncJobAccepted {
  jobId: string;
  status: "queued";
}

/**
 * Thin NestJS wrapper around the BullMQ SYNC_CHANNEL queue.
 * The API enqueues jobs here; the workers service consumes them.
 */
@Injectable()
export class SyncQueueService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(SyncQueueService.name);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private queue!: Queue<SyncChannelPayload, any>;
  private redis!: IORedis;

  constructor(private readonly config: ConfigService) {}

  onModuleInit(): void {
    const redisUrl = this.config.get<string>("REDIS_URL") ?? "redis://localhost:6379";
    this.redis = new IORedis(redisUrl, {
      maxRetriesPerRequest: null,
      enableOfflineQueue: false,
      lazyConnect: false,
    });
    this.redis.on("error", (err) => {
      this.logger.error("Redis connection error", err);
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    this.queue = new Queue<SyncChannelPayload, any>(QUEUE_SYNC_CHANNEL, {
      connection: this.redis,
    });
  }

  async onModuleDestroy(): Promise<void> {
    await this.queue.close();
    this.redis.disconnect();
  }

  async enqueue(orgId: string, connectionId: string): Promise<SyncJobAccepted> {
    const job = await this.queue.add(
      "sync",
      { orgId, connectionId },
      {
        attempts: 3,
        backoff: { type: "exponential", delay: 2_000 },
      },
    );
    return { jobId: job.id ?? connectionId, status: "queued" };
  }
}

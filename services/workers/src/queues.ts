/** Queue names shared by workers and the API producer. */
export const QUEUE_SYNC_CHANNEL = "sync:channel" as const;
export const QUEUE_SYNC_ALL_CHANNELS = "sync:all-channels" as const;

/** Payload for a single-connection sync job. */
export interface SyncChannelPayload {
  connectionId: string;
  orgId: string;
}

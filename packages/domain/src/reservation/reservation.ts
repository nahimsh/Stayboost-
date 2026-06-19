import { z } from "zod";
import { channelSchema } from "../analyzer/property-profile";

/** Canonical reservation status after normalizing any source. */
export const RESERVATION_STATUSES = ["confirmed", "cancelled", "blocked"] as const;
export const reservationStatusSchema = z.enum(RESERVATION_STATUSES);
export type ReservationStatus = z.infer<typeof reservationStatusSchema>;

/**
 * A reservation normalized from any channel (iCal, PMS, OTA). `blocked` rows are
 * owner/calendar blocks (not revenue), kept so occupancy is accurate.
 */
export const reservationSchema = z.object({
  id: z.string(),
  propertyId: z.string(),
  channel: channelSchema,
  source: z.string(), // connector that produced it, e.g. "ical:airbnb"
  externalId: z.string(),
  status: reservationStatusSchema,
  checkIn: z.string(), // ISO date (YYYY-MM-DD)
  checkOut: z.string(), // ISO date, exclusive
  nights: z.number().int().positive(),
  guestName: z.string().nullable(),
});
export type Reservation = z.infer<typeof reservationSchema>;

/** A reservation as produced by a connector, before it is persisted. */
export const canonicalReservationSchema = reservationSchema.omit({ id: true, propertyId: true });
export type CanonicalReservation = z.infer<typeof canonicalReservationSchema>;

export const CHANNEL_PROVIDERS = ["airbnb", "booking_com", "vrbo", "ical"] as const;
export const channelProviderSchema = z.enum(CHANNEL_PROVIDERS);
export type ChannelProvider = z.infer<typeof channelProviderSchema>;

export const CONNECTION_STATUSES = ["active", "error", "disabled"] as const;

/** Derived health of a connection, shown in the Channel Connect Center. */
export const CONNECTION_HEALTH = ["healthy", "stale", "error", "never_synced"] as const;
export const connectionHealthSchema = z.enum(CONNECTION_HEALTH);
export type ConnectionHealth = z.infer<typeof connectionHealthSchema>;

export const channelConnectionSchema = z.object({
  id: z.string(),
  propertyId: z.string(),
  provider: channelProviderSchema,
  icalUrl: z.string(),
  status: z.enum(CONNECTION_STATUSES),
  health: connectionHealthSchema,
  lastSyncedAt: z.string().nullable(),
  lastError: z.string().nullable(),
});
export type ChannelConnection = z.infer<typeof channelConnectionSchema>;

/** Hosts paste their listing's iCal export URL (Airbnb/Booking/VRBO provide one). */
export const createChannelConnectionInputSchema = z.object({
  propertyId: z.string().uuid(),
  provider: channelProviderSchema,
  icalUrl: z.string().url().max(2048),
});
export type CreateChannelConnectionInput = z.infer<typeof createChannelConnectionInputSchema>;

export const SYNC_LOG_STATUSES = ["success", "error"] as const;
export const syncLogSchema = z.object({
  id: z.string(),
  connectionId: z.string(),
  status: z.enum(SYNC_LOG_STATUSES),
  imported: z.number().int().nonnegative(),
  updated: z.number().int().nonnegative(),
  blocked: z.number().int().nonnegative(),
  durationMs: z.number().int().nonnegative(),
  message: z.string().nullable(),
  createdAt: z.string(),
});
export type SyncLog = z.infer<typeof syncLogSchema>;

export const syncResultSchema = z.object({
  connectionId: z.string(),
  imported: z.number().int().nonnegative(),
  updated: z.number().int().nonnegative(),
  blocked: z.number().int().nonnegative(),
  status: z.enum(CONNECTION_STATUSES),
});
export type SyncResult = z.infer<typeof syncResultSchema>;

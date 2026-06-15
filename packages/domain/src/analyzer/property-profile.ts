import { z } from "zod";

/** Input the visitor provides to the public AI Property Analyzer (guided form). */
export const PROPERTY_TYPES = ["homestay", "villa", "resort", "hotel"] as const;
export const propertyTypeSchema = z.enum(PROPERTY_TYPES);
export type PropertyType = z.infer<typeof propertyTypeSchema>;

export const CHANNELS = ["direct", "airbnb", "booking_com", "expedia", "vrbo", "other"] as const;
export const channelSchema = z.enum(CHANNELS);
export type Channel = z.infer<typeof channelSchema>;

export const CHALLENGES = [
  "more_bookings",
  "pricing",
  "save_time",
  "reviews",
  "guest_experience",
] as const;
export const challengeSchema = z.enum(CHALLENGES);
export type Challenge = z.infer<typeof challengeSchema>;

export const propertyProfileInputSchema = z.object({
  propertyName: z.string().trim().min(2).max(160),
  propertyType: propertyTypeSchema,
  country: z.string().trim().min(2).max(80),
  city: z.string().trim().min(1).max(120),
  unitsCount: z.coerce.number().int().min(1).max(10_000),
  currency: z.string().regex(/^[A-Z]{3}$/),
  avgNightlyRateMinor: z.coerce.number().int().min(0).max(100_000_00).optional(),
  occupancyPctLast30: z.coerce.number().min(0).max(100).optional(),
  channels: z.array(channelSchema).min(1).max(CHANNELS.length),
  reviewScore: z.coerce.number().min(0).max(5).optional(),
  reviewResponseRatePct: z.coerce.number().min(0).max(100).optional(),
  avgResponseTimeHours: z.coerce.number().min(0).max(720).optional(),
  biggestChallenge: challengeSchema,
});

export type PropertyProfileInput = z.infer<typeof propertyProfileInputSchema>;

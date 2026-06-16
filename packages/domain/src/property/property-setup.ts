import { z } from "zod";
import { propertyTypeSchema } from "../analyzer/property-profile";

/** Optional URL field from a form: treats blank as "not provided". */
const optionalUrl = z.preprocess(
  (v) => (typeof v === "string" && v.trim() === "" ? undefined : v),
  z.string().trim().url().max(2048).optional(),
);

/**
 * The Property Setup Wizard payload, collected right after signup. Channel URLs
 * and contact details are optional but sharpen the Analyzer and Dashboard.
 */
export const propertySetupInputSchema = z.object({
  name: z.string().trim().min(2).max(160),
  type: propertyTypeSchema,
  country: z.string().trim().min(2).max(80),
  city: z.string().trim().min(1).max(120),
  airbnbUrl: optionalUrl,
  bookingUrl: optionalUrl,
  websiteUrl: optionalUrl,
  roomsCount: z.coerce.number().int().min(1).max(10_000),
  contactName: z.preprocess(
    (v) => (typeof v === "string" && v.trim() === "" ? undefined : v),
    z.string().trim().min(2).max(120).optional(),
  ),
  contactEmail: z.preprocess(
    (v) => (typeof v === "string" && v.trim() === "" ? undefined : v),
    z.string().trim().toLowerCase().email().max(254).optional(),
  ),
  contactPhone: z.preprocess(
    (v) => (typeof v === "string" && v.trim() === "" ? undefined : v),
    z.string().trim().min(5).max(32).optional(),
  ),
});

export type PropertySetupInput = z.infer<typeof propertySetupInputSchema>;

export const propertySummarySchema = z.object({
  id: z.string(),
  name: z.string(),
  type: propertyTypeSchema,
  country: z.string(),
  city: z.string(),
  roomsCount: z.number().int(),
  airbnbUrl: z.string().nullable(),
  bookingUrl: z.string().nullable(),
  websiteUrl: z.string().nullable(),
});
export type PropertySummary = z.infer<typeof propertySummarySchema>;

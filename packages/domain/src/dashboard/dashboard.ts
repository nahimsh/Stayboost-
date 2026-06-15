import { z } from "zod";
import { pillarSchema, severitySchema } from "../analyzer/growth-report";

/** A signed delta (e.g. week-over-week %), used for trend chips. */
export const trendSchema = z.object({
  deltaPct: z.number(),
  direction: z.enum(["up", "down", "flat"]),
});

export const revenueOverviewSchema = z.object({
  currency: z.string().regex(/^[A-Z]{3}$/),
  monthToDateMinor: z.number().int().nonnegative(),
  trend: trendSchema,
  adrMinor: z.number().int().nonnegative(),
  revparMinor: z.number().int().nonnegative(),
  /** Daily revenue (minor units) for the current month — drives the sparkline. */
  dailyMinor: z.array(z.number().int().nonnegative()),
});

export const occupancyWidgetSchema = z.object({
  currentPct: z.number().min(0).max(100),
  targetPct: z.number().min(0).max(100),
  occupiedUnits: z.number().int().nonnegative(),
  totalUnits: z.number().int().positive(),
  next7Days: z.array(z.object({ date: z.string(), pct: z.number().min(0).max(100) })),
});

export const STAY_STATUSES = ["confirmed", "checked_in", "due", "pending"] as const;
export const staySchema = z.object({
  id: z.string(),
  guestName: z.string(),
  unitName: z.string(),
  date: z.string(), // ISO date
  nights: z.number().int().positive(),
  guests: z.number().int().positive(),
  status: z.enum(STAY_STATUSES),
});

export const aiRecommendationSchema = z.object({
  id: z.string(),
  pillar: pillarSchema,
  title: z.string(),
  detail: z.string(),
  impactLabel: z.string(),
  severity: severitySchema,
});

export const propertyHealthSchema = z.object({
  score: z.number().int().min(0).max(100),
  grade: z.enum(["A", "B", "C", "D"]),
  factors: z.array(
    z.object({ label: z.string(), score: z.number().int().min(0).max(100), weightPct: z.number() }),
  ),
});

export const LEAD_SOURCES = ["website", "referral", "ota", "campaign"] as const;
export const leadSchema = z.object({
  id: z.string(),
  name: z.string(),
  source: z.enum(LEAD_SOURCES),
  interest: z.string(),
  createdAt: z.string(),
  status: z.enum(["new", "contacted", "qualified", "won", "lost"]),
});

export const NOTIFICATION_TYPES = ["booking", "review", "pricing", "ops", "system"] as const;
export const notificationSchema = z.object({
  id: z.string(),
  type: z.enum(NOTIFICATION_TYPES),
  title: z.string(),
  body: z.string(),
  createdAt: z.string(),
  read: z.boolean(),
  severity: severitySchema,
});

export const dashboardSnapshotSchema = z.object({
  property: z.object({ id: z.string(), name: z.string(), type: z.string() }),
  generatedAt: z.string(),
  /** True while widgets are backed by the sample provider (no live PMS data yet). */
  demo: z.boolean(),
  revenue: revenueOverviewSchema,
  occupancy: occupancyWidgetSchema,
  checkIns: z.array(staySchema),
  checkOuts: z.array(staySchema),
  recommendations: z.array(aiRecommendationSchema),
  health: propertyHealthSchema,
  leads: z.array(leadSchema),
  notifications: z.array(notificationSchema),
});

export type Trend = z.infer<typeof trendSchema>;
export type RevenueOverview = z.infer<typeof revenueOverviewSchema>;
export type OccupancyWidget = z.infer<typeof occupancyWidgetSchema>;
export type Stay = z.infer<typeof staySchema>;
export type AiRecommendation = z.infer<typeof aiRecommendationSchema>;
export type PropertyHealth = z.infer<typeof propertyHealthSchema>;
export type Lead = z.infer<typeof leadSchema>;
export type NotificationItem = z.infer<typeof notificationSchema>;
export type DashboardSnapshot = z.infer<typeof dashboardSnapshotSchema>;

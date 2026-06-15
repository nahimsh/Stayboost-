import { z } from "zod";

/** The AI's structured output. Validated at the AI service boundary and again
 *  at the API edge before persistence — the model never returns free-form data. */

export const PILLARS = ["acquire", "monetize", "automate", "delight"] as const;
export const pillarSchema = z.enum(PILLARS);
export type Pillar = z.infer<typeof pillarSchema>;

export const SEVERITIES = ["high", "medium", "low"] as const;
export const severitySchema = z.enum(SEVERITIES);
export type Severity = z.infer<typeof severitySchema>;

export const findingSchema = z.object({
  title: z.string().min(3).max(160),
  severity: severitySchema,
  rationale: z.string().min(3).max(800),
  recommendedAction: z.string().min(3).max(400),
  estimatedImpact: z.string().min(1).max(120),
});
export type Finding = z.infer<typeof findingSchema>;

export const pillarInsightSchema = z.object({
  pillar: pillarSchema,
  score: z.number().int().min(0).max(100),
  headline: z.string().min(3).max(200),
  findings: z.array(findingSchema).max(6),
});
export type PillarInsight = z.infer<typeof pillarInsightSchema>;

export const quickWinSchema = z.object({
  title: z.string().min(3).max(160),
  action: z.string().min(3).max(400),
  pillar: pillarSchema,
});

/** Revenue uplift is always a transparent range (never a guarantee) in minor units. */
export const upliftRangeSchema = z.object({
  lowMinor: z.number().int().min(0),
  highMinor: z.number().int().min(0),
  currency: z.string().regex(/^[A-Z]{3}$/),
});

export const growthReportSchema = z.object({
  summary: z.string().min(10).max(2000),
  overallScore: z.number().int().min(0).max(100),
  estimatedMonthlyUplift: upliftRangeSchema,
  pillars: z.array(pillarInsightSchema).length(PILLARS.length),
  quickWins: z.array(quickWinSchema).min(1).max(5),
  confidence: z.number().min(0).max(1),
  model: z.string(),
  engine: z.enum(["claude", "heuristic"]),
  generatedAt: z.string().datetime(),
});

export type GrowthReport = z.infer<typeof growthReportSchema>;

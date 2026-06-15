import { z } from "zod";

/** The four StayBoost subscription tiers (see docs/09). */
export const PLAN_IDS = ["starter", "growth", "pro", "portfolio"] as const;
export const planIdSchema = z.enum(PLAN_IDS);
export type PlanId = z.infer<typeof planIdSchema>;

export type BillingPeriod = "monthly" | "annual";

/**
 * A plan's price. Money is integer minor units + ISO currency. `monthlyMinor` is
 * the month-to-month price; `annualMonthlyMinor` is the effective monthly price
 * when billed annually (the discounted rate we display). `null` price = custom
 * (sales-led).
 */
export const planPriceSchema = z.object({
  monthlyMinor: z.number().int().nonnegative().nullable(),
  annualMonthlyMinor: z.number().int().nonnegative().nullable(),
  currency: z.string().regex(/^[A-Z]{3}$/),
});

export const planSchema = z.object({
  id: planIdSchema,
  /** Pricing is "per property per month"; portfolio is per-unit/custom. */
  price: planPriceSchema,
  /** Property cap; null = unlimited / custom. */
  propertiesLimit: z.number().int().positive().nullable(),
  highlighted: z.boolean(),
  /** Where the plan's CTA leads. */
  cta: z.enum(["signup", "contact"]),
});

export type Plan = z.infer<typeof planSchema>;

const USD = "USD";

export const PLANS: Readonly<Record<PlanId, Plan>> = {
  starter: {
    id: "starter",
    price: { monthlyMinor: 0, annualMonthlyMinor: 0, currency: USD },
    propertiesLimit: 1,
    highlighted: false,
    cta: "signup",
  },
  growth: {
    id: "growth",
    price: { monthlyMinor: 4900, annualMonthlyMinor: 3900, currency: USD },
    propertiesLimit: 3,
    highlighted: false,
    cta: "signup",
  },
  pro: {
    id: "pro",
    price: { monthlyMinor: 12900, annualMonthlyMinor: 9900, currency: USD },
    propertiesLimit: 10,
    highlighted: true,
    cta: "signup",
  },
  portfolio: {
    id: "portfolio",
    price: { monthlyMinor: null, annualMonthlyMinor: null, currency: USD },
    propertiesLimit: null,
    highlighted: false,
    cta: "contact",
  },
};

export const PLAN_LIST: readonly Plan[] = PLAN_IDS.map((id) => PLANS[id]);

export function priceForPeriod(plan: Plan, period: BillingPeriod): number | null {
  return period === "annual" ? plan.price.annualMonthlyMinor : plan.price.monthlyMinor;
}

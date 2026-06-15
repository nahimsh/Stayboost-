"use client";

import Link from "next/link";
import { useState } from "react";
import { Check } from "lucide-react";
import {
  PLAN_LIST,
  priceForPeriod,
  type BillingPeriod,
  type Plan,
} from "@stayboost/domain";
import { Badge, buttonVariants, cn } from "@stayboost/ui";
import { formatMoney, makeMoney } from "@stayboost/utils";
import { getDictionary } from "@stayboost/i18n";

const t = getDictionary().pricing;

function propertiesLabel(plan: Plan): string {
  if (plan.propertiesLimit === null) return t.units.propertiesUnlimited;
  if (plan.propertiesLimit === 1) return t.units.propertyOne;
  return t.units.propertiesUpTo.replace("{count}", String(plan.propertiesLimit));
}

function priceLabel(plan: Plan, period: BillingPeriod): string {
  const minor = priceForPeriod(plan, period);
  if (minor === null) return t.units.custom;
  if (minor === 0) return t.units.free;
  return formatMoney(makeMoney(minor, plan.price.currency));
}

export function PricingPlans(): React.JSX.Element {
  const [period, setPeriod] = useState<BillingPeriod>("annual");

  return (
    <div className="space-y-8">
      <fieldset className="mx-auto flex w-fit items-center gap-1 rounded-full border bg-card p-1">
        <legend className="sr-only">{t.billing.toggleLabel}</legend>
        {(["monthly", "annual"] as const).map((value) => (
          <label
            key={value}
            className={cn(
              "cursor-pointer rounded-full px-4 py-2 text-sm font-medium transition-colors",
              period === value ? "bg-primary text-primary-foreground" : "text-muted-foreground",
            )}
          >
            <input
              type="radio"
              name="billing-period"
              value={value}
              checked={period === value}
              onChange={() => setPeriod(value)}
              className="sr-only"
            />
            {value === "monthly" ? t.billing.monthly : t.billing.annual}
            {value === "annual" ? (
              <span className="ml-2 hidden text-xs text-accent sm:inline">{t.billing.save}</span>
            ) : null}
          </label>
        ))}
      </fieldset>

      <ul className="grid gap-6 lg:grid-cols-4">
        {PLAN_LIST.map((plan) => {
          const copy = t.plans[plan.id];
          const isPaid = priceForPeriod(plan, period) !== null && priceForPeriod(plan, period) !== 0;
          return (
            <li key={plan.id}>
              <article
                className={cn(
                  "flex h-full flex-col rounded-lg border bg-card p-6",
                  plan.highlighted && "border-primary shadow-md ring-1 ring-primary",
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <h2 className="text-lg font-semibold">{copy.name}</h2>
                  {plan.highlighted ? <Badge>{t.plans.pro.badge}</Badge> : null}
                </div>
                <p className="mt-2 min-h-12 text-sm text-muted-foreground">{copy.tagline}</p>

                <div className="mt-4">
                  <span className="text-3xl font-bold">{priceLabel(plan, period)}</span>
                  {isPaid ? (
                    <span className="ml-1 text-sm text-muted-foreground">{t.units.perProperty}</span>
                  ) : null}
                </div>
                {isPaid && period === "annual" ? (
                  <p className="mt-1 text-xs text-muted-foreground">{t.units.billedAnnually}</p>
                ) : null}

                <p className="mt-4 flex items-center gap-2 text-sm">
                  <Check className="text-accent" aria-hidden />
                  {propertiesLabel(plan)}
                </p>

                <Link
                  href={plan.cta === "contact" ? "/contact" : "/signup"}
                  className={cn(
                    buttonVariants({ variant: plan.highlighted ? "primary" : "outline" }),
                    "mt-6 w-full",
                  )}
                >
                  {copy.cta}
                </Link>
              </article>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

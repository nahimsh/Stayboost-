# 09 — SaaS Subscription Model

## 1. Monetization philosophy

Price aligned to **value delivered, not features withheld**. The core dimensions
that scale with a customer's success are: **number of properties/units**,
**AI usage** (messages, actions), and **advanced revenue/automation capability**.
We blend a **per-property base + tiered plans + metered AI usage**, with optional
**performance-based upside** for revenue features.

Guiding rules:
- A **free / freemium tier** to drive bottom-up adoption (homestays).
- **Land** with automation + inbox value, **expand** into revenue + portfolio.
- Keep **AI unit economics positive** via metering + the model router
  ([07](07-ai-architecture.md)).
- Annual billing discount; transparent overage pricing.

## 2. Plan tiers

| | **Starter (Free/Freemium)** | **Growth** | **Pro** | **Portfolio / Enterprise** |
|---|---|---|---|---|
| **Target** | Single homestay/villa host | Growing host / small hotel | Hotels, ambitious operators | Property managers, groups |
| **Properties** | 1 | up to 3 | up to 10 | unlimited (per-unit pricing) |
| **Price (indicative)** | $0 | ~$49/property/mo | ~$129/property/mo | Custom + per-unit |
| **Unified inbox + AI drafts** | ✅ (limited AI msgs) | ✅ | ✅ | ✅ |
| **Auto-messaging journeys** | basic | ✅ | ✅ | ✅ |
| **Review responses (AI)** | limited | ✅ | ✅ | ✅ |
| **Dynamic pricing** | — | suggest-only | full + auto-push | full + auto-push |
| **Demand forecast / comp set** | — | basic | ✅ | ✅ + market intel |
| **Direct booking funnel** | — | ✅ | ✅ | ✅ + white-label |
| **Concierge (guest AI)** | — | ✅ | ✅ | ✅ |
| **Campaigns / upsells** | — | basic | ✅ | ✅ |
| **Automation builder** | — | — | ✅ | ✅ |
| **Portfolio command center** | — | — | — | ✅ |
| **Owner statements / multi-owner** | — | — | — | ✅ |
| **Public API & webhooks** | — | limited | ✅ | ✅ |
| **White-label** | — | — | — | ✅ |
| **Support** | community | email | priority | dedicated CSM + SLA |
| **AI usage included** | small monthly cap | moderate | high | pooled, custom |

> Prices indicative — validate via pricing experiments. Per-property pricing keeps
> it intuitive for hosts; per-unit/seat for large hotels & PMs.

## 3. Metered / usage-based components

Billed on top of the plan, metered via `usage_records` ([03](03-database-schema.md)):

- **AI messages / actions** beyond the plan's included allotment (overage per 1k).
- **Concierge conversations** (guest-facing volume).
- **API calls** beyond included quota.
- **Extra properties/units** above plan limits.
- **Campaign sends** (email/WhatsApp volume; WA has per-message carrier cost).

This protects margins: heavy AI users pay proportionally, while light users enjoy
generous included limits.

## 4. Performance / value-based add-ons (optional, premium)

For revenue features, offer an optional **success-aligned model** where palatable:
- **% of incremental revenue** attributed to dynamic pricing or recovered
  abandoned bookings (measured against a baseline), capped/transparent.
- **Per-recovered-booking** fee for abandoned-booking & win-back recovery.

These align our revenue with the customer's and are a powerful expansion lever for
Pro/Enterprise — but always optional and clearly measured to maintain trust.

## 5. Billing architecture

- **Billing provider:** Stripe (global) + Razorpay (India/regional) abstracted
  behind a `billing` module ([04](04-folder-structure.md)).
- **Subscriptions** table tracks plan, status, period, seats, limits, trial.
- **Trials:** 14-day Pro trial; freemium has no time limit but capped usage.
- **Proration** on upgrades/downgrades; dunning + retries on failed payments
  (`past_due` → grace → restricted).
- **Invoices** stored locally (`invoices`) mirroring provider records.
- **Tax/compliance:** delegate tax calculation (Stripe Tax) and remain
  PCI-out-of-scope by never touching card data.
- **Multi-currency** billing aligned to the org's currency.

## 6. Packaging & growth levers

- **Land:** freemium homestay → activate via inbox + auto-messaging value.
- **Expand:** unlock revenue (pricing/forecast) and concierge as they grow → upsell
  to Growth/Pro.
- **Multiply:** property managers adopt Portfolio tier (per-unit) → high ACV, high NRR.
- **Network effects:** benchmarks/market intel are premium and improve with scale,
  reinforcing higher tiers ([00](00-vision-and-strategy.md)).
- **Referral & partner** programs (PMs, consultants) for distribution.

## 7. Unit-economics guardrails

- Track **gross margin per tenant** = revenue − (AI cost + infra + payment fees).
- Model router + caching keep AI COGS low; metering recovers heavy usage.
- Alert on tenants whose AI cost approaches plan revenue → nudge to higher tier or
  apply overage.
- Target: healthy SaaS metrics — NRR > 120%, CAC payback < 12 months, gross margin
  > 75% at scale.

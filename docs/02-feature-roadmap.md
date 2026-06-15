# 02 — Feature Roadmap

Features are organized by the **four growth pillars** (Acquire, Monetize,
Automate, Delight) plus **Platform** foundations. Each feature is tagged with a
delivery phase (P0 = MVP, P1, P2, P3 — see [10](10-development-phases.md)) and a
RICE-style priority intuition.

---

## Pillar A — ACQUIRE (more bookings)

| Feature | Phase | Description |
|---|---|---|
| **Property & channel connect** | P0 | One-click connect to PMS/CM/OTA; pull reservations, rates, availability. |
| **Unified calendar & availability** | P0 | Single source of truth across channels. |
| **Demand forecasting** | P1 | Predict occupancy/demand by date using pace, seasonality, events, comp set. |
| **Dynamic pricing engine** | P1 | AI rate recommendations per unit/date with guardrails (min/max, floors). |
| **Auto price push** | P2 | Optional autonomous push of approved prices to channels. |
| **Comp-set & market intelligence** | P2 | Competitor rate/availability tracking + positioning advice. |
| **Channel mix optimizer** | P2 | Recommend where to list and how to allocate inventory. |
| **Direct-booking funnel & widget** | P1 | Conversion-optimized, embeddable booking engine to cut OTA commission. |
| **Reputation growth engine** | P1 | Solicit reviews at the right moment; lift score → ranking → bookings. |
| **SEO & listing optimizer** | P2 | AI-optimized listing copy/photos guidance per channel. |
| **Marketing campaign automation** | P2 | Email/WhatsApp promos, retargeting hooks, seasonal pushes. |
| **Metasearch & ad assist** | P3 | Google Hotel Ads / metasearch budget guidance. |

## Pillar B — MONETIZE (more revenue per guest)

| Feature | Phase | Description |
|---|---|---|
| **Upsell engine** | P1 | Pre-arrival & in-stay offers (early check-in, room upgrade, breakfast). |
| **Packages & add-ons** | P2 | Bundles (romance package, airport pickup, experiences). |
| **Length-of-stay optimization** | P2 | Min-stay rules, gap-night filling, orphan-night pricing. |
| **Abandoned-booking recovery** | P2 | Detect drop-off on direct funnel → automated nudge. |
| **Win-back & loyalty** | P2 | Re-engage past guests with personalized offers. |
| **Ancillary checkout** | P2 | In-app/guest-portal payment for add-ons. |
| **Owner/portfolio yield** | P3 | For property managers: per-owner revenue optimization & statements. |
| **Group & event quoting** | P3 | AI-assisted quotes for groups/long stays. |

## Pillar C — AUTOMATE (less manual work)

| Feature | Phase | Description |
|---|---|---|
| **Smart unified inbox** | P0 | Omnichannel inbox (WA/email/SMS/OTA) in one place. |
| **AI reply drafting** | P0 | Context-aware suggested replies; one-click send. |
| **Auto-messaging journeys** | P1 | Booking confirm, pre-arrival, check-in instructions, post-stay. |
| **No-code automation builder** | P2 | "When X, do Y" rules across modules. |
| **Housekeeping & task orchestration** | P1 | Auto-generate cleaning/maintenance tasks from the calendar; assign staff. |
| **AI ops triage** | P2 | Classify/prioritize incoming issues; route to right person. |
| **Auto-reporting** | P1 | Daily/weekly digest + AI narrative ("here's what happened & why"). |
| **Smart inbox summarization** | P1 | Thread summaries, sentiment, suggested next action. |
| **Document & knowledge ingestion** | P1 | Upload house rules/FAQs → powers concierge & replies via RAG. |

## Pillar D — DELIGHT (better guest experience)

| Feature | Phase | Description |
|---|---|---|
| **24/7 AI Concierge** | P1 | Multilingual guest assistant (booking Qs, local tips, requests). |
| **Pre-stay personalization** | P2 | Tailored upsells/info based on guest profile & trip purpose. |
| **In-stay service requests** | P2 | Guest requests → auto-create ops tasks → status updates. |
| **Sentiment monitoring** | P2 | Detect unhappy guests in real time → proactive recovery. |
| **Guest portal** | P2 | Self-serve check-in, info, add-ons, messaging. |
| **Review-response automation** | P1 | AI-drafted, on-brand responses to every review. |
| **Multilingual everything** | P1 | Auto-translate guest comms both directions. |

## Platform & Foundations

| Feature | Phase | Description |
|---|---|---|
| **Auth, orgs, roles (RBAC)** | P0 | Multi-tenant identity, property hierarchy, permissions. |
| **Onboarding wizard** | P0 | Connect → import → first AI insight in <24h. |
| **Billing & subscriptions** | P0 | Plans, trials, usage metering, invoices (see [09](09-saas-subscription-model.md)). |
| **Notifications** | P0 | In-app + email/push alerts. |
| **Audit log & explainability** | P1 | Every AI/human action logged with rationale. |
| **Public API & webhooks** | P2 | Developer platform for integrations/partners. |
| **Mobile app** | P2 | On-the-go ops, inbox, approvals. |
| **Benchmarking (network data)** | P3 | "Properties like yours" comparative insights. |
| **Marketplace** | P3 | Third-party connectors & experience providers. |
| **White-label** | P3 | For property-management brands. |

---

## MVP cut line (P0 — what ships first)

The MVP must prove the **core value loop** for one beachhead segment
(recommended: **homestays/villas + small independent hotels**):

1. Connect a property (1–2 PMS/CM/OTA integrations).
2. Unified calendar + smart unified inbox with **AI reply drafting**.
3. **Auto-messaging** for the booking lifecycle.
4. **One AI revenue insight** (basic demand/pricing recommendation, human-approved).
5. **Review-response drafting**.
6. Onboarding wizard + billing + dashboard with the first "money" metric.

Everything else layers on once the loop retains users and shows measurable uplift.

## Prioritization logic

- **P0:** prove value loop + monetizable from day one (inbox + automation + 1 revenue insight).
- **P1:** deepen each pillar with the highest-ROI AI features (pricing, concierge, journeys).
- **P2:** autonomy, optimization, and breadth (auto-push, automation builder, portal, campaigns).
- **P3:** network effects, platform, and enterprise/PM scale (benchmarks, marketplace, white-label).

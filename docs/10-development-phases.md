# 10 — Development Phases

A phased plan from MVP to scale. Each phase has a **theme, goal, scope, and exit
criteria**. Phases are value-gated: we don't start the next until the current one
proves its hypothesis. (Durations are planning estimates, not commitments.)

---

## Phase 0 — Foundations (Weeks 0–6)

**Theme:** the skeleton that everything hangs on.
**Goal:** a multi-tenant platform that can onboard an org and hold its data.

- Monorepo, CI/CD, environments, design system scaffold.
- Identity: orgs, users, memberships, RBAC, property hierarchy.
- Core data model + migrations + RLS (properties, units, reservations, guests).
- API gateway, auth, base REST surface, typed client.
- Connector framework (interface + normalizer) with **one** integration
  (recommended: one PMS/CM *or* Booking.com/Airbnb) + manual quick-add path.
- AI service skeleton (router, one agent, RAG ingestion, `ai_actions` logging).
- Billing scaffold (Stripe) + plans.

**Exit:** an org can sign up, connect/import 1 property, and see real data in a
basic dashboard. Internal-only.

---

## Phase 1 — MVP: Prove the Value Loop (Weeks 6–14)

**Theme:** demonstrate measurable value fast (Automate + first Acquire signal).
**Goal:** ship the [P0 feature cut](02-feature-roadmap.md) to design partners.

Scope:
- Onboarding wizard (<24h to first value) + baseline scan / "3 quick wins".
- Unified calendar + smart **unified inbox** with **AI reply drafting**.
- **Auto-messaging** booking lifecycle journeys.
- **Review-response drafting** + reputation view.
- **One AI revenue insight** (basic demand summary + suggest-only pricing).
- Command Center dashboard with the **money metric** + pending-action queue.
- Notifications, audit log, billing live (freemium + one paid tier).

**Exit (the real bar):** with ~10–25 design-partner properties — activation
> 60% (connected + first AI action in 24h), demonstrable time saved per week,
and at least one measurable uplift signal (response time, review score, or
pickup). This validates the core loop before we scale features.

---

## Phase 2 — Deepen the Pillars (Weeks 14–26)

**Theme:** make each pillar genuinely strong with the highest-ROI AI.
**Goal:** become the daily-driver "brain" for a property.

Scope (P1 features):
- **Dynamic pricing engine** (recommendations + guardrails + approve flow).
- **Demand forecasting** model + pace/comp-set basics.
- **24/7 AI Concierge** (guest-facing, multilingual, RAG-grounded) + knowledge ingestion.
- **Direct-booking funnel & widget** (cut OTA commission).
- **Reputation growth** (review solicitation timing).
- **Housekeeping & task orchestration** auto-generated from the calendar.
- **Auto-reporting** with AI narrative; smart inbox summaries.
- Upsell engine (pre-arrival/in-stay).
- More integrations (2–4 key PMS/CM/OTA + WhatsApp + payments).

**Exit:** paying customers across the beachhead segment; NRR trending up;
pricing/concierge driving attributable revenue uplift; integration coverage that
fits >70% of target prospects.

---

## Phase 3 — Autonomy, Breadth & Optimization (Weeks 26–40)

**Theme:** less human-in-the-loop, more coverage, more revenue surface.
**Goal:** graduated autonomy + the optimization features that compound revenue.

Scope (P2 features):
- **Auto price push** (AUTO autonomy with guardrails + reversibility).
- **No-code automation builder** + workflow engine GA.
- **Campaigns/marketing automation** (win-back, abandoned-booking recovery).
- **Channel mix optimizer**, parity monitoring, market intel.
- **Guest portal** (self check-in, requests, add-ons, ancillary checkout).
- **Sentiment monitoring + proactive service recovery.**
- **Mobile app**; **public API & webhooks** GA.
- Packages/add-ons, LOS optimization.

**Exit:** customers running meaningful operations autonomously; expansion revenue
from Pro tier; developer/partner ecosystem beginning.

---

## Phase 4 — Scale, Network Effects & Platform (Weeks 40+)

**Theme:** category leadership and defensibility.
**Goal:** become the default operating layer with compounding moats.

Scope (P3 features):
- **Portfolio command center** + multi-owner statements (Property Manager tier).
- **Benchmarking & network-data insights** ("properties like yours").
- **Marketplace** (connectors, experiences, partners) + **white-label**.
- Metasearch/ad assist; group & event quoting.
- Enterprise: SSO, advanced compliance, SLAs, data residency.
- Performance-based pricing add-ons; international expansion.
- AI: organizational learning, deeper autonomy, cross-property optimization.

**Exit:** strong NRR (>120%), positive unit economics at scale, multi-region,
self-serve + sales-assisted motions, defensible data/network moat.

---

## Cross-phase engineering disciplines (always on)

| Discipline | Practice |
|---|---|
| **Quality** | AI eval harness gates every prompt/model change; test coverage on domain logic. |
| **Reliability** | Idempotent syncs, retries/DLQ, circuit breakers around 3rd parties. |
| **Security & compliance** | RLS, least privilege, secrets vault, audit log, GDPR/CCPA from Phase 0. |
| **Observability** | Tracing, SLOs, AI-action telemetry, cost-per-tenant tracking. |
| **Feature flags** | Per-tenant rollout; ship dark, enable gradually. |
| **Docs** | This blueprint kept current; ADRs for major decisions. |

## Sequencing rationale

1. **Automate before Acquire-at-scale:** inbox + auto-messaging deliver instant,
   undeniable value and earn the trust needed for autonomous revenue actions later.
2. **Suggest before Auto:** pricing ships as suggestions first; autonomy is unlocked
   only after the model proves itself per customer.
3. **Depth before breadth:** nail one segment's full loop before chasing every
   property type and integration.
4. **Network effects last:** benchmarks/marketplace need scale to be valuable — they
   are the Phase 4 moat, not the Phase 1 hook.

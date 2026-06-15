# StayBoost — Master Blueprint (Condensed)

> The AI-Powered Hospitality Growth Operating System.
> Full detail in [`/docs`](docs/). This is the one-page synthesis.

---

## 1. What it is

The **intelligence + automation layer above** hospitality tools (PMS, channel
manager, OTAs, payments, messaging). Not a PMS/CRM/booking engine — the **brain**
that decides *what price, what message, what upsell, to which guest, when*, and
acts on it. For homestays, villas, resorts, hotels, and property managers.

**Core goal:** more bookings, more revenue, automated ops, better guest experience.

**The value loop:** Ingest data → AI analyzes → AI recommends/acts → guest/market
responds → measure outcome → smarter next cycle. This compounding loop is the product.

**Four pillars:** **Acquire** (bookings) · **Monetize** (revenue/guest) ·
**Automate** (less manual work) · **Delight** (guest experience).

**Moat:** data network effects + workflow lock-in + integration breadth + guest
relationship graph + AI orchestration IP.

---

## 2. Product architecture (7 layers)

`Experience → API/Gateway → Application/Domain → AI Orchestration → Event/Workflow
→ Data → Integration`. Modular, event-driven, **multi-tenant** (Org → Property →
Unit, with RLS isolation). Integrate, don't replace. See [docs/01](docs/01-product-architecture.md).

Domain modules: Properties, Reservations, Revenue/Pricing, Channels, Direct
Booking, Guest CRM, Inbox, Concierge, Campaigns, Reviews, Operations, Offers,
Analytics, Automations, Billing, Identity.

---

## 3. Feature roadmap (by pillar)

- **Acquire:** demand forecasting, dynamic pricing, channel mix, direct-booking
  funnel, reputation growth, marketing automation.
- **Monetize:** upsells, packages, LOS optimization, abandoned-booking recovery,
  win-back, owner/portfolio yield.
- **Automate:** smart unified inbox + AI replies, auto-messaging journeys, no-code
  automation builder, housekeeping/task orchestration, auto-reporting.
- **Delight:** 24/7 multilingual AI concierge, personalization, sentiment
  monitoring, guest portal, review-response automation.

**MVP cut:** connect → unified calendar + smart inbox w/ AI drafts → auto-messaging
→ one AI revenue insight → review-response → dashboard money-metric + billing.
See [docs/02](docs/02-feature-roadmap.md).

---

## 4. Data model

Multi-tenant Postgres + RLS, canonical model, pgvector for RAG, money as minor
units, UTC + property timezone. Core tables: organizations, users/memberships,
properties/units, rate_plans/pricing_rules/price_recommendations/demand_signals,
guests/reservations, channel_connections/sync_jobs, conversations/messages,
reviews, tasks, offers/campaigns/automations, ai_actions, events,
knowledge_chunks, subscriptions/usage_records/invoices.
See [docs/03](docs/03-database-schema.md).

---

## 5. Folder structure

Monorepo (turborepo/pnpm): `apps/` (web, mobile, guest-portal, admin) ·
`services/` (api [NestJS], ai [FastAPI/Python], integrations, workers, events) ·
`packages/` (domain, db, ui, auth, api-client, ai-contracts, i18n, utils) ·
`infra/` · `docs/`. Folder boundaries = future service boundaries.
See [docs/04](docs/04-folder-structure.md).

---

## 6. User flows

Onboarding (<24h to value, manual path always available) · daily command-center
triage · smart inbox + AI reply · dynamic pricing (graduated autonomy) · booking
lifecycle journeys · guest concierge · review/reputation · PM portfolio · no-code
automations. Principle: **AI proposes, human disposes** → autonomy earned per
domain. See [docs/05](docs/05-user-flows.md).

---

## 7. Dashboard

A **Growth Command Center**: AI daily briefing + money metrics + pending-action
approve queue, then modular widgets. Role-adaptive (Owner/Admin/Manager/Staff/
Viewer/PM-portfolio), property/org switcher, omnipresent "Ask StayBoost"
assistant. Next.js + Tailwind + shadcn/ui, real-time inbox/actions, i18n, a11y.
See [docs/06](docs/06-dashboard-architecture.md).

---

## 8. AI architecture

Agentic + grounded + explainable + cost-aware + eval-driven. **Primary model:
Claude (Anthropic)** — Opus/Sonnet/Haiku by task via a **model router**;
embeddings + optional specialist ML (demand). Agents: Pricing Advisor, Concierge,
Inbox Copilot, Reputation Manager, Campaign Writer, Ops Triage, Analyst/Briefing,
Onboarding Scout. RAG over tenant-scoped data (pgvector), short/long-term memory,
**guardrails** (schema validation, pricing floors, consent, confidence gating,
PII, reversibility), full `ai_actions` audit, offline+online evals.
See [docs/07](docs/07-ai-architecture.md).

---

## 9. API architecture

REST-primary (versioned `/v1`, RFC-7807 errors, idempotency keys, cursor paging,
money/UTC conventions) + GraphQL for dashboard reads + outbound webhooks. OAuth/OIDC
+ API keys, scoped RBAC, gateway rate-limiting, RLS as last defense. AI capability
endpoints (`/ai/ask`, draft-reply, price-rationale, actions). Public developer
platform + generated SDKs. See [docs/08](docs/08-api-architecture.md).

---

## 10. SaaS model

Value-aligned: **per-property base + tiered plans + metered AI usage**, optional
performance-based revenue add-ons. Tiers: **Starter (free)** → **Growth** →
**Pro** → **Portfolio/Enterprise** (per-unit, white-label). Metering via
`usage_records`; Stripe/Razorpay; freemium land → expand into revenue + portfolio.
Unit-economics guardrails (router/caching keep AI COGS low; target GM >75%, NRR
>120%). See [docs/09](docs/09-saas-subscription-model.md).

---

## 11. Development phases

- **P0 Foundations:** multitenancy, identity/RBAC, data+RLS, API, 1 connector, AI skeleton, billing.
- **P1 MVP — prove the loop:** onboarding, inbox+AI drafts, auto-messaging, review drafts, 1 revenue insight, command center.
- **P2 Deepen pillars:** dynamic pricing, forecasting, concierge, direct booking, reputation, ops tasks, auto-reports.
- **P3 Autonomy & breadth:** auto price-push, automation builder, campaigns, channel optimizer, portal, mobile, public API.
- **P4 Scale & network effects:** portfolio/PM tier, benchmarks, marketplace, white-label, enterprise, intl.

Sequencing: Automate before Acquire-at-scale · Suggest before Auto · Depth before
breadth · Network effects last. See [docs/10](docs/10-development-phases.md).

---

*Blueprint phase complete. Build follows the phased plan — no production code yet.*

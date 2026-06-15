# StayBoost

**The AI-Powered Hospitality Growth Operating System.**

StayBoost is not a PMS, a CRM, or a Booking Engine. It is the intelligence and
automation layer that sits *above* and *connects to* those systems — turning
fragmented hospitality operations into a single, AI-driven growth engine.

> **Mission:** Help every homestay, villa, resort, and hotel get more bookings,
> earn more revenue per guest, automate the operational grind, and deliver a
> guest experience that earns 5-star reviews — without hiring a revenue manager,
> a marketing team, or a data scientist.

---

## Who StayBoost is for

| Segment | Pain we solve |
|---|---|
| **Homestays** | No time/skill for marketing, pricing, or guest comms. We automate it all. |
| **Villas** | High-value, low-volume — every empty night hurts. We maximize occupancy + ADR. |
| **Resorts** | Complex upsell & multi-channel. We orchestrate revenue and guest journeys. |
| **Hotels** | Need RevPAR growth without enterprise software cost. We are the affordable brain. |
| **Property Managers** | Manage 5–500 units across owners. We give a portfolio command center. |

---

## What StayBoost does (the four pillars)

1. **Get More Bookings** — AI demand forecasting, dynamic pricing, channel
   optimization, conversion-optimized direct-booking funnels, and review/reputation growth.
2. **Increase Revenue** — Upsells, packages, length-of-stay optimization, win-back
   campaigns, and abandoned-booking recovery.
3. **Automate Operations** — Auto guest messaging, housekeeping/task orchestration,
   smart inbox, AI concierge, and reporting that writes itself.
4. **Improve Guest Experience** — 24/7 multilingual AI concierge, personalized
   journeys, sentiment monitoring, and proactive service recovery.

---

## The Blueprint

This repository currently contains the **complete product blueprint** — the
architecture, roadmap, and engineering plan — authored before a single line of
production code. Read it in order:

| # | Document | What's inside |
|---|---|---|
| 00 | [Executive Summary & Vision](docs/00-vision-and-strategy.md) | Vision, positioning, moat, business model thesis |
| 01 | [Product Architecture](docs/01-product-architecture.md) | System layers, modules, integration topology |
| 02 | [Feature Roadmap](docs/02-feature-roadmap.md) | Full feature catalog by pillar + prioritization |
| 03 | [Database Schema](docs/03-database-schema.md) | Multi-tenant data model, tables, relationships |
| 04 | [Folder Structure](docs/04-folder-structure.md) | Monorepo layout, services, conventions |
| 05 | [User Flows](docs/05-user-flows.md) | Onboarding, daily ops, guest journeys |
| 06 | [Dashboard Architecture](docs/06-dashboard-architecture.md) | Command center, role-based views, widgets |
| 07 | [AI Architecture](docs/07-ai-architecture.md) | Agents, RAG, models, orchestration, guardrails |
| 08 | [API Architecture](docs/08-api-architecture.md) | REST/GraphQL, webhooks, integrations, auth |
| 09 | [SaaS Subscription Model](docs/09-saas-subscription-model.md) | Tiers, pricing, billing, usage metering |
| 10 | [Development Phases](docs/10-development-phases.md) | Phased delivery plan from MVP to scale |

A condensed, single-page version of everything lives in
[`BLUEPRINT.md`](BLUEPRINT.md).

---

## Tech direction (proposed, see docs for rationale)

- **Frontend:** Next.js (React) + TypeScript + Tailwind + shadcn/ui
- **Backend:** Node.js (NestJS) primary API + Python (FastAPI) AI services
- **Data:** PostgreSQL (primary, multi-tenant) + Redis (cache/queues) + pgvector (embeddings)
- **AI:** Claude (Anthropic) as the primary reasoning/agent model, with a model-router for cost/latency
- **Infra:** Containerized, queue-driven (BullMQ/Celery), event bus, deployed on managed cloud
- **Integrations:** Channel managers, OTAs, PMS, payments, messaging (WhatsApp/Email/SMS)

---

## Status

🟢 **Blueprint phase** — architecture and planning complete. Implementation
follows the phased plan in [docs/10](docs/10-development-phases.md).

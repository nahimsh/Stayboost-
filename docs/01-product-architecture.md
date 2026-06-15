# 01 — Product Architecture

## 1. Architectural philosophy

StayBoost is a **modular, event-driven, multi-tenant SaaS** structured as a
layered system. The layers separate *connectivity* (getting data in/out),
*intelligence* (AI reasoning), *workflow* (acting), and *experience* (UI). This
separation lets us evolve the AI brain independently of integrations and UI.

## 2. The seven layers

```
┌─────────────────────────────────────────────────────────────────────┐
│  7. EXPERIENCE LAYER                                                  │
│     Web Dashboard · Mobile App · Guest-facing widgets · Email/WA UI   │
├─────────────────────────────────────────────────────────────────────┤
│  6. API & GATEWAY LAYER                                               │
│     REST + GraphQL · Webhooks · Auth · Rate limiting · Public API     │
├─────────────────────────────────────────────────────────────────────┤
│  5. APPLICATION / DOMAIN LAYER  (business modules)                    │
│   Pricing · Bookings · Inbox · Campaigns · Tasks · Reviews · Billing  │
├─────────────────────────────────────────────────────────────────────┤
│  4. AI ORCHESTRATION LAYER                                            │
│   Agents · Tools · RAG · Model Router · Guardrails · Memory · Evals   │
├─────────────────────────────────────────────────────────────────────┤
│  3. EVENT & WORKFLOW LAYER                                            │
│   Event Bus · Job Queues · Schedulers · Workflow Engine (automations) │
├─────────────────────────────────────────────────────────────────────┤
│  2. DATA LAYER                                                        │
│   PostgreSQL (tenant data) · Redis · pgvector · Object store · DWH    │
├─────────────────────────────────────────────────────────────────────┤
│  1. INTEGRATION LAYER  (the connectors)                               │
│   PMS · Channel Mgr · OTAs · Payments · Messaging · Reviews · Analytics│
└─────────────────────────────────────────────────────────────────────┘
```

## 3. Layer responsibilities

### Layer 1 — Integration (Connectors)
- Pluggable connector framework; each integration implements a common interface:
  `authenticate()`, `pull()`, `push()`, `subscribeWebhooks()`, `normalize()`.
- **Inbound:** reservations, availability, rates, guest profiles, reviews,
  messages, payouts.
- **Outbound:** rate/availability updates, messages, invoices.
- Normalizes every provider's payload into StayBoost's **canonical domain model**
  (a Reservation is a Reservation regardless of source).
- Categories: PMS (Cloudbeds, Hostaway, Guesty, Mews), Channel Managers
  (SiteMinder, RateGain), OTAs (Booking.com, Airbnb, Expedia, VRBO), Payments
  (Stripe, Razorpay), Messaging (WhatsApp Business, Twilio SMS, SendGrid email),
  Reviews (Google, TripAdvisor, OTA reviews).

### Layer 2 — Data
- **PostgreSQL** as the canonical multi-tenant store (row-level tenant isolation).
- **Redis** for cache, sessions, rate limits, and queue backing.
- **pgvector** for embeddings (RAG over property docs, guest history, knowledge base).
- **Object storage** (S3-compatible) for media, exports, attachments.
- **Data warehouse / OLAP** (e.g. ClickHouse or BigQuery) for analytics & ML
  feature store, fed by CDC/ETL from Postgres.

### Layer 3 — Event & Workflow
- **Event bus** (e.g. Kafka/Redis Streams/NATS) — every meaningful change emits an
  event (`reservation.created`, `review.received`, `message.inbound`,
  `price.recommendation.ready`).
- **Job queues** (BullMQ / Celery) for async work: AI generation, integration sync,
  campaign sends.
- **Workflow engine** — the no-code **Automation Builder** ("when X, do Y")
  compiles to durable workflows (Temporal-style) for reliability and retries.
- **Schedulers** for cron-like jobs (nightly pricing run, daily digest).

### Layer 4 — AI Orchestration
- See [07 — AI Architecture](07-ai-architecture.md). Houses agents, tool registry,
  RAG, model router, memory, guardrails, and eval harness. Exposed to the domain
  layer as services (`PricingAdvisor`, `Concierge`, `CampaignWriter`, `OpsTriage`).

### Layer 5 — Application / Domain (business modules)
Independent, well-bounded modules (potential future microservices). Each owns its
data, emits/consumes events, and exposes APIs:

| Module | Responsibility |
|---|---|
| **Properties & Units** | Property/unit/room-type config, content, policies |
| **Reservations** | Canonical bookings, calendar, availability |
| **Revenue & Pricing** | Demand model, dynamic pricing, rate plans, guardrails |
| **Channels & Distribution** | Channel mix, parity, sync orchestration |
| **Direct Booking** | Conversion-optimized booking funnel + widget |
| **Guest CRM** | Unified guest profiles, segments, lifetime value |
| **Inbox & Messaging** | Unified omnichannel inbox + AI replies |
| **Concierge** | Guest-facing AI assistant (pre/in/post stay) |
| **Campaigns & Marketing** | Win-back, abandoned booking, promos, email/WA |
| **Reviews & Reputation** | Aggregation, AI replies, review solicitation |
| **Operations & Tasks** | Housekeeping, maintenance, task orchestration |
| **Upsells & Ancillary** | Offers, packages, add-ons, checkout |
| **Analytics & Reporting** | Dashboards, auto-reports, benchmarks |
| **Billing & Subscription** | StayBoost's own SaaS billing, plans, usage |
| **Identity & Org** | Tenants, users, roles, properties hierarchy |

### Layer 6 — API & Gateway
- See [08 — API Architecture](08-api-architecture.md). Auth, rate limiting,
  REST + GraphQL, public developer API, webhooks out.

### Layer 7 — Experience
- See [06 — Dashboard Architecture](06-dashboard-architecture.md). Web app,
  mobile, guest widgets, and conversational surfaces (WhatsApp/email).

## 4. Multi-tenancy model

- **Tenant = Organization** (a company/host/property-management group).
- An Organization owns **multiple Properties**; each Property owns **Units/Room
  Types**. Property Managers can manage properties across **multiple Owners**.
- Isolation: single database with **row-level security** keyed on `org_id`
  (+ optional schema isolation for enterprise). Every query is tenant-scoped at
  the data-access layer; no cross-tenant access is possible without an explicit
  platform-admin context.
- Roles cascade: Org → Property → Unit. See [03](03-database-schema.md) and
  [06](06-dashboard-architecture.md).

## 5. Canonical domain model (high level)

```
Organization
 ├─ Users (roles)
 ├─ Subscription / Plan / Usage
 └─ Properties
     ├─ Units / RoomTypes
     ├─ RatePlans · PricingRules · DemandSignals
     ├─ Reservations ── Guests (Guest CRM)
     ├─ Channels (connections) · SyncJobs
     ├─ Conversations ── Messages (omnichannel)
     ├─ Reviews
     ├─ Tasks (ops/housekeeping)
     ├─ Campaigns · Offers · Upsells
     └─ Automations (workflow rules)
```

## 6. Cross-cutting concerns

- **Security:** SSO/OAuth, RBAC, encryption at rest/in transit, secrets vault,
  PII tokenization for guest data, full **audit log** of every AI/human action.
- **Observability:** structured logging, distributed tracing, metrics, AI-action
  telemetry (what the AI did, why, and the outcome).
- **Reliability:** idempotent integration syncs, retries with backoff, dead-letter
  queues, circuit breakers around third-party APIs.
- **Compliance:** GDPR/CCPA data subject requests, consent management for
  messaging, PCI-out-of-scope by delegating card data to payment processors.
- **Internationalization:** multi-currency, multi-language, timezone-aware
  scheduling everywhere.

## 7. Deployment topology (proposed)

- Containerized services orchestrated on managed Kubernetes (or a managed
  container platform initially for speed).
- Stateless API/app services autoscaled behind a gateway/load balancer.
- AI services isolated (Python/FastAPI) for independent scaling and GPU-optional
  workloads.
- Managed Postgres (primary + read replicas), managed Redis, managed object store.
- Separate worker pools per workload class (integration sync, AI gen, campaigns)
  to prevent noisy-neighbor contention.
- Environments: `dev` → `staging` → `production`, with per-tenant feature flags.

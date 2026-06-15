# 04 — Folder Structure

## 1. Strategy

A **monorepo** (pnpm/turborepo) holding all apps, services, and shared packages.
Rationale: shared types/domain models, atomic cross-cutting changes, single CI,
and the ability to extract a module into a standalone service later without a big
migration. Python AI services live alongside in their own workspace.

```
stayboost/
├── apps/                          # Deployable applications (user-facing)
│   ├── web/                       # Next.js dashboard (operator-facing)
│   ├── mobile/                    # React Native app (P2)
│   ├── guest-portal/              # Guest-facing self-serve portal (P2)
│   └── admin/                     # Internal platform-admin console
│
├── services/                      # Backend services / APIs
│   ├── api/                       # NestJS core API (gateway + domain modules)
│   │   └── src/
│   │       └── modules/
│   │           ├── identity/          # orgs, users, auth, rbac
│   │           ├── properties/
│   │           ├── reservations/
│   │           ├── pricing/
│   │           ├── channels/
│   │           ├── direct-booking/
│   │           ├── guests/            # Guest CRM
│   │           ├── inbox/             # conversations + messages
│   │           ├── concierge/
│   │           ├── campaigns/
│   │           ├── reviews/
│   │           ├── operations/        # tasks/housekeeping
│   │           ├── offers/            # upsells/packages
│   │           ├── analytics/
│   │           ├── automations/       # workflow engine bindings
│   │           └── billing/
│   │
│   ├── ai/                        # Python / FastAPI AI orchestration service
│   │   └── app/
│   │       ├── agents/                # pricing, concierge, campaign, ops_triage
│   │       ├── tools/                 # tool definitions agents can call
│   │       ├── rag/                   # ingestion, retrieval, embeddings
│   │       ├── router/                # model router (cost/latency/quality)
│   │       ├── guardrails/            # validation, policy, safety
│   │       ├── prompts/               # versioned prompt templates
│   │       ├── memory/                # short/long-term memory stores
│   │       └── evals/                 # offline eval harness + datasets
│   │
│   ├── integrations/              # Connector framework + per-provider adapters
│   │   └── src/
│   │       ├── core/                  # connector interface, normalizer, scheduler
│   │       ├── pms/                   # cloudbeds, hostaway, guesty, mews...
│   │       ├── channel-managers/
│   │       ├── otas/                  # booking, airbnb, expedia, vrbo
│   │       ├── payments/              # stripe, razorpay
│   │       ├── messaging/             # whatsapp, twilio, sendgrid
│   │       └── reviews/               # google, tripadvisor
│   │
│   ├── workers/                   # Async job processors (queues)
│   │   └── src/
│   │       ├── sync/                  # integration sync jobs
│   │       ├── ai-jobs/               # async AI generation
│   │       ├── campaigns/             # sends/schedules
│   │       └── reports/               # digests, exports
│   │
│   └── events/                    # Event bus consumers / workflow engine
│
├── packages/                      # Shared libraries (no deploy)
│   ├── domain/                    # Canonical types & domain models (TS)
│   ├── db/                        # Prisma/Drizzle schema, migrations, RLS
│   ├── ui/                        # Design system (shadcn/ui components)
│   ├── config/                    # eslint, tsconfig, tailwind presets
│   ├── auth/                      # shared auth/session/rbac helpers
│   ├── api-client/                # typed SDK generated from API (used by apps)
│   ├── ai-contracts/              # shared AI request/response schemas
│   ├── i18n/                      # translations & locale utilities
│   └── utils/                     # money, dates/tz, ids, logging
│
├── infra/                         # Infrastructure as code
│   ├── terraform/                 # cloud resources
│   ├── k8s/ (or compose/)         # manifests / helm charts
│   ├── docker/                    # Dockerfiles per service
│   └── migrations/                # DB migration runners / seed
│
├── docs/                          # ◄ THIS BLUEPRINT lives here
│   ├── 00-vision-and-strategy.md
│   ├── 01-product-architecture.md
│   ├── 02-feature-roadmap.md
│   ├── 03-database-schema.md
│   ├── 04-folder-structure.md
│   ├── 05-user-flows.md
│   ├── 06-dashboard-architecture.md
│   ├── 07-ai-architecture.md
│   ├── 08-api-architecture.md
│   ├── 09-saas-subscription-model.md
│   └── 10-development-phases.md
│
├── tests/                         # e2e / integration suites (per-app unit tests live local)
├── scripts/                       # dev tooling, codegen, seeders
├── .github/workflows/             # CI/CD pipelines
├── turbo.json                     # monorepo task graph
├── pnpm-workspace.yaml
├── BLUEPRINT.md                   # condensed single-page blueprint
└── README.md
```

## 2. Conventions

- **Domain-driven module layout** inside `services/api` — each module owns its
  controllers, services, DTOs, events, and tests; cross-module calls go through
  published interfaces/events, never direct table access.
- **Shared types in `packages/domain`** are the single source of truth; the API
  generates a typed client into `packages/api-client` consumed by all frontends.
- **AI is a separate service** (`services/ai`) so it scales independently and can
  swap models/runtime without touching business logic. The API talks to it via
  `packages/ai-contracts` schemas.
- **Connectors are isolated** in `services/integrations` behind one interface, so
  adding a PMS/OTA never touches domain code.
- **Workers vs API**: anything slow, retryable, or scheduled lives in `workers`;
  the API stays fast and request-scoped.
- **Tests co-located** with code (`*.spec.ts`); cross-service e2e in `/tests`.
- **Feature flags** gate phased rollout per tenant.

## 3. Why this structure scales to a billion-dollar org

- Clear seams → modules can graduate to independent microservices with minimal
  churn (the folder *is* the future service boundary).
- One repo, one CI, shared types → fast iteration while small; enforced
  boundaries → safe while large.
- AI, integrations, and workers are isolated blast radii — the three areas most
  likely to change or fail.

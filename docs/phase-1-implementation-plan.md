# Phase 1 — Implementation Plan (Approved)

**Phase 1 (Public Foundation):** the public-facing front door + the hook that
proves value before signup, plus the authenticated shell. Built feature by
feature; after each feature: test → fix → optimize → improve UI → commit.
Production-ready code only, no placeholders.

## Deliverables & order

| # | Feature | Status |
|---|---|---|
| 0 | Monorepo foundation (workspace, design system, i18n, utils, CI) | ✅ done |
| 1 | **Landing Page** | ✅ done |
| 2 | **Pricing Page** (4 tiers, single-sourced config) | ✅ done |
| 3 | **Contact Page** (NestJS API + email + lead capture) | ✅ done |
| 4 | **AI Property Analyzer** (FastAPI agent + report) | ✅ done |
| 5 | **Authentication** (NestJS-owned, org/RBAC, sessions) | ✅ done |
| 6 | **Dashboard Skeleton** (Command Center shell, 8 widgets, sample-data API) | ✅ done |

| 7 | **Property Setup Wizard** (post-signup onboarding → real Property entity) | ✅ done |

**Phase 1 (Public Foundation) is complete.** The Property Setup Wizard captures
the property (name, type, location, Airbnb/Booking.com/website URLs, rooms,
contact) right after signup, creating the tenant-owned `Property` that now powers
the Dashboard (real name/type/units) and is ready to feed the Analyzer. Next:
replace the dashboard's sample-data provider with live Reservations/Revenue/
Reviews modules, and prefill a logged-in Analyzer run from the saved property.

> Order notes: Pricing was built before Contact because it is frontend-only.
> The AI Property Analyzer was built before Authentication (per the user's
> priority order) — the guided form runs without an account; claim-on-signup
> wiring lands with Authentication. The FastAPI AI service (`services/ai`) ships
> with a Claude engine (primary) + a deterministic heuristic engine (offline
> baseline / dev / CI fallback), behind the core API's `/v1/analyzer` routes.

## Decisions (see ADR 0001)

D1 Prisma · D2 NestJS-owned auth · D3 Resend email · D4 guided-form Analyzer.

## Out of scope for Phase 1

PMS/OTA integrations, live inbox, real pricing engine, billing checkout, native
mobile app. The Analyzer runs on user-provided input — no channel connection.

## Cross-cutting (enforced per CLAUDE.md)

Mobile-first, i18n + RTL-ready, WCAG 2.1 AA, multi-tenant RLS from the first
tenant-owned table, Zod validation at every boundary, RFC-7807 errors,
rate-limiting + captcha on public AI/contact endpoints, secrets in env/vault,
Vitest unit/component + e2e for critical flows, green CI gate.

## Exit criteria

A visitor can run the Analyzer, get a structured Growth Report, sign up, and land
in the dashboard with that report attached; auth + org/RBAC solid with a
cross-tenant test; CI green (lint + typecheck + test + build); OpenAPI → generated
client; docs/ADRs current.

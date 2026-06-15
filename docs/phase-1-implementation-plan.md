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
| 4 | **Authentication** (NestJS-owned, org/RBAC, sessions) | ⏳ next |
| 5 | **AI Property Analyzer** (FastAPI agent + report + claim-on-signup) | ⏳ |
| 6 | **Dashboard Skeleton** (Command Center shell, real empty states) | ⏳ |

> Order note: Pricing was built before Contact because it is frontend-only and
> completes the marketing site's internal links. The NestJS API + FastAPI AI
> service are introduced next for Contact → Auth → Analyzer.

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

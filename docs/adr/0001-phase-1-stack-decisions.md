# ADR 0001 — Phase 1 stack & tooling decisions

- **Status:** Accepted
- **Date:** 2026-06-15
- **Context:** Bootstrapping the StayBoost monorepo for Phase 1 (public web
  foundation + AI Property Analyzer + auth + dashboard skeleton). The blueprint
  ([`/docs`](../)) fixes the high-level stack; this ADR records the concrete
  choices made when implementation started, per the approved Phase 1 plan.

## Decisions

| # | Decision | Choice | Rationale |
|---|---|---|---|
| D1 | ORM / migrations | **Prisma** (repo-wide, in `packages/db`) | Typed client + fast iteration; one ORM repo-wide per CLAUDE.md. |
| D2 | Auth ownership | **NestJS-owned** (email/password + Google OAuth, short-lived access + refresh, httpOnly/Secure/SameSite cookies) | API is the single source of truth so the future mobile app reuses it. |
| D3 | Transactional email | **Resend** behind a messaging abstraction | Good DX; abstracted so it can be swapped without touching domain code. |
| D4 | Analyzer input | **Guided form first**, URL enrichment as a fast-follow | Avoids scraping legal/complexity risk; ships value immediately. |

## Tooling baseline

- **Monorepo:** pnpm workspaces + Turborepo. Node ≥ 22.
- **Frontend:** Next.js 15 (App Router) + React 19 + TypeScript 5.6 + Tailwind 3.4
  + a shadcn-style design system in `packages/ui`.
- **Shared packages:** `config` (tsconfig/eslint/tailwind presets), `utils`
  (money/format/cn), `i18n` (typed dictionaries, RTL-ready), `ui`, `domain`
  (added with the first API-backed feature).
- **TypeScript:** `strict` + `noUncheckedIndexedAccess`, `noImplicitOverride`,
  `exactOptionalPropertyTypes`, no `any`, no non-null assertions (enforced by ESLint).
- **Testing:** Vitest (+ Testing Library) for unit/component; e2e added with auth.
- **Quality gate:** GitHub Actions runs lint → typecheck → test → build on every push/PR.

## Consequences

- Backend services (`services/api` NestJS, `services/ai` FastAPI) and
  `packages/db` are introduced in the feature that first needs them (Contact /
  Auth / Analyzer), keeping the tree free of unused scaffolding.
- All design tokens live in the Tailwind preset + `globals.css`; components never
  hardcode color or spacing.

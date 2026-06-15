# CLAUDE.md

Guidance for Claude Code (and every engineer/agent) working in this repository.
**StayBoost is production software.** Treat every change as if it ships to paying
hospitality businesses tonight. When in doubt, prefer correctness, security, and
clarity over cleverness.

> Read the [`/docs`](docs/) blueprint and [`BLUEPRINT.md`](BLUEPRINT.md) before
> making architectural changes. This file is the operational contract; the docs
> are the design rationale.

---

## 1. What this project is

StayBoost — an **AI-Powered Hospitality Growth Operating System**. A multi-tenant
SaaS that connects to hospitality tools (PMS/channel managers/OTAs) and uses AI to
increase bookings, revenue, automation, and guest experience. It is **not** a
PMS/CRM/booking engine — it is the intelligence + automation layer above them.

**Golden rules that override convenience:**
1. **Multi-tenant isolation is sacred.** Every tenant-owned query is scoped by
   `org_id`; RLS is the last line of defense. A cross-tenant data leak is a P0
   incident. Never trust a client-supplied `org_id`.
2. **AI proposes, human disposes** (until autonomy is explicitly earned). Every AI
   action is logged to `ai_actions` with rationale, model, and cost.
3. **Money is never a float.** Always integer minor units + ISO currency code.
4. **Time is UTC in storage**, localized at the edge using the property timezone.
5. **No secrets in code or logs. Ever.**

---

## 2. Tech stack (authoritative)

| Area | Choice |
|---|---|
| Monorepo | pnpm workspaces + Turborepo |
| Frontend | Next.js (App Router) + TypeScript + Tailwind + shadcn/ui |
| Core API | NestJS (TypeScript) |
| AI service | Python + FastAPI (`services/ai`) |
| DB | PostgreSQL (RLS multi-tenant) + Redis + pgvector |
| ORM/migrations | Prisma or Drizzle (one, repo-wide) in `packages/db` |
| Queues/workflow | BullMQ (TS) / Celery (Py); durable workflows for automations |
| AI models | Claude (Anthropic) primary, via a model router (see `docs/07`) |
| Billing | Stripe + Razorpay behind a `billing` module |
| Validation | Zod (TS) at every boundary |

Do not introduce a new framework, database, or major dependency without an ADR in
`docs/adr/` and explicit approval.

---

## 3. Folder structure

Mirror [`docs/04-folder-structure.md`](docs/04-folder-structure.md). Summary:

```
apps/        web · mobile · guest-portal · admin
services/    api (NestJS) · ai (FastAPI) · integrations · workers · events
packages/    domain · db · ui · auth · api-client · ai-contracts · i18n · utils
infra/       terraform · k8s/compose · docker · migrations
docs/        the blueprint (source of architectural truth)
```

Rules:
- **Folder boundaries are service boundaries.** Cross-module calls go through
  published interfaces/events, **never** direct table access into another module.
- Shared types live in `packages/domain` — the single source of truth. Frontends
  consume the generated typed client from `packages/api-client`, never hand-rolled
  fetch types.
- Connectors stay isolated in `services/integrations` behind the common connector
  interface. Adding a PMS/OTA must not touch domain code.
- Anything slow, retryable, or scheduled belongs in `services/workers`, not the API
  request path.
- Tests co-located as `*.spec.ts` / `test_*.py`; cross-service e2e in `/tests`.

---

## 4. Coding standards

- **Language:** TypeScript everywhere except the AI service (Python 3.12+).
- **Formatting/linting:** Prettier + ESLint (TS), Ruff + Black (Py). CI fails on lint
  errors. Run formatters before committing; never hand-format.
- **Naming:** `camelCase` vars/functions, `PascalCase` types/components/classes,
  `UPPER_SNAKE` constants, `kebab-case` filenames (except React components →
  `PascalCase.tsx`). Names describe intent, not type (`isLoading`, not `flag`).
- **Functions:** small, single-responsibility, early-return over nested `if`. Pure
  where possible; isolate side effects.
- **Comments:** explain *why*, not *what*. Match surrounding density. No commented-out
  code in commits.
- **Errors:** never swallow. Throw typed domain errors; map to RFC-7807 at the API
  edge. No empty `catch`. Log with context (never PII).
- **Imports:** absolute via workspace aliases (`@stayboost/domain`), not deep relative
  paths.
- **No magic numbers/strings** — use named constants/enums.
- **Commits:** Conventional Commits (`feat:`, `fix:`, `chore:`…), imperative, scoped.
  Small and focused. Never commit secrets, `.env`, or generated artifacts.
- **Dead code:** delete it; git remembers. No `TODO` without a tracked issue link.

---

## 5. TypeScript rules

- **`strict: true`** plus `noUncheckedIndexedAccess`, `noImplicitOverride`,
  `exactOptionalPropertyTypes`. These are non-negotiable.
- **`any` is banned.** Use `unknown` + narrowing, generics, or a real type. `// @ts-ignore`
  / `// @ts-expect-error` require an inline justification comment.
- **Validate at boundaries with Zod.** Anything crossing a trust boundary (HTTP body,
  query, webhook payload, env, AI output) is parsed/validated before use. Derive TS
  types from Zod schemas (`z.infer`) — don't duplicate.
- **No non-null assertions (`!`)** to bypass nullability — handle the null case.
- **Discriminated unions** for state (e.g. `{ status: 'loading' } | { status: 'ready'; data }`)
  over boolean soup.
- **`readonly` / `as const`** for immutable data; prefer immutable updates.
- **Domain primitives:** money as `{ amountMinor: number; currency: string }`, never raw
  numbers. Branded types for IDs (`OrgId`, `PropertyId`) to prevent mix-ups.
- **No default exports** (except Next.js pages/route requirements) — named exports aid
  refactoring.
- Public functions in `packages/*` carry explicit return types.

---

## 6. Component rules (React/Next.js)

- **Server Components by default**; add `"use client"` only when interactivity/browser
  APIs are needed. Keep client bundles small.
- **One component per file**; component file ≤ ~200 lines — extract sub-components and
  hooks past that.
- **Composition over configuration.** Avoid mega-components with 15 boolean props; compose
  smaller pieces.
- **Props:** typed interfaces, required by default, optional only when truly optional.
  No prop drilling > 2 levels — use context or composition.
- **State:** local state local; server state via React Query/RSC (never duplicate server
  data into client state); global UI state minimal and explicit.
- **Data fetching** happens in server components / loaders / the API client — never
  ad-hoc `fetch` scattered in components.
- **Side effects** in `useEffect` only when unavoidable; prefer event handlers and server
  actions. Always clean up subscriptions/timers.
- **Design system first:** build from `packages/ui` (shadcn/ui). Don't reinvent buttons,
  inputs, modals. New primitives go into `packages/ui`, not app code.
- **Every interactive element** has loading, empty, error, and success states. No "white
  screen while fetching."
- **Keys** must be stable IDs, never array index.
- **No business logic in components** — push it into hooks, services, or the domain layer.

---

## 7. UI rules

- **Action-oriented & money-first** (see `docs/06`): every insight pairs with an action;
  revenue impact is surfaced, not buried.
- **Progressive disclosure:** simple for a homestay host, powerful on demand for a revenue
  manager/PM. Role-adaptive views.
- **Consistency:** spacing, color, and typography come from the Tailwind design tokens in
  `packages/config`. No arbitrary hex values or one-off pixel values; use the scale.
- **Feedback within 100ms** for any user action (optimistic UI for approvals, skeletons for
  loads, toasts for outcomes). Never leave the user guessing.
- **Empty states teach** — explain what goes here and offer the next action.
- **Internationalization from day one:** all user-facing strings via `packages/i18n`. No
  hardcoded copy. RTL-ready. Format dates/numbers/currency per locale + property timezone.
- **Accessibility (WCAG 2.1 AA):** semantic HTML, labelled inputs, keyboard-navigable,
  visible focus, sufficient contrast, `aria-*` where needed, respects
  `prefers-reduced-motion`. Accessibility is a requirement, not a nice-to-have.
- **AI is a first-class citizen** of the UI (briefings, inline actions, "Ask StayBoost"),
  not a hidden chatbot. AI suggestions are always clearly labeled as AI and explainable.

---

## 8. Mobile-first design requirements

- **Design and build mobile-first**, then enhance upward. Base styles target the smallest
  screen; layer complexity at larger breakpoints with Tailwind (`sm` `md` `lg` `xl`).
  Operators run StayBoost from their phones between guest interactions.
- **Touch targets ≥ 44×44px**; adequate spacing to prevent mis-taps.
- **No horizontal scroll**; content reflows. Tables become cards/stacked layouts on small
  screens.
- **Thumb-reachable primary actions**; avoid critical actions in hard-to-reach corners.
- **Performance on mid-range devices and 3G/4G** is the baseline target, not high-end
  desktop. Test on throttled network + CPU.
- **Responsive images** (`next/image`, correct `sizes`), no fixed huge assets.
- **Forms:** correct `inputmode`/`type` for mobile keyboards; minimize typing; sensible
  autofill.
- **Safe areas** respected (notches/home indicator); test in both orientations.
- The native app (`apps/mobile`, React Native) shares the design system and API client —
  parity of capability, platform-appropriate UX.

---

## 9. API standards

Follow [`docs/08-api-architecture.md`](docs/08-api-architecture.md). Enforced rules:

- **Versioned** under `/v1`; breaking changes → new version + deprecation headers.
- **Tenant context** derived from the auth token/API key — never from a client-supplied
  field. RLS enforces isolation at the DB.
- **Validate every input** at the edge with Zod; reject malformed requests early.
- **Errors as RFC-7807** `application/problem+json` (`type`, `title`, `status`, `detail`,
  `errors[]`). Consistent, machine-readable, no stack traces to clients.
- **Idempotency keys** required on all mutating, side-effecting POSTs (messages, price
  pushes, payments, campaign sends).
- **Cursor-based pagination** with sane default + max limits. No unbounded list endpoints.
- **Money/time conventions:** `{ amount_minor, currency }`, ISO-8601 UTC timestamps.
- **Auth & scopes:** OAuth/OIDC for users, scoped API keys for the public API; RBAC checked
  at the gateway *and* per resource. Least privilege.
- **Rate limiting** per token/key, tiered by plan.
- **Inbound webhooks** (provider integrations) must verify signatures before processing and
  translate into internal events; never trust raw payloads.
- **Outbound webhooks** are HMAC-signed with retries + DLQ.
- **Idempotent integration syncs**; retries with backoff; circuit breakers around third-party
  APIs.
- Document every endpoint in OpenAPI; the typed client in `packages/api-client` is generated
  from it.

---

## 10. Security standards

Security is a feature. Non-negotiables:

- **Tenant isolation:** `org_id` scoping in the data-access layer + Postgres RLS. Add a
  test for cross-tenant access on every new tenant-owned resource.
- **Secrets:** in a secrets vault / env, never in code, logs, or the repo. `.env` is
  git-ignored. Integration credentials stored via the vault and referenced, not inlined.
- **AuthN/AuthZ:** short-lived access tokens + refresh; RBAC with fine-grained scopes;
  enforce authorization on every request — never rely on UI to hide capabilities.
- **Input validation & output encoding:** validate all input (Zod), parameterized queries
  only (no string-built SQL), escape output to prevent XSS. ORM-only DB access.
- **PII:** guest email/phone are PII — encrypt/tokenize at rest, access via the Guest CRM
  with consent checks, redact from logs and (where feasible) from model prompts.
- **Transport:** TLS everywhere; HSTS; secure cookies (`HttpOnly`, `SameSite`, `Secure`).
- **CSRF/CORS:** CORS locked to known origins; CSRF protection on cookie-auth routes.
- **Payments:** delegate card data to Stripe/Razorpay — stay PCI-out-of-scope. Never store
  PANs.
- **AI guardrails:** validate AI structured output against schemas before execution; enforce
  business guardrails (pricing floors, consent before messaging, spend caps, confidence
  gating, autonomy levels); every AI action is reversible and audited.
- **Dependencies:** pinned versions; automated vulnerability scanning (Dependabot/audit) in
  CI; no unmaintained/untrusted packages.
- **Audit log:** all write operations and AI/human actions are recorded.
- **Compliance:** GDPR/CCPA data export & erase routines that cascade across tables;
  consent management for messaging.
- Follow OWASP Top 10; treat any cross-tenant or PII exposure as a P0.

---

## 11. Performance requirements

- **Command Center** above-the-fold KPIs render in **< 1s** (cached/pre-aggregated).
  General page interactive in **< 2.5s** on a mid-range mobile + 4G.
- **Core Web Vitals targets:** LCP < 2.5s, INP < 200ms, CLS < 0.1.
- **API latency:** p95 read < 300ms, p95 write < 600ms (excluding intentional async AI work).
- **Heavy analytics** run in the warehouse and serve pre-aggregated results — never compute
  expensive rollups in the request path.
- **AI work is async** via the worker queue for anything non-interactive; interactive AI
  (drafts, Ask StayBoost) streams responses and shows progress.
- **Database:** every hot query backed by an index; no N+1 (batch/`include`/dataloader);
  composite indexes on `(org_id, property_id, …)`; partition large time-series tables;
  use read replicas for reporting.
- **Caching:** Redis for hot reads, sessions, rate limits; cache AI prompt/results where
  repeatable; HTTP caching headers where safe.
- **Frontend:** code-split by route, lazy-load below-the-fold, tree-shake, keep client
  bundles lean (prefer Server Components), `next/image` for all images, no blocking
  third-party scripts.
- **Pagination/limits** on every list to protect the DB.
- **Cost is a performance metric:** the model router picks the cheapest-capable model; track
  tokens + cost per `ai_action`; keep per-tenant gross margin positive.
- **No regressions:** watch bundle size and key query plans in CI; profile before optimizing,
  measure after.

---

## 12. Testing & quality gates

- **Unit tests** for domain logic (pure, fast). **Integration tests** for API + DB
  (incl. an RLS/cross-tenant test per tenant-owned resource). **E2E** for critical flows
  (onboarding, inbox reply, price approval, booking lifecycle).
- **AI eval harness** (`services/ai/app/evals`) gates every prompt/model change — ship only
  on regression-free hospitality task suites.
- **CI must pass** lint + typecheck + tests + build before merge. Green CI is the bar.
- New behavior ships with tests. Bug fixes ship with a regression test.
- **Feature flags** gate phased/per-tenant rollout — ship dark, enable gradually.

---

## 13. Working in this repo (for Claude / agents)

- **Read before you write.** Match existing patterns, naming, and structure in the module
  you touch. Consistency beats personal preference.
- **Stay in your module's boundary**; if a change spans modules, go through interfaces/events.
- **Don't introduce dependencies, frameworks, or DBs** without an ADR + approval.
- **Never weaken** tenant isolation, validation, auth, or guardrails to make something work.
  If a guardrail is in the way, that's a design discussion, not a bypass.
- **Verify with the relevant Claude/Anthropic API docs** (model IDs, pricing, params) before
  touching AI code — don't rely on memory.
- **Commit small, with Conventional Commit messages.** Don't commit secrets or generated code.
- **Update docs** when you change architecture; add an ADR for significant decisions.
- **When uncertain about product intent**, ask rather than guess — this software handles real
  bookings, real money, and real guests.

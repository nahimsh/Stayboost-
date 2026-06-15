# ADR 0002 — Phase 1 hardening & scaling decisions

- **Status:** Accepted
- **Date:** 2026-06-15
- **Context:** A full codebase audit (architecture, security, performance,
  scalability, a11y, SEO) was run after the Contact feature. This ADR records the
  decisions taken for the items that are deliberately scoped or deferred, so the
  code can reference a tracked decision instead of bare TODOs.

## Decisions

1. **Rate-limit storage is Redis-backed when `REDIS_URL` is set, in-memory
   otherwise.** Production deploys (multi-instance) MUST set `REDIS_URL` —
   enforced by the env schema's production refinement. Local/dev/CI use the
   in-memory store. (`services/api/src/app.module.ts`)

2. **Idempotency keys are deferred past the Contact endpoint.** A duplicate
   contact lead is low-harm (it creates an extra row + resends an email). The
   `Idempotency-Key` contract from docs/08 will be implemented as a reusable
   interceptor when the first high-stakes mutation lands (auth signup, payments,
   message/price pushes), backed by Redis.

3. **Health split into liveness + readiness.** `/v1/health` is a cheap liveness
   probe; `/v1/health/ready` verifies the database (and will verify Redis/queues
   as they are added). Orchestrators gate traffic on readiness.

4. **Web CSP is pragmatic, not nonce-based.** The App Router CSP allows
   `'unsafe-inline'` for Next's hydration runtime. Tightening to per-request
   nonces requires CSP middleware and is tracked for a later hardening pass.

5. **`@stayboost/api-client` is hand-authored for now.** docs/08 mandates an
   OpenAPI-generated client. Until the API surface grows beyond a couple of
   endpoints (auth/analyzer), the hand-written typed client is acceptable;
   introducing OpenAPI + codegen is tracked before the client expands materially.

6. **Prisma client generation is wired via `packages/db` `postinstall` and an
   explicit CI step**, so a clean `pnpm install` produces the typed client before
   typecheck/build.

## Consequences

- These notes are referenced from code comments rather than `TODO`s.
- Items 2, 4, and 5 become required work in later phases and should be tracked as
  issues before the triggering feature merges.

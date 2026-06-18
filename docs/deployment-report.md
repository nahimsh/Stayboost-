# StayBoost — Deployment Report

**Date:** 2026-06-16 · **Scope:** deployment only (no feature development).

## Executive status

| # | Task | Status | Owner |
|---|------|--------|-------|
| 1 | Provision PostgreSQL + pgvector | ⛔ **Blocked — needs your cloud account** | You (1 click, runbook §1) |
| 2 | Provision Redis | ⛔ Blocked — needs your cloud account | You (runbook §2) |
| 3 | Deploy API → Railway | 🟡 **Automated, not yet run** | `Deploy` workflow |
| 4 | Deploy AI → Railway | 🟡 Automated, not yet run | `Deploy` workflow |
| 5 | Deploy Web → Vercel | 🟡 Automated, not yet run | `Deploy` workflow |
| 6 | Configure environment variables | 🟡 Template + contract ready | You (set in Railway/Vercel) |
| 7 | Run migrations | ✅ **Automated on release** (idempotent) | API image / preDeploy |
| 8 | Verify authentication | ✅ **Harness built**, runs post-deploy | `verify-deployment.sh` |
| 9 | Verify RLS on deployed env | ✅ Harness built, runs post-deploy | `verify-deployment.sh` |
| 10 | Produce deployment report | ✅ This document | — |

> **Why tasks 1–6 aren't executed here:** this build environment has **no Railway/Vercel
> credentials and no outbound access to those control planes** (the container registry is
> also firewalled). I cannot provision infrastructure or deploy to your accounts from here.
> Everything that does not require your credentials is done and committed; the rest is
> reduced to setting secrets and clicking **Run workflow**.

## What was delivered this session (deployment enablement only — no features)

- **`.env.production.example`** — consolidated, per-service production variable contract.
- **`.github/workflows/deploy.yml`** — one-click / tag-triggered deploy: AI + API → Railway,
  Web → Vercel, then an automatic **verify** job. Preflight steps fail fast with a clear
  message if a required secret/var is missing.
- **`scripts/verify-deployment.sh`** — live post-deploy harness that proves **task 8 & 9**:
  health + readiness, full auth round-trip (`signup → login → /me → 401-without-cookie`),
  and **tenant isolation** (two accounts; account A must NOT see account B's property).
- Pre-existing artifacts confirmed intact: Dockerfiles (api, ai), `railway.json` (×2),
  `vercel.json`, `.dockerignore`, `migrate:deploy`, and the CI job that already runs
  migrations + the RLS test against a real Postgres on every push.

## How to complete the deploy (≈ 20 minutes)

1. **Provision** (Railway): add **PostgreSQL** (run `CREATE EXTENSION IF NOT EXISTS vector;`)
   and **Redis** plugins. Recommended: create a **non-owner** DB role for the app so RLS
   `FORCE` fully binds; migrate as the owner.
2. **Create services**: API service → Dockerfile `services/api/Dockerfile`; AI service →
   `services/ai/Dockerfile`; Vercel project → Root Directory `apps/web`.
3. **Set variables** from `.env.production.example` in each service.
4. **Set GitHub repo secrets/vars** (listed at the top of `deploy.yml`): `RAILWAY_TOKEN`,
   `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`, and vars `RAILWAY_API_SERVICE`,
   `RAILWAY_AI_SERVICE`, `DEPLOY_API_URL`, `DEPLOY_WEB_URL`, `DEPLOY_AI_URL`.
5. **Run** the **Deploy** workflow (Actions tab → Run workflow), or push a `v*` tag.
   Migrations apply automatically; the verify job runs auth + RLS checks and goes red on
   any failure (including a tenant leak).
6. **Manual fallback** (no CI): `railway up --service <api>` / `<ai>`, `vercel --prod`, then
   `API_URL=https://… scripts/verify-deployment.sh`.

## Verification coverage (what "green" means)

`scripts/verify-deployment.sh` against the live API asserts:
- `GET /v1/health` → 200 and `GET /v1/health/ready` → 200 (DB reachable);
- `/v1/auth/me` returns the signed-up user with the session cookie, and **401 without it**;
- a second tenant's property is **not visible** to the first tenant (RLS enforced end-to-end).

Exit code 0 = deployment healthy and isolated; non-zero = do not onboard customers yet.

## Honest risk callouts (carried from the Phase 2 audit)

- RLS `FORCE` only fully binds if the API connects as a **non-owner** role — verify in step 1.
- Cross-origin auth cookies (Vercel ↔ Railway) need a **shared parent domain** + `COOKIE_DOMAIN`.
- Migrations have run in CI but not yet on **managed** Postgres — do a staging migrate first.

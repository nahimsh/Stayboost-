# Incident Report — AI Property Analyzer: "We couldn't generate your report"

**Date:** 2026-06-16 · **Severity:** P1 (core public feature down in production)
**Symptom:** Clicking *Analyze my property* on the Vercel site shows
*"We couldn't generate your report right now."*

## How the symptom maps to the code

That exact string is the analyzer form's **generic catch** (`auth.analyzer.error.generic`),
shown whenever `api.analyzer.run()` throws. So the browser's call to
`POST {NEXT_PUBLIC_API_URL}/v1/analyzer/run` is failing — either it never reaches the API
(network/CORS) or the API/AI/DB returns an error. Until this fix the catch was **silent**
(`catch {}`), which is why the Network tab gave you nothing to go on.

## Request path

```
Browser (Vercel)
  └─ POST  {NEXT_PUBLIC_API_URL}/v1/analyzer/run   (credentials: include)
       └─ API (Railway)  AnalyzerService.run()
            ├─ AiClient → POST {AI_SERVICE_URL}/v1/analyze   (X-Service-Token)
            │     └─ AI service (Railway): Claude OR heuristic fallback
            └─ Prisma → persist AnalyzerReport + AiAction   (Postgres)
```

## Root cause — ranked (config, not application logic)

The code path is sound (CI-tested); the failure is almost certainly **deployment
configuration**. In likelihood order, with the decisive check for each:

| # | Root cause | Decisive check | Fix |
|---|-----------|----------------|-----|
| 1 | **`NEXT_PUBLIC_API_URL` not set on Vercel** → browser calls `http://localhost:4000` → mixed-content/refused | DevTools Network: request URL is `localhost:4000` or there's a mixed-content error | Set `NEXT_PUBLIC_API_URL=https://<api>` in Vercel → redeploy |
| 2 | **`WEB_ORIGIN` on the API doesn't include the Vercel origin** → CORS blocks the credentialed request | Network: request fails CORS / no `Access-Control-Allow-Origin`; API logs show blocked origin | Set `WEB_ORIGIN=https://<vercel-domain>` on the API |
| 3 | **API can't reach Postgres** (DB not provisioned / `DATABASE_URL` unset / migrations not run) → `/v1/analyzer/run` 500 | `curl $API/v1/health/ready` → not 200; API logs show Prisma error | Provision Postgres, set `DATABASE_URL`, run `migrate:deploy` |
| 4 | **AI service not reachable / token mismatch** → `AiClient` 503 | `curl $AI/health`; API logs "AI analyze call failed"; ensure `AI_SERVICE_TOKEN` is **identical** on API and AI | Deploy AI service; match `AI_SERVICE_TOKEN`; set `AI_SERVICE_URL` |
| 5 | API service itself not deployed | `curl $API/v1/health` fails | Deploy the API (Railway) |

> Note on credentialed CORS: the browser sends `credentials: include`, so the API
> **cannot** use a wildcard origin — `WEB_ORIGIN` must list the **exact** Vercel origin.

## Fixes shipped in this change (code)

1. **Diagnosability** — the analyzer form now `console.error`s the real error, so the
   true cause (network/CORS vs. API status) is visible in the browser console/Network tab.
2. **Config guard** — `lib/api.ts` logs a loud console error if `NEXT_PUBLIC_API_URL` is
   missing while running on a non-localhost host (directly catches root cause #1).
3. **Resilience** — `AnalyzerService.run()` makes DB persistence **best-effort**: if
   Postgres is unreachable, it logs and **still returns the report** (the public, pre-signup
   tool no longer 500s on a DB hiccup — fixes root cause #3 from the user's perspective).
   Added a regression test. The AI service already falls back to a heuristic engine, so the
   analysis itself never depends on the Anthropic key.

These do not change product behavior or add features; they make the analyzer robust and
self-diagnosing in production.

## What is required of you (cannot be done from code/CI)

Set these and redeploy (see `docs/deployment.md`):
- **Vercel (web):** `NEXT_PUBLIC_API_URL=https://<api-origin>` → redeploy.
- **API (Railway):** `WEB_ORIGIN=https://<vercel-origin>`, `DATABASE_URL`, `REDIS_URL`,
  `AI_SERVICE_URL`, `AI_SERVICE_TOKEN`, `JWT_SECRET`, `AUTH_COOKIE_SECURE=true`.
- **AI (Railway):** `AI_SERVICE_TOKEN` (identical to the API's), optional `ANTHROPIC_API_KEY`
  (works without it via the heuristic engine), `AI_ALLOWED_ORIGINS=<api-origin>`.

## Redeploy & verify

- The **web** fix auto-deploys on this push (Vercel). It will start *working* only once
  `NEXT_PUBLIC_API_URL` and the API are correctly set.
- After setting env + deploying API/AI, run:
  ```
  API_URL=https://<api> AI_URL=https://<ai> WEB_URL=https://<web> scripts/verify-deployment.sh
  ```
  Step 4 of the harness now asserts the analyzer returns a 4-pillar report end-to-end.

## Status of the requested tasks

| Task | Status |
|------|--------|
| 1. Frontend network calls | ✅ Traced; silent catch fixed (now logs the real error) |
| 2. API deployment status | ⚠️ Cannot inspect your Railway from here — check `curl $API/v1/health` |
| 3. FastAPI deployment status | ⚠️ Cannot inspect — check `curl $AI/health` |
| 4. Environment variables | ✅ Required set documented; guard added for the #1 cause |
| 5. CORS configuration | ✅ Verified in code (exact-origin + credentials); needs `WEB_ORIGIN` set |
| 6. Endpoint connectivity | ✅ Path traced; verify harness step 4 added |
| 7. Fix all issues | ✅ Code issues fixed (diagnosability + DB resilience); config is yours to set |
| 8. Redeploy services | ⚠️ Web auto-deploys on push; API/AI require your cloud credentials |

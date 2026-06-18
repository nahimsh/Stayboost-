# StayBoost Deployment Runbook (Phase 2)

This runbook covers the operational steps that require your cloud accounts. The
repo ships everything code‑side: Dockerfiles, `vercel.json`, `railway.json`,
migration tooling, and a CI pipeline that runs migrations + the RLS isolation
test against a real Postgres.

> Topology: **Web → Vercel**, **API → Railway**, **AI service → Railway**,
> **Postgres (pgvector) + Redis → Railway** (or any managed provider).

## 1. Provision PostgreSQL + pgvector
- Railway: add a **PostgreSQL** plugin. Enable pgvector: connect and run
  `CREATE EXTENSION IF NOT EXISTS vector;` (migration `0001_init` also does this).
- Copy the connection string → `DATABASE_URL`
  (`postgresql://USER:PASS@HOST:PORT/DB?schema=public&sslmode=require`).
- Recommended: a least‑privilege app role (not the DB owner) so RLS `FORCE`
  fully applies. Grant it CRUD on the schema; run migrations as the owner.

## 2. Provision Redis
- Railway: add a **Redis** plugin. Copy URL → `REDIS_URL`. Required in
  production (shared rate‑limit store; the API fails fast without it).

## 3. Dockerfiles
- `services/api/Dockerfile` (build context = **repo root**) and
  `services/ai/Dockerfile`. `.dockerignore` is provided. No action needed beyond
  pointing each Railway service at the right Dockerfile path.

## 4. Deploy
**API (Railway):** new service from this repo → Root Directory = repo root →
Dockerfile path `services/api/Dockerfile` (or use `services/api/railway.json`).
Set env: `DATABASE_URL`, `REDIS_URL`, `JWT_SECRET` (`openssl rand -base64 48`),
`AUTH_COOKIE_SECURE=true`, `APP_URL`, `WEB_ORIGIN`, `COOKIE_DOMAIN`,
`AI_SERVICE_URL`, `AI_SERVICE_TOKEN`, `RESEND_API_KEY`, `EMAIL_FROM`,
`CONTACT_INBOX`, `GOOGLE_CLIENT_ID/SECRET/REDIRECT_URI`, `NODE_ENV=production`.

**AI service (Railway):** Dockerfile `services/ai/Dockerfile`. Env:
`ANTHROPIC_API_KEY`, `ANTHROPIC_MODEL=claude-opus-4-8`, `AI_EFFORT=high`,
`AI_SERVICE_TOKEN` (same value as the API), `AI_ALLOWED_ORIGINS=<api origin>`.

**Web (Vercel):** import the repo → **Root Directory = `apps/web`** (Vercel
auto‑detects Next.js + pnpm workspace). Env: `NEXT_PUBLIC_SITE_URL`,
`NEXT_PUBLIC_API_URL=<api origin>`. Put web + API on a shared parent domain and
set `COOKIE_DOMAIN` so auth cookies are sent cross‑subdomain.

## 5. Run migrations
- Automatic: the API image runs `prisma migrate deploy` on release (also a
  Railway `preDeployCommand`).
- Manual: `DATABASE_URL=... pnpm --filter @stayboost/db migrate:deploy`.

## 6. Verify tenant isolation (RLS)
- CI already does this on every push (Postgres service + migrate + the
  `rls.integration.spec.ts` cross‑tenant test).
- Against staging: `DATABASE_URL=<staging> pnpm --filter @stayboost/api test`
  runs the same isolation test (otherwise it self‑skips).

## 7–9. Reservation data flow (shipped)
- A host connects a channel: `POST /v1/channels` with the listing's **iCal
  export URL** (Airbnb: Listing → Availability → Export Calendar; Booking.com:
  via the extranet/channel manager iCal).
- Trigger a sync: `POST /v1/channels/:id/sync` (idempotent upsert).
- The **dashboard** then shows live check‑ins, check‑outs, and occupancy from
  real reservations; revenue/health remain estimated until those modules land.

### Post‑deploy smoke test
```
curl $API/v1/health/ready          # DB reachable
# signup -> onboarding -> POST /v1/channels -> POST /v1/channels/:id/sync
curl $API/v1/dashboard             # check-ins/outs/occupancy now live
```

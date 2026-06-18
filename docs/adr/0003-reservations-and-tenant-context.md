# ADR 0003 — Reservations, channel connectors & RLS tenant context

- **Status:** Accepted · **Date:** 2026-06-16 (Phase 2 kickoff)

## Context
Phase 2 must get real reservation data flowing into the dashboard and prove
multi-tenant isolation against a live database.

## Decisions

1. **First channel connector is iCal-based.** Airbnb and Booking.com do not
   expose open reservation REST APIs to individual hosts; both provide **iCal
   export URLs**, which is the universally available, production-real sync
   mechanism. Hosts connect a feed (`POST /v1/channels`) and we ingest VEVENTs
   into canonical `Reservation` rows. PMS/partner-API connectors implement the
   same canonical output later.

2. **Connectors start inside the API, behind a clean seam.** The blueprint
   places connectors in `services/integrations` + `services/workers`. For the
   MVP they live in `services/api/src/{integrations,reservations}` with the
   parsing isolated in `integrations/ical.ts` and fetching behind `IcalConnector`.
   This avoids standing up a 4th service before sync volume warrants it; the
   normalizer + connector interface extract cleanly to `services/integrations`
   and a scheduled worker when needed. **No CRM/Booking Engine/Housekeeping/
   Mobile work begins until reservation data flows.**

3. **RLS is enforced via a request-scoped tenant context.** `reservations` and
   `channel_connections` use `ENABLE` + `FORCE ROW LEVEL SECURITY` with a policy
   keyed on `current_setting('app.org_id')`. The API runs all tenant-scoped work
   through `PrismaService.withTenant(orgId, fn)`, which opens a transaction and
   sets `app.org_id` via parameterized `set_config(...)`. In production the API
   should connect with a non-owner role so `FORCE` applies fully.
   `0003`'s over-applied `FORCE` on `memberships` was relaxed earlier because
   auth reads a user's orgs *before* a tenant context exists.

4. **Dashboard is hybrid during Phase 2.** Live reservations drive check-ins,
   check-outs, and occupancy; revenue/health/leads/notifications remain the
   sample provider (`demo`) until pricing/reviews/ops modules exist.

## Consequences
- CI provisions Postgres+pgvector, applies migrations, and runs the cross-tenant
  RLS test on every push — the P0 isolation guarantee is continuously verified.
- iCal has no price data, so revenue stays estimated until a revenue source is
  connected — tracked as the next data integration.

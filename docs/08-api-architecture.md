# 08 — API Architecture

## 1. Strategy

- **REST as the primary contract** (resource-oriented, versioned, predictable) for
  internal apps and the public developer API.
- **GraphQL for the dashboard's read-heavy, nested views** (single round-trip for
  command-center widgets) — optional, additive, not a replacement.
- **Webhooks out** for partners/customers to subscribe to events.
- **Typed end-to-end:** OpenAPI/GraphQL schema → generated client in
  `packages/api-client` consumed by all frontends.
- **API-first:** every capability the UI uses is a documented API; the public API
  is a curated subset of the same surface.

## 2. Layering

```
Client (web/mobile/guest/partner)
   │  HTTPS
   ▼
API Gateway  ── auth · rate limit · tenant resolution · request validation · routing
   │
   ▼
NestJS API (services/api)  ── domain modules expose controllers/resolvers
   │            │
   │            └── calls AI service (services/ai) via internal contracts
   ▼
Domain services → DB (RLS) + Event bus + Queues
```

## 3. Authentication & authorization

- **End users:** OAuth2/OIDC + session (SSO with Google/Microsoft; email/password
  fallback). JWT access tokens (short-lived) + refresh tokens.
- **Public API:** scoped **API keys** per organization + OAuth for partner apps.
- **Service-to-service:** signed internal tokens / mTLS.
- **Authorization:** RBAC enforced at the gateway + per-resource checks; every
  request carries `org_id` context; DB enforces **row-level security** as the
  last line of defense.
- **Scopes:** fine-grained (`reservations:read`, `pricing:write`,
  `messages:send`, …) for both UI roles and API keys.

## 4. REST conventions

```
Base:    https://api.stayboost.com/v1
Auth:    Authorization: Bearer <token>  |  X-Api-Key: <key>
Tenant:  derived from token/key (never trust client-supplied org_id)
Format:  JSON; money as { amount_minor, currency }; timestamps ISO-8601 UTC
Paging:  cursor-based (?cursor=&limit=)
Filtering: ?property_id=&status=&from=&to=
Errors:  RFC-7807 problem+json { type, title, status, detail, errors[] }
Idempotency: Idempotency-Key header on POST (esp. messages, price pushes, payments)
Versioning: URI version (/v1) + deprecation headers
```

### Representative endpoints

```
# Properties & inventory
GET   /v1/properties
POST  /v1/properties
GET   /v1/properties/{id}/units
PATCH /v1/units/{id}

# Reservations & calendar
GET   /v1/reservations?from=&to=&channel=&status=
GET   /v1/calendar?property_id=&from=&to=
POST  /v1/reservations            (direct/manual)

# Revenue & pricing
GET   /v1/pricing/recommendations?property_id=&from=&to=
POST  /v1/pricing/recommendations/{id}:approve
POST  /v1/pricing/recommendations/{id}:reject
POST  /v1/pricing/rules            (guardrails, autonomy level)
GET   /v1/demand/forecast?property_id=&from=&to=

# Channels & sync
GET   /v1/channels
POST  /v1/channels/connect         (start OAuth/connect flow)
POST  /v1/channels/{id}:sync

# Inbox & messaging
GET   /v1/conversations?status=&channel=
GET   /v1/conversations/{id}/messages
POST  /v1/conversations/{id}/messages          (send; supports ai_draft=true)
POST  /v1/conversations/{id}:assign

# Guests (CRM)
GET   /v1/guests?segment=&search=
GET   /v1/guests/{id}
GET   /v1/guests/{id}/reservations

# Reviews
GET   /v1/reviews?property_id=&sentiment=
POST  /v1/reviews/{id}:respond                 (ai_draft optional)

# Operations
GET   /v1/tasks?status=&assignee=
POST  /v1/tasks
PATCH /v1/tasks/{id}

# Marketing
POST  /v1/campaigns
POST  /v1/offers
GET   /v1/automations
POST  /v1/automations

# AI (capability endpoints, server-orchestrated)
POST  /v1/ai/ask                  (Ask StayBoost; NL query → answer/action)
POST  /v1/ai/draft-reply          (conversation_id → suggested reply)
POST  /v1/ai/price-rationale      (recommendation_id → explanation)
GET   /v1/ai/actions?status=      (audit/explainability feed)

# Analytics
GET   /v1/analytics/overview?property_id=&period=
GET   /v1/reports/{type}

# Billing (StayBoost SaaS)
GET   /v1/billing/subscription
POST  /v1/billing/checkout
GET   /v1/billing/usage
```

## 5. GraphQL (dashboard reads)

A single `/graphql` endpoint exposing the command-center graph so a screen fetches
KPIs + pending actions + inbox snapshot + reputation trend in one request.
Mutations stay primarily on REST for clarity and idempotency; GraphQL focuses on
composition of reads.

## 6. Webhooks (outbound) & events

- Customers/partners subscribe to events: `reservation.created`,
  `reservation.cancelled`, `review.received`, `message.inbound`,
  `price.recommendation.ready`, `task.created`, `ai.action.executed`.
- Delivery: signed payloads (HMAC), retries with backoff, dead-letter, and a
  delivery log UI. Mirrors the internal event bus (see [01](01-product-architecture.md)).

## 7. Integration (inbound) APIs

The **connector framework** ([01](01-product-architecture.md), [04](04-folder-structure.md))
both *consumes* third-party APIs/webhooks (PMS/CM/OTA/payments/messaging) and
*normalizes* them into canonical resources. Inbound provider webhooks hit
dedicated, verified endpoints (`/v1/integrations/{provider}/webhook`) and are
translated into internal events.

## 8. Reliability, limits & security

- **Rate limiting** per token/key (tiered by plan) at the gateway; burst + sustained.
- **Idempotency** on all mutating, side-effecting calls.
- **Input validation** at the edge (schema) + domain invariants in services.
- **Pagination/quotas** to protect the DB; heavy reads served from read replicas/warehouse.
- **Observability:** request tracing, per-endpoint latency/error SLOs, audit log
  of write operations.
- **Security:** TLS everywhere, secrets in a vault, least-privilege scopes,
  OWASP-aligned hardening, CORS locked to known origins, no tenant data crosses
  the RLS boundary.

## 9. Developer experience

- Public docs portal with OpenAPI reference + GraphQL playground.
- Generated SDKs (TS first) from the schema.
- Sandbox environment + test API keys + sample data.
- Clear deprecation policy and changelog for `/v1` → `/v2` transitions.

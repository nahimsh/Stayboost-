# 03 — Database Schema

## 1. Design principles

- **Multi-tenant, single Postgres** with `org_id` on every tenant-owned table and
  **Row-Level Security (RLS)** enforcing isolation.
- **Canonical model:** external systems normalize into these tables; the source is
  recorded via `source_system` + `external_id` fields.
- **Soft deletes** (`deleted_at`) and **audit columns** (`created_at`,
  `updated_at`, `created_by`) everywhere.
- **UUID primary keys** (v7 for sortability).
- **Money** stored as integer minor units + ISO currency code (never floats).
- **Timestamps** in UTC; properties carry a timezone for local rendering.
- **Vector columns** (pgvector) on entities used for RAG/semantic search.

## 2. Entity-relationship overview

```
organizations 1──* users (via memberships + roles)
organizations 1──* properties 1──* units
properties    1──* rate_plans 1──* pricing_rules
properties    1──* reservations *──1 guests
properties    1──* channel_connections 1──* sync_jobs
properties    1──* conversations 1──* messages
properties    1──* reviews
properties    1──* tasks
properties    1──* offers / upsells / campaigns
properties    1──* automations
organizations 1──1 subscriptions 1──* usage_records / invoices
* (all)       ──* ai_actions (audit) / events (event log)
```

## 3. Core tables (representative DDL sketch)

> Illustrative — not final migrations. Types/indexes refined in implementation.

### Identity & tenancy

```sql
organizations (
  id UUID PK, name TEXT, slug TEXT UNIQUE, type TEXT,            -- host | hotel | pm_company
  country TEXT, default_currency TEXT, default_locale TEXT,
  status TEXT, created_at, updated_at, deleted_at
)

users (
  id UUID PK, email CITEXT UNIQUE, name TEXT, phone TEXT,
  password_hash TEXT NULL, auth_provider TEXT, locale TEXT,
  last_login_at, created_at, updated_at
)

memberships (                                   -- user ↔ org with role
  id UUID PK, org_id UUID FK, user_id UUID FK,
  role TEXT,                                    -- owner | admin | manager | staff | viewer
  scope JSONB,                                  -- optional property/unit restrictions
  invited_by UUID, status TEXT, created_at
)

property_access (                               -- fine-grained per-property access
  id UUID PK, membership_id UUID FK, property_id UUID FK, role TEXT
)
```

### Properties & inventory

```sql
properties (
  id UUID PK, org_id UUID FK, name TEXT, type TEXT,             -- homestay|villa|resort|hotel
  address JSONB, lat NUMERIC, lng NUMERIC, timezone TEXT,
  currency TEXT, locale TEXT, star_rating SMALLINT,
  amenities JSONB, policies JSONB, content JSONB,               -- descriptions, photos refs
  embedding VECTOR(1536),                                       -- for RAG/match
  status TEXT, created_at, updated_at, deleted_at
)

units (                                                          -- room/unit/room-type
  id UUID PK, org_id UUID FK, property_id UUID FK,
  name TEXT, room_type TEXT, max_occupancy SMALLINT,
  base_price_minor BIGINT, currency TEXT, quantity INT,         -- # of identical units
  attributes JSONB, status TEXT, created_at, updated_at
)
```

### Revenue & pricing

```sql
rate_plans (
  id UUID PK, org_id UUID FK, property_id UUID FK, unit_id UUID FK,
  name TEXT, type TEXT,                                          -- standard|nonref|package
  cancellation_policy JSONB, restrictions JSONB, created_at
)

pricing_rules (                                                 -- guardrails + strategy
  id UUID PK, org_id UUID FK, property_id UUID FK, unit_id UUID NULL,
  min_price_minor BIGINT, max_price_minor BIGINT,
  strategy JSONB,                                               -- aggressiveness, los rules
  autonomy_level TEXT,                                          -- suggest | approve | auto
  active BOOLEAN, created_at, updated_at
)

price_recommendations (                                         -- AI output, time-series
  id UUID PK, org_id UUID FK, property_id UUID FK, unit_id UUID FK,
  stay_date DATE, recommended_price_minor BIGINT, currency TEXT,
  current_price_minor BIGINT, rationale TEXT, confidence NUMERIC,
  status TEXT,                                                  -- pending|approved|rejected|applied
  model_version TEXT, created_at, decided_by UUID, decided_at
)

demand_signals (                                                -- features for the model
  id UUID PK, org_id UUID FK, property_id UUID FK, stay_date DATE,
  occupancy_pct NUMERIC, pickup_pace NUMERIC, comp_set_price_minor BIGINT,
  events JSONB, weather JSONB, source TEXT, captured_at
)
```

### Reservations & guests

```sql
guests (
  id UUID PK, org_id UUID FK, name TEXT, email CITEXT, phone TEXT,
  locale TEXT, country TEXT, attributes JSONB,                  -- prefs, trip purpose
  lifetime_value_minor BIGINT, segments TEXT[],
  consent JSONB,                                                -- marketing/messaging consent
  embedding VECTOR(1536), created_at, updated_at
)                                                               -- dedup across stays

reservations (
  id UUID PK, org_id UUID FK, property_id UUID FK, unit_id UUID FK,
  guest_id UUID FK, source_system TEXT, external_id TEXT,       -- OTA/PMS ref
  channel TEXT,                                                 -- direct|booking.com|airbnb...
  status TEXT,                                                  -- inquiry|confirmed|cancelled|stayed|no_show
  check_in DATE, check_out DATE, nights INT, adults INT, children INT,
  total_minor BIGINT, currency TEXT, commission_minor BIGINT,
  payment_status TEXT, notes TEXT, raw JSONB,
  created_at, updated_at,
  UNIQUE(org_id, source_system, external_id)
)
```

### Channels & sync

```sql
channel_connections (
  id UUID PK, org_id UUID FK, property_id UUID FK,
  provider TEXT, kind TEXT,                                     -- pms|channel_mgr|ota|payment|messaging
  credentials_ref TEXT,                                         -- pointer to secrets vault
  status TEXT, last_synced_at, settings JSONB, created_at
)

sync_jobs (
  id UUID PK, org_id UUID FK, connection_id UUID FK, type TEXT,
  status TEXT, started_at, finished_at, stats JSONB, error TEXT
)
```

### Messaging, concierge, reviews

```sql
conversations (
  id UUID PK, org_id UUID FK, property_id UUID FK, guest_id UUID NULL,
  reservation_id UUID NULL, channel TEXT,                       -- whatsapp|email|sms|ota|web
  status TEXT,                                                  -- open|pending|closed|ai_handled
  assignee_id UUID NULL, sentiment TEXT, summary TEXT,
  last_message_at, created_at
)

messages (
  id UUID PK, org_id UUID FK, conversation_id UUID FK,
  direction TEXT,                                               -- inbound|outbound
  sender TEXT,                                                  -- guest|staff|ai
  body TEXT, attachments JSONB, lang TEXT, translated_body TEXT,
  ai_generated BOOLEAN, ai_action_id UUID NULL, created_at
)

reviews (
  id UUID PK, org_id UUID FK, property_id UUID FK, reservation_id UUID NULL,
  source TEXT, rating NUMERIC, title TEXT, body TEXT, lang TEXT,
  sentiment TEXT, topics TEXT[], response_text TEXT,
  response_status TEXT, responded_at, created_at
)
```

### Operations

```sql
tasks (
  id UUID PK, org_id UUID FK, property_id UUID FK, unit_id UUID NULL,
  reservation_id UUID NULL, type TEXT,                          -- cleaning|maintenance|guest_request
  title TEXT, description TEXT, priority TEXT, status TEXT,
  assignee_id UUID NULL, due_at, created_by_ai BOOLEAN, created_at, updated_at
)
```

### Marketing, offers, automations

```sql
offers (
  id UUID PK, org_id UUID FK, property_id UUID FK, type TEXT,   -- upsell|package|addon
  name TEXT, description TEXT, price_minor BIGINT, currency TEXT,
  rules JSONB, active BOOLEAN, created_at
)

campaigns (
  id UUID PK, org_id UUID FK, property_id UUID FK, goal TEXT,   -- winback|abandoned|promo
  channel TEXT, audience JSONB, content JSONB, schedule JSONB,
  status TEXT, metrics JSONB, created_at
)

automations (                                                   -- no-code "when X do Y"
  id UUID PK, org_id UUID FK, property_id UUID NULL,
  name TEXT, trigger JSONB, conditions JSONB, actions JSONB,
  enabled BOOLEAN, created_at, updated_at
)
```

### AI, audit, events, knowledge

```sql
ai_actions (                                                    -- explainability + audit
  id UUID PK, org_id UUID FK, property_id UUID NULL, agent TEXT,
  action_type TEXT, input JSONB, output JSONB, rationale TEXT,
  model TEXT, model_version TEXT, tokens INT, cost_minor BIGINT,
  status TEXT,                                                  -- proposed|approved|executed|rejected|failed
  approved_by UUID NULL, executed_at, created_at
)

events (                                                        -- domain event log
  id UUID PK, org_id UUID FK, type TEXT, payload JSONB,
  source TEXT, correlation_id UUID, created_at
)

knowledge_chunks (                                              -- RAG store
  id UUID PK, org_id UUID FK, property_id UUID NULL,
  source TEXT, doc_id UUID, chunk_text TEXT, metadata JSONB,
  embedding VECTOR(1536), created_at
)
```

### Billing (StayBoost's own SaaS)

```sql
subscriptions (
  id UUID PK, org_id UUID FK, plan TEXT, status TEXT,           -- trialing|active|past_due|canceled
  billing_provider TEXT, external_sub_id TEXT,
  current_period_start, current_period_end, seats INT,
  properties_limit INT, trial_end, created_at
)

usage_records (                                                 -- metered usage
  id UUID PK, org_id UUID FK, metric TEXT,                      -- ai_messages|properties|api_calls
  quantity BIGINT, period DATE, created_at
)

invoices (
  id UUID PK, org_id UUID FK, amount_minor BIGINT, currency TEXT,
  status TEXT, external_invoice_id TEXT, issued_at, paid_at, line_items JSONB
)
```

## 4. Indexing & performance notes

- Composite indexes on `(org_id, property_id, <date/status>)` for hot queries.
- Partition large time-series tables (`reservations`, `messages`,
  `price_recommendations`, `demand_signals`, `events`) by month/range.
- pgvector HNSW indexes on `embedding` columns.
- Read replicas for analytics; CDC stream to the warehouse for heavy reporting.

## 5. Data governance

- PII (guest email/phone) tokenized/encrypted; access via the Guest CRM module
  with consent checks.
- GDPR/CCPA: per-guest export & erase routines that cascade across tables.
- Retention policies per data class (messages, logs, AI actions) configurable per
  plan/region.

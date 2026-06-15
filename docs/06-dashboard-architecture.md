# 06 — Dashboard Architecture

## 1. Design philosophy

The dashboard is a **Growth Command Center**, not a data dump. It answers three
questions on every screen: *What's happening? What needs me? What should I do
next?* The AI is a first-class citizen of the UI — surfacing briefings,
recommendations, and one-click actions, not buried in a chatbot corner.

Principles:
- **Action-oriented:** every insight pairs with an action button.
- **Money-first:** the top of the home screen always shows revenue impact.
- **Progressive disclosure:** simple by default (homestay host), powerful on
  demand (revenue manager / PM).
- **Role-adaptive:** the same app reshapes per role and per property scope.
- **AI-native:** an omnipresent "Ask StayBoost" assistant + inline AI actions.

## 2. Information architecture (navigation)

```
┌── Top bar: Org/Property switcher · search · Ask StayBoost · notifications · profile
│
├── HOME / Command Center        ← AI daily briefing + money metrics + pending actions
├── REVENUE
│     ├─ Pricing & recommendations
│     ├─ Demand & forecast
│     ├─ Comp set / market intel
│     └─ Channel mix & parity
├── BOOKINGS
│     ├─ Calendar (multi-unit)
│     ├─ Reservations list
│     └─ Direct booking funnel & widget
├── INBOX                         ← unified omnichannel + AI replies
├── GUESTS (CRM)                  ← profiles, segments, LTV, history
├── CONCIERGE                     ← guest AI config, knowledge base, transcripts
├── REVIEWS                       ← reputation, AI responses, insights
├── OPERATIONS                    ← tasks, housekeeping board, staff
├── MARKETING                     ← campaigns, upsells, offers, automations
├── ANALYTICS                     ← reports, benchmarks, exports
├── AUTOMATIONS                   ← no-code builder + run history
└── SETTINGS                      ← properties, integrations, team/roles, billing
```

## 3. The Command Center (home) — widget composition

```
┌─────────────────────────────────────────────────────────────┐
│ 🤖 AI DAILY BRIEFING (narrative, generated)                    │
│  "Bookings up 12% wk/wk. 3 prices need approval. 2 reviews     │
│   unanswered. 1 guest flagged unhappy. Est. +$340 if you act." │
├──────────────┬──────────────┬──────────────┬─────────────────┤
│ Revenue MTD  │ Occupancy    │ ADR / RevPAR │ Direct vs OTA %  │  ← money row
├──────────────┴──────────────┴──────────────┴─────────────────┤
│ ⚡ PENDING AI ACTIONS (approve queue)                          │
│   • Price changes (5)  [Review] [Approve all]                  │
│   • Review replies (2) [Review]                                │
│   • Suggested upsell campaign  [Launch]                        │
├───────────────────────────────┬───────────────────────────────┤
│ 📈 Pace / pickup chart         │ 💬 Inbox snapshot (open/unread)│
├───────────────────────────────┼───────────────────────────────┤
│ ⭐ Reputation trend            │ 🧹 Ops: today's tasks           │
└───────────────────────────────┴───────────────────────────────┘
```

Widgets are **modular, permission-aware, and configurable** (drag to reorder;
hide what's irrelevant to the segment/role).

## 4. Role-based views (RBAC → UI)

| Role | Default landing | Sees | Can do |
|---|---|---|---|
| **Owner** | Command Center | Everything in their org/property | Full control, billing |
| **Admin** | Command Center | All except billing changes | Configure, approve |
| **Manager** | Command Center (scoped) | Assigned properties | Approve prices/replies, manage ops |
| **Staff** | Operations / Inbox | Assigned tasks/conversations | Execute tasks, reply (with limits) |
| **Viewer/Owner-client** | Analytics (read-only) | Their property's reports | View only |
| **Platform admin** | Admin console | Cross-tenant ops (internal) | Support, impersonate (audited) |

UI adapts by **role × property scope**. A PM managing 50 properties gets a
**portfolio overview** with cross-property rollups and bulk actions; a single
homestay host gets a simplified single-property view.

## 5. Property / portfolio switching

- Global **Org → Property** switcher in the top bar.
- "All properties" portfolio mode for multi-property orgs (aggregated KPIs,
  alerts, bulk approvals, per-property drill-down).
- Scope flows everywhere: filters, AI context, and permissions all respect the
  active scope.

## 6. The omnipresent AI assistant ("Ask StayBoost")

- Available on every screen via a command bar / side panel.
- Natural-language queries: *"How did last weekend perform vs last year?"*,
  *"Draft a win-back offer for guests who stayed 6+ months ago."*,
  *"Why did you raise the price for July 12?"*
- Can **explain** any AI recommendation (links to `ai_actions` rationale) and
  **take actions** (with the same autonomy/approval rules as elsewhere).

## 7. Frontend technical architecture

- **Next.js (App Router) + TypeScript**, server components for data-heavy views.
- **Tailwind + shadcn/ui** design system from `packages/ui`.
- **Data:** typed client from `packages/api-client`; React Query/RSC for
  fetching; optimistic updates for approve actions.
- **Real-time:** WebSocket/SSE channel for inbox, pending-action queue,
  notifications, and live sync status.
- **Charts:** lightweight charting (e.g. visx/Recharts) fed by the analytics API.
- **i18n** from day one; RTL-ready.
- **Accessibility** (WCAG AA) and responsive down to mobile web; native mobile app
  in P2 shares the design system + API client.

## 8. Performance & UX guarantees

- Command Center loads above-the-fold KPIs in < 1s (cached/aggregated).
- Heavy analytics computed in the warehouse, served pre-aggregated.
- Pending-action approvals are optimistic and reversible.
- Skeleton states + background sync indicators so the app never feels "stuck"
  while integrations import.

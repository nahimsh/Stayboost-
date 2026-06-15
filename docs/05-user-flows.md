# 05 — User Flows

Flows are grouped by actor: **Operator** (host/manager/staff), **Guest**, and the
**AI** (which acts as a participant in most flows). Diagrams use simple arrows.

---

## A. Onboarding — "Time-to-value in hours"

**Goal:** from sign-up to first AI-generated value in under 24 hours.

```
Sign up (email/Google)
   → Create Organization (name, type: homestay/villa/resort/hotel, currency, locale)
   → Choose primary goal (more bookings / save time / better reviews)   ← personalizes setup
   → Connect a system:
        • Connect PMS/Channel Manager (OAuth)   OR
        • Connect OTA (Booking.com/Airbnb)       OR
        • Manual quick-add (1 property, prices)  ← zero-integration path
   → Import: properties, units, reservations, guests, reviews (background sync)
   → AI baseline scan runs:
        • occupancy & pace summary
        • "3 quick wins" (e.g. unanswered reviews, pricing gap, slow response time)
   → First value shown: dashboard with the "money metric" + 1 actionable AI insight
   → Guided first action: approve a price suggestion OR send an AI review reply
   → Invite team / set roles (optional)
```

**Design rule:** never block onboarding on a full integration. A manual path
always exists so the AI can demonstrate value immediately.

---

## B. Daily operator flow — "The morning command center"

```
Open dashboard (or daily digest email/WhatsApp)
   → AI Daily Briefing: "Here's what happened & what needs you today"
        • new bookings / cancellations / pace vs last week
        • pending AI actions awaiting approval (prices, replies, tasks)
        • flagged: unhappy guest, negative review, channel parity issue
   → Triage inbox (AI-drafted replies; approve/edit/send)
   → Approve/adjust pricing recommendations
   → Review & dispatch ops tasks (housekeeping/maintenance auto-generated)
   → Respond to reviews (AI-drafted)
   → Done in minutes, not hours.
```

---

## C. Smart Inbox + AI reply flow

```
Inbound message (WhatsApp/email/SMS/OTA)
   → Normalized into a Conversation, linked to Guest + Reservation
   → AI: detect language → translate → classify intent → score sentiment
   → AI drafts reply using RAG (property info, policies, reservation context)
   → Autonomy check:
        • AUTO mode  → send directly (logged), escalate if low confidence
        • APPROVE    → operator one-click approves/edits/sends
   → Outcome logged to ai_actions; sentiment + summary updated on conversation
   → If negative sentiment → trigger service-recovery automation + alert
```

---

## D. Dynamic pricing flow (graduated autonomy)

```
Nightly scheduler → demand model runs per property/unit/date
   → ingest signals (pace, occupancy, comp set, events, seasonality)
   → generate price_recommendations with rationale + confidence
   → apply pricing guardrails (min/max, LOS rules)
   → Autonomy level:
        SUGGEST → shown in dashboard for review
        APPROVE → batched for one-click approval
        AUTO    → pushed to channel manager/OTAs; logged + reversible
   → push applied prices outbound via integration layer
   → measure pickup/booking outcome → feeds back into model
```

---

## E. Booking lifecycle automation (guest journey)

```
Reservation created (any channel)
   → Booking confirmation (branded, multilingual)
   → Upsell offer (pre-arrival: upgrade, early check-in, breakfast, experiences)
   → Pre-arrival (check-in instructions, directions, ID/registration, payment if due)
   → Check-in day (access details, welcome, concierge intro)
   → In-stay (proactive check, service requests → ops tasks, sentiment watch)
   → Check-out (instructions, late-checkout upsell)
   → Post-stay (thank you + review solicitation at optimal moment)
   → Win-back (later: personalized offer to return)
Each step is an automation node; operator can edit journeys in the Automation Builder.
```

---

## F. Guest concierge flow (guest-facing AI)

```
Guest opens portal / replies on WhatsApp
   → AI Concierge greets in guest's language
   → Answers from RAG (house rules, wifi, amenities, local tips, policies)
   → Handles requests:
        • info  → answer directly
        • service (towels, late checkout) → create ops task + confirm
        • upsell/booking → present offer → take payment
        • complex/risky → escalate to human with full context
   → Everything logged; operator can view/take over any conversation
```

---

## G. Review & reputation flow

```
New review (Google/OTA/TripAdvisor) ingested
   → AI: sentiment + topic extraction (cleanliness, value, staff...)
   → AI drafts on-brand response (matches tone, addresses specifics, multilingual)
   → Autonomy: auto-respond (positive) / approve (negative or low confidence)
   → Negative review → create service-recovery task + alert owner
   → Aggregate: reputation trend, topic insights feed analytics + ops priorities
   → Solicitation: post-stay, AI times a review request to happy guests
```

---

## H. Property Manager / portfolio flow

```
PM logs in → Portfolio overview (all properties, all owners)
   → Cross-property KPIs, alerts, pending approvals (bulk approve)
   → Drill into a property → same operator views, scoped
   → Per-owner statements & yield reports (auto-generated)
   → Role assignment: owners get read-only/limited views of their property
```

---

## I. Automation builder flow (no-code)

```
Create automation → choose Trigger (event: booking.created, review.received,
   sentiment.negative, date.before_checkin)
   → add Conditions (channel = airbnb, property = X, rating < 4)
   → add Actions (send message, create task, apply offer, notify, call AI agent)
   → test → enable → monitored with run history + metrics
```

---

## Cross-cutting flow principles

1. **AI proposes, human disposes** — until trust is earned, then autonomy expands
   per domain via autonomy levels.
2. **Every flow has an escape hatch** to a human with full context.
3. **Every AI action is logged** and reversible where possible.
4. **Multilingual by default** in any guest-facing flow.
5. **Context is king** — guest + reservation + property + history attached to
   every decision.

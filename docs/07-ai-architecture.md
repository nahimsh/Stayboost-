# 07 — AI Architecture

> The AI layer is StayBoost's defensible core. It must be **reliable,
> explainable, cost-aware, and safe** — production AI, not a demo.

## 1. Guiding principles

1. **Agentic, not just generative.** The AI doesn't only write text — it reasons,
   calls tools, and takes actions inside the product.
2. **Graduated autonomy.** Every action has an autonomy level: `SUGGEST →
   APPROVE → AUTO`. Trust is earned per customer, per domain.
3. **Grounded, not hallucinated.** Decisions and replies are grounded in the
   tenant's real data via RAG and tools — never invented.
4. **Explainable & audited.** Every AI action records inputs, output, rationale,
   model, and cost in `ai_actions`.
5. **Model-agnostic via a router.** We optimize cost/latency/quality per task and
   are never locked to one provider.
6. **Eval-driven.** No prompt or model change ships without passing offline evals
   on hospitality task suites.

## 2. Primary models

- **Primary reasoning/agent model: Claude (Anthropic)** — used for agentic
  workflows, tool use, guest conversations, revenue rationale, and review
  responses, where reasoning quality and instruction-following matter most.
  Default to the latest, most capable Claude models (Opus for complex reasoning,
  Sonnet for high-volume balanced tasks, Haiku for cheap/low-latency classification).
- **Embeddings model** for RAG (text-embedding model → pgvector).
- **Optional specialist models** for narrow tasks (e.g. a classical
  time-series/ML model for demand forecasting, translation models for high-volume
  translation) — orchestrated alongside the LLM, not replaced by it.

> When building/extending AI features, consult `docs` and the Claude API
> reference for current model IDs, pricing, and capabilities rather than relying
> on memory.

## 3. The AI orchestration stack

```
┌──────────────────────────────────────────────────────────────┐
│  DOMAIN SERVICES request AI capabilities (typed contracts)     │
└───────────────────────────┬──────────────────────────────────┘
                            ▼
┌──────────────────────────────────────────────────────────────┐
│  AGENT RUNTIME (services/ai)                                   │
│   • Planner/Orchestrator  • Tool registry  • Memory            │
├───────────────┬───────────────┬───────────────┬──────────────┤
│ MODEL ROUTER  │  RAG ENGINE    │  GUARDRAILS    │  EVALS/TELEMETRY│
│ cost/latency/ │  retrieve from │ policy, schema │ offline+online │
│ quality pick  │  pgvector + db │ validation,    │ scoring, drift │
│               │                │ PII, safety    │               │
└───────────────┴───────────────┴───────────────┴──────────────┘
            │
            ▼  tool calls
┌──────────────────────────────────────────────────────────────┐
│  TOOLS (read/act on the product)                               │
│  get_reservations · get_demand_signals · get_comp_set ·        │
│  propose_price · get_guest · get_property_knowledge ·          │
│  send_message · create_task · create_offer · apply_price ·     │
│  schedule_campaign · respond_to_review · escalate_to_human     │
└──────────────────────────────────────────────────────────────┘
```

## 4. The specialized agents

Each agent is a focused system-prompted + tool-equipped role. They share the
runtime, router, RAG, and guardrails.

| Agent | Job | Key tools | Autonomy default |
|---|---|---|---|
| **Revenue / Pricing Advisor** | Analyze demand, recommend prices, explain why | demand signals, comp set, propose/apply price | SUGGEST→APPROVE |
| **Concierge** | Guest-facing Q&A, requests, upsell, escalation | property knowledge, reservation, create task, offer, escalate | AUTO (with escalation) |
| **Inbox Copilot** | Classify, summarize, draft replies | conversation/guest/reservation context, send message | APPROVE→AUTO |
| **Reputation Manager** | Sentiment/topics, draft review responses, solicit reviews | reviews, respond_to_review, send message | APPROVE (neg) / AUTO (pos) |
| **Campaign / Marketing Writer** | Build win-back/abandoned/promo campaigns | guest segments, offers, schedule campaign | SUGGEST→APPROVE |
| **Ops Triage** | Classify issues, create/route tasks | create task, assign, notify | APPROVE→AUTO |
| **Analyst / Briefing** | Generate daily briefing & report narratives, answer "Ask StayBoost" | analytics/read tools | AUTO (read-only) |
| **Onboarding Scout** | Baseline scan, "3 quick wins" on signup | read all | SUGGEST |

A lightweight **orchestrator** routes a user/system request to the right agent
(or chains them), e.g. a negative review → Reputation Manager (draft response) +
Ops Triage (recovery task) + Inbox Copilot (proactive guest message).

## 5. RAG (Retrieval-Augmented Generation)

- **Sources:** property docs (house rules, FAQs, policies), guest history,
  reservation context, past conversations, knowledge base, and structured records.
- **Pipeline:** ingest → chunk → embed → store in `knowledge_chunks` (pgvector,
  HNSW). Retrieval is **tenant- and property-scoped** (RLS-enforced) so no
  cross-tenant leakage.
- **Hybrid retrieval:** vector + keyword + structured filters (e.g. "this guest,
  this reservation"). Structured facts (dates, prices, policies) come from the
  DB via tools, not from fuzzy retrieval, to avoid hallucinated numbers.

## 6. Memory

- **Short-term:** conversation/session context window per interaction.
- **Long-term:** durable guest profile + preferences (Guest CRM), property
  knowledge, and learned operator preferences (tone, approval patterns).
- **Organizational learning:** approved/rejected AI actions feed preference tuning
  (which suggestions this operator accepts) and improve future suggestions.

## 7. Model Router

Routes each task to the optimal model by **quality need, latency budget, and
cost**:
- Cheap/fast model for classification, language detection, routing.
- Balanced model for high-volume drafting (inbox, confirmations).
- Top model for complex reasoning (pricing rationale, escalations, ambiguous
  guest issues).
- Caching (prompt + result) for repeated patterns; batching where possible.
- Records tokens + cost per action for margin tracking and per-tenant metering.

## 8. Guardrails & safety (non-negotiable)

- **Structured output validation:** prices, dates, JSON actions validated against
  schemas before execution; malformed output is rejected/retried.
- **Business guardrails:** pricing within min/max floors; no message to a guest
  who opted out; spend caps on campaigns; rate limits on autonomous actions.
- **Confidence gating:** low-confidence outputs escalate to a human regardless of
  autonomy level.
- **PII handling:** redaction/tokenization before sending to models where
  feasible; consent checks before guest messaging.
- **Safety & brand:** content filters, tone/brand constraints, jailbreak
  resistance for the guest-facing concierge.
- **Human override + reversibility:** every autonomous action is logged and
  reversible (e.g. revert a pushed price).
- **Full audit:** `ai_actions` captures input, output, rationale, model, version,
  cost, and decision — powering explainability and compliance.

## 9. Evaluation & quality

- **Offline eval harness** (`services/ai/app/evals`): curated hospitality task
  datasets (pricing scenarios, guest messages in many languages, review types).
  Every prompt/model change runs against them; ship only on regression-free.
- **Online evals:** sampled human review, thumbs up/down on AI actions, automatic
  outcome tracking (did the approved price improve pickup? did the reply resolve
  the thread?).
- **Drift monitoring:** track acceptance rate, escalation rate, complaint/opt-out
  rate, and cost per action over time.
- **Golden prompts versioned** in `services/ai/app/prompts` with changelogs.

## 10. Cost & scale strategy

- Async generation via the worker queue for non-interactive tasks.
- Aggressive caching + batching; cheapest-capable model per task via the router.
- Per-tenant usage metering (`usage_records`) ties AI cost to the subscription
  plan so unit economics stay positive (see [09](09-saas-subscription-model.md)).
- Embeddings recomputed incrementally; RAG indexes maintained by workers.

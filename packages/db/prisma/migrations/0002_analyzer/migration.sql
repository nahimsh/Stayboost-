-- AI Property Analyzer reports (anonymous, claimable) + AI action audit log.

CREATE TABLE "analyzer_reports" (
    "id" UUID NOT NULL,
    "token" TEXT NOT NULL,
    "org_id" UUID,
    "input" JSONB NOT NULL,
    "report" JSONB NOT NULL,
    "engine" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "analyzer_reports_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "analyzer_reports_token_key" ON "analyzer_reports" ("token");
CREATE INDEX "analyzer_reports_created_at_idx" ON "analyzer_reports" ("created_at");
CREATE INDEX "analyzer_reports_org_id_idx" ON "analyzer_reports" ("org_id");

CREATE TABLE "ai_actions" (
    "id" UUID NOT NULL,
    "org_id" UUID,
    "agent" TEXT NOT NULL,
    "action_type" TEXT NOT NULL,
    "input" JSONB NOT NULL,
    "output" JSONB NOT NULL,
    "rationale" TEXT,
    "model" TEXT NOT NULL,
    "engine" TEXT,
    "status" TEXT NOT NULL,
    "cost_minor" BIGINT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ai_actions_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ai_actions_org_id_created_at_idx" ON "ai_actions" ("org_id", "created_at");
CREATE INDEX "ai_actions_agent_created_at_idx" ON "ai_actions" ("agent", "created_at");

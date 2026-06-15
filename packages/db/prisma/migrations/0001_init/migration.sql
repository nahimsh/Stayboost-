-- Enable pgvector for future embedding columns (RAG, semantic search).
CREATE EXTENSION IF NOT EXISTS "vector";

-- contact_leads: platform-level (not tenant-owned) pre-signup leads.
CREATE TABLE "contact_leads" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "company" TEXT,
    "property_count" INTEGER,
    "reason" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'web',
    "status" TEXT NOT NULL DEFAULT 'new',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "contact_leads_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "contact_leads_created_at_idx" ON "contact_leads" ("created_at");
CREATE INDEX "contact_leads_reason_status_idx" ON "contact_leads" ("reason", "status");

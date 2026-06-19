-- Channel sync logs (append-only run history). Tenant-owned + RLS.

CREATE TABLE "sync_logs" (
    "id" UUID NOT NULL,
    "org_id" UUID NOT NULL,
    "connection_id" UUID NOT NULL,
    "status" TEXT NOT NULL,
    "imported" INTEGER NOT NULL DEFAULT 0,
    "updated" INTEGER NOT NULL DEFAULT 0,
    "blocked" INTEGER NOT NULL DEFAULT 0,
    "duration_ms" INTEGER NOT NULL DEFAULT 0,
    "message" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "sync_logs_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "sync_logs_connection_id_created_at_idx" ON "sync_logs" ("connection_id", "created_at");
ALTER TABLE "sync_logs" ADD CONSTRAINT "sync_logs_connection_id_fkey" FOREIGN KEY ("connection_id") REFERENCES "channel_connections" ("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "sync_logs" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "sync_logs" FORCE ROW LEVEL SECURITY;
CREATE POLICY "sync_logs_tenant_isolation" ON "sync_logs"
    USING ("org_id"::text = current_setting('app.org_id', true))
    WITH CHECK ("org_id"::text = current_setting('app.org_id', true));

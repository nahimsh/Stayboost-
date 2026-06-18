-- Channel connections (iCal feeds) + normalized reservations. Tenant-owned + RLS.

CREATE TABLE "channel_connections" (
    "id" UUID NOT NULL,
    "org_id" UUID NOT NULL,
    "property_id" UUID NOT NULL,
    "provider" TEXT NOT NULL,
    "ical_url" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "last_synced_at" TIMESTAMPTZ(6),
    "last_error" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    CONSTRAINT "channel_connections_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "channel_connections_org_id_idx" ON "channel_connections" ("org_id");
CREATE INDEX "channel_connections_property_id_idx" ON "channel_connections" ("property_id");
ALTER TABLE "channel_connections" ADD CONSTRAINT "channel_connections_property_id_fkey" FOREIGN KEY ("property_id") REFERENCES "properties" ("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "reservations" (
    "id" UUID NOT NULL,
    "org_id" UUID NOT NULL,
    "property_id" UUID NOT NULL,
    "channel" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "external_id" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "check_in" DATE NOT NULL,
    "check_out" DATE NOT NULL,
    "nights" INTEGER NOT NULL,
    "guest_name" TEXT,
    "raw" JSONB,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    CONSTRAINT "reservations_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "reservations_org_id_source_external_id_key" ON "reservations" ("org_id", "source", "external_id");
CREATE INDEX "reservations_org_id_property_id_check_in_idx" ON "reservations" ("org_id", "property_id", "check_in");
CREATE INDEX "reservations_property_id_check_out_idx" ON "reservations" ("property_id", "check_out");
ALTER TABLE "reservations" ADD CONSTRAINT "reservations_property_id_fkey" FOREIGN KEY ("property_id") REFERENCES "properties" ("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- RLS: confine rows to the request's tenant when `app.org_id` is set (see
-- runWithTenant in the API). ENABLE + FORCE so the policy applies even to the
-- table owner; the API connects with a role and SET LOCAL app.org_id per request.
ALTER TABLE "channel_connections" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "channel_connections" FORCE ROW LEVEL SECURITY;
CREATE POLICY "channel_connections_tenant_isolation" ON "channel_connections"
    USING ("org_id"::text = current_setting('app.org_id', true))
    WITH CHECK ("org_id"::text = current_setting('app.org_id', true));

ALTER TABLE "reservations" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "reservations" FORCE ROW LEVEL SECURITY;
CREATE POLICY "reservations_tenant_isolation" ON "reservations"
    USING ("org_id"::text = current_setting('app.org_id', true))
    WITH CHECK ("org_id"::text = current_setting('app.org_id', true));

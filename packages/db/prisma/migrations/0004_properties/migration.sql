-- Property entity (created by the onboarding wizard) + RLS.

CREATE TABLE "properties" (
    "id" UUID NOT NULL,
    "org_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "airbnb_url" TEXT,
    "booking_url" TEXT,
    "website_url" TEXT,
    "rooms_count" INTEGER NOT NULL,
    "contact_name" TEXT,
    "contact_email" TEXT,
    "contact_phone" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    CONSTRAINT "properties_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "properties_org_id_idx" ON "properties" ("org_id");
ALTER TABLE "properties" ADD CONSTRAINT "properties_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "organizations" ("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- RLS backstop: confine rows to the request's tenant when `app.org_id` is set.
-- ENABLE (not FORCE) so the app's owner connection operates normally today;
-- a restricted role + request-scoped `SET app.org_id` enforces it fully later.
ALTER TABLE "properties" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "properties_tenant_isolation" ON "properties"
    USING ("org_id"::text = current_setting('app.org_id', true))
    WITH CHECK ("org_id"::text = current_setting('app.org_id', true));

-- Auth reads memberships across orgs (login resolves a user's orgs before any
-- tenant context exists). FORCE RLS conflicts with that access pattern, so relax
-- it to ENABLE — primary tenant isolation remains the org_id-scoped data layer.
ALTER TABLE "memberships" NO FORCE ROW LEVEL SECURITY;

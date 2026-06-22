import {
  buildSampleDashboardSnapshot,
  type AuthUser,
  type DashboardSnapshot,
} from "@stayboost/domain";

/** A fixed, fictional operator used to render the public demo dashboard. */
export const DEMO_USER: AuthUser = {
  id: "demo-user",
  email: "demo@stayboost.app",
  name: "Demo Host",
  emailVerified: true,
  onboardingComplete: true,
  organizations: [{ orgId: "demo-org", orgName: "Sea Breeze Hospitality", role: "owner" }],
};

/** Sample snapshot for the demo dashboard — no API or login required. */
export function demoSnapshot(): DashboardSnapshot {
  return buildSampleDashboardSnapshot({ propertyName: "Sea Breeze Villa", propertyType: "villa", totalUnits: 10 });
}

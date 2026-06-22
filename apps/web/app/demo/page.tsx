import type { Metadata } from "next";
import { getDictionary } from "@stayboost/i18n";
import { DemoDashboard } from "@/components/dashboard/demo-dashboard";

export const metadata: Metadata = {
  title: getDictionary().dashboard.demo.meta.title,
  robots: { index: false },
};

/**
 * Public demo of the command center. Lives outside the `(app)` group so the
 * auth middleware never guards it — anyone can explore it without a login.
 */
export default function DemoPage(): React.JSX.Element {
  return <DemoDashboard />;
}

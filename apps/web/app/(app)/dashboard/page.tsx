import type { Metadata } from "next";
import { getDictionary } from "@stayboost/i18n";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";

export const metadata: Metadata = {
  title: getDictionary().dashboard.meta.title,
  robots: { index: false },
};

export default function DashboardPage(): React.JSX.Element {
  return <DashboardShell />;
}

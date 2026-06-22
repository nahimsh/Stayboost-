"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Sparkles } from "lucide-react";
import { buttonVariants, cn } from "@stayboost/ui";
import { getDictionary } from "@stayboost/i18n";
import { DEMO_USER, demoSnapshot } from "@/lib/demo-data";
import { Sidebar } from "./sidebar";
import { Topbar } from "./topbar";
import { DashboardGrid } from "./dashboard-shell";

const t = getDictionary().dashboard;

/**
 * Public, login-free dashboard preview. Renders the real command-center UI with
 * deterministic sample data so prospects can explore the product before signing
 * up. No API calls, no auth cookie — works on a bare deploy without a domain.
 */
export function DemoDashboard(): React.JSX.Element {
  const router = useRouter();
  const data = useMemo(() => demoSnapshot(), []);
  const unreadCount = data.notifications.filter((n) => !n.read).length;

  return (
    <div className="flex min-h-dvh bg-secondary/20">
      <Sidebar demo />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar
          user={DEMO_USER}
          propertyName={data.property.name}
          unreadCount={unreadCount}
          onLogout={() => router.push("/")}
        />

        <div className="flex flex-wrap items-center gap-3 border-b border-primary/20 bg-primary/5 px-4 py-3 sm:px-6">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-primary px-2.5 py-1 text-xs font-semibold uppercase tracking-wide text-primary-foreground">
            <Sparkles className="size-3.5" aria-hidden />
            {t.demo.badge}
          </span>
          <div className="min-w-0">
            <p className="text-sm font-medium">{t.demo.title}</p>
            <p className="text-xs text-muted-foreground">{t.demo.body}</p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <Link href="/" className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
              {t.demo.backToSite}
            </Link>
            <Link href="/signup" className={cn(buttonVariants({ size: "sm" }))}>
              {t.demo.signup}
            </Link>
          </div>
        </div>

        <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6">
          <DashboardGrid user={DEMO_USER} data={data} />
        </main>
      </div>
    </div>
  );
}

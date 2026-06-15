"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Info } from "lucide-react";
import type { AuthUser, DashboardSnapshot } from "@stayboost/domain";
import { ApiError } from "@stayboost/api-client";
import { Button, Skeleton } from "@stayboost/ui";
import { getDictionary } from "@stayboost/i18n";
import { api } from "@/lib/api";
import { Sidebar } from "./sidebar";
import { Topbar } from "./topbar";
import { RevenueWidget } from "./revenue-widget";
import { OccupancyWidget } from "./occupancy-widget";
import { HealthWidget } from "./health-widget";
import { StaysWidget } from "./stays-widget";
import { RecommendationsWidget } from "./recommendations-widget";
import { LeadsWidget } from "./leads-widget";
import { NotificationsWidget } from "./notifications-widget";

const t = getDictionary().dashboard;

type State =
  | { kind: "loading" }
  | { kind: "ready"; user: AuthUser; data: DashboardSnapshot }
  | { kind: "error" };

export function DashboardShell(): React.JSX.Element {
  const router = useRouter();
  const [state, setState] = useState<State>({ kind: "loading" });

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const [user, data] = await Promise.all([api.auth.me(), api.dashboard.snapshot()]);
        if (active) setState({ kind: "ready", user, data });
      } catch (error) {
        if (error instanceof ApiError && error.status === 401) {
          router.replace("/login");
          return;
        }
        if (active) setState({ kind: "error" });
      }
    })();
    return () => {
      active = false;
    };
  }, [router]);

  async function handleLogout(): Promise<void> {
    try {
      await api.auth.logout();
    } finally {
      router.replace("/login");
    }
  }

  return (
    <div className="flex min-h-dvh bg-secondary/20">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        {state.kind === "ready" ? (
          <Topbar
            user={state.user}
            propertyName={state.data.property.name}
            unreadCount={state.data.notifications.filter((n) => !n.read).length}
            onLogout={handleLogout}
          />
        ) : (
          <div className="sticky top-0 z-30 h-16 border-b bg-background" />
        )}

        <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6">
          {state.kind === "loading" ? <DashboardSkeleton /> : null}
          {state.kind === "error" ? <DashboardError /> : null}
          {state.kind === "ready" ? <DashboardGrid user={state.user} data={state.data} /> : null}
        </main>
      </div>
    </div>
  );
}

function DashboardGrid({ user, data }: { readonly user: AuthUser; readonly data: DashboardSnapshot }): React.JSX.Element {
  const firstName = user.name.split(/\s+/)[0] ?? user.name;
  return (
    <div className="space-y-5">
      {data.demo ? (
        <div className="flex items-start gap-2 rounded-lg border border-primary/20 bg-primary/5 px-4 py-3 text-sm text-foreground">
          <Info className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
          <p>{t.demoBanner}</p>
        </div>
      ) : null}

      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          {t.greeting}, {firstName}
        </h1>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        <div className="lg:col-span-8">
          <RevenueWidget data={data.revenue} />
        </div>
        <div className="lg:col-span-4">
          <OccupancyWidget data={data.occupancy} />
        </div>

        <div className="lg:col-span-4">
          <HealthWidget data={data.health} />
        </div>
        <div className="lg:col-span-4">
          <StaysWidget title={t.widgets.checkIns.title} stays={data.checkIns} emptyMessage={t.widgets.checkIns.empty} />
        </div>
        <div className="lg:col-span-4">
          <StaysWidget title={t.widgets.checkOuts.title} stays={data.checkOuts} emptyMessage={t.widgets.checkOuts.empty} />
        </div>

        <div className="lg:col-span-8">
          <RecommendationsWidget items={data.recommendations} />
        </div>
        <div className="lg:col-span-4">
          <NotificationsWidget items={data.notifications} />
        </div>

        <div className="lg:col-span-12">
          <LeadsWidget leads={data.leads} />
        </div>
      </div>
    </div>
  );
}

function DashboardSkeleton(): React.JSX.Element {
  return (
    <div className="space-y-5" role="status" aria-label="Loading dashboard">
      <Skeleton className="h-8 w-48" />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        <Skeleton className="h-48 lg:col-span-8" />
        <Skeleton className="h-48 lg:col-span-4" />
        <Skeleton className="h-40 lg:col-span-4" />
        <Skeleton className="h-40 lg:col-span-4" />
        <Skeleton className="h-40 lg:col-span-4" />
        <Skeleton className="h-56 lg:col-span-8" />
        <Skeleton className="h-56 lg:col-span-4" />
      </div>
    </div>
  );
}

function DashboardError(): React.JSX.Element {
  return (
    <div className="flex min-h-64 flex-col items-center justify-center gap-4 text-center">
      <p className="text-muted-foreground">{t.loadError}</p>
      <Button onClick={() => window.location.reload()}>{t.retry}</Button>
    </div>
  );
}

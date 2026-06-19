"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Plug,
  LineChart,
  CalendarDays,
  Inbox,
  Users,
  Star,
  ClipboardList,
  Megaphone,
  BarChart3,
  Settings,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@stayboost/ui";
import { getDictionary } from "@stayboost/i18n";

const t = getDictionary();
const nav = t.dashboard.nav;

interface NavItem {
  label: string;
  icon: LucideIcon;
  href?: string;
}

// Mirrors docs/06 IA. Implemented sections are real links; the rest are shown as
// upcoming so the navigation communicates the product without dead links.
const ITEMS: NavItem[] = [
  { label: nav.home, icon: LayoutDashboard, href: "/dashboard" },
  { label: nav.channels, icon: Plug, href: "/dashboard/channels" },
  { label: nav.revenue, icon: LineChart },
  { label: nav.bookings, icon: CalendarDays },
  { label: nav.inbox, icon: Inbox },
  { label: nav.guests, icon: Users },
  { label: nav.reviews, icon: Star },
  { label: nav.operations, icon: ClipboardList },
  { label: nav.marketing, icon: Megaphone },
  { label: nav.analytics, icon: BarChart3 },
  { label: nav.settings, icon: Settings },
];

/** Persistent left nav (desktop). Hidden on mobile, where the top bar leads. */
export function Sidebar(): React.JSX.Element {
  const pathname = usePathname();
  return (
    <aside className="hidden w-60 shrink-0 flex-col border-r bg-card lg:flex">
      <div className="flex h-16 items-center border-b px-6">
        <Link href="/dashboard" className="text-lg font-bold tracking-tight">
          {t.common.brand}
        </Link>
      </div>
      <nav aria-label={nav.home} className="flex-1 space-y-1 p-3">
        {ITEMS.map((item) => {
          const Icon = item.icon;
          if (item.href) {
            const active = pathname === item.href;
            return (
              <Link
                key={item.label}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  active ? "bg-secondary text-foreground" : "text-muted-foreground hover:bg-secondary/60",
                )}
              >
                <Icon className="size-4" aria-hidden />
                {item.label}
              </Link>
            );
          }
          return (
            <span
              key={item.label}
              className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground/70"
            >
              <Icon className="size-4" aria-hidden />
              {item.label}
              <span className="ml-auto rounded bg-muted px-1.5 py-0.5 text-[10px] uppercase tracking-wide">
                {nav.soon}
              </span>
            </span>
          );
        })}
      </nav>
    </aside>
  );
}

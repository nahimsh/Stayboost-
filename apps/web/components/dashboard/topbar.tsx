"use client";

import { useState } from "react";
import { Bell, ChevronDown, Sparkles } from "lucide-react";
import type { AuthUser } from "@stayboost/domain";
import { Button, cn } from "@stayboost/ui";
import { getDictionary } from "@stayboost/i18n";

const t = getDictionary().dashboard.topbar;
const brand = getDictionary().common.brand;

export function Topbar({
  user,
  propertyName,
  unreadCount,
  onLogout,
}: {
  readonly user: AuthUser;
  readonly propertyName: string;
  readonly unreadCount: number;
  readonly onLogout: () => void;
}): React.JSX.Element {
  const [menuOpen, setMenuOpen] = useState(false);
  const initials = user.name
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0] ?? "")
    .join("")
    .toUpperCase();

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b bg-background/90 px-4 backdrop-blur sm:px-6">
      <span className="text-lg font-bold tracking-tight lg:hidden">{brand}</span>

      <button
        type="button"
        className="flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm font-medium hover:bg-secondary"
        aria-label={t.switchProperty}
      >
        <span className="max-w-32 truncate sm:max-w-none">{propertyName}</span>
        <ChevronDown className="size-4 text-muted-foreground" aria-hidden />
      </button>

      <div className="ml-auto flex items-center gap-1 sm:gap-2">
        <Button variant="outline" size="sm" className="hidden sm:inline-flex" disabled>
          <Sparkles className="size-4" aria-hidden /> {t.ask}
        </Button>

        <button
          type="button"
          className="relative inline-flex size-10 items-center justify-center rounded-md hover:bg-secondary"
          aria-label={`${t.notifications}${unreadCount > 0 ? ` (${unreadCount})` : ""}`}
        >
          <Bell className="size-5" aria-hidden />
          {unreadCount > 0 ? (
            <span className="absolute right-1.5 top-1.5 flex min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold text-primary-foreground">
              {unreadCount}
            </span>
          ) : null}
        </button>

        <div className="relative">
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            aria-expanded={menuOpen}
            aria-haspopup="menu"
            className="flex size-10 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground"
          >
            {initials || "?"}
          </button>
          {menuOpen ? (
            <div
              role="menu"
              className={cn(
                "absolute right-0 mt-2 w-56 rounded-lg border bg-card p-1 shadow-lg",
              )}
            >
              <div className="border-b px-3 py-2">
                <p className="truncate text-sm font-medium">{user.name}</p>
                <p className="truncate text-xs text-muted-foreground">{user.email}</p>
              </div>
              <button
                type="button"
                role="menuitem"
                onClick={onLogout}
                className="mt-1 w-full rounded-md px-3 py-2 text-left text-sm hover:bg-secondary"
              >
                {t.logout}
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
}

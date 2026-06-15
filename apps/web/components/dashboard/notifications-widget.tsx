import { Bell, CalendarCheck, Star, Tag, Wrench, type LucideIcon } from "lucide-react";
import type { NotificationItem } from "@stayboost/domain";
import { cn } from "@stayboost/ui";
import { getDictionary } from "@stayboost/i18n";
import { WidgetCard, EmptyState } from "./widget-card";
import { formatRelative } from "@/lib/dashboard-format";

const t = getDictionary().dashboard.widgets.notifications;

const TYPE_ICON: Record<NotificationItem["type"], LucideIcon> = {
  booking: CalendarCheck,
  review: Star,
  pricing: Tag,
  ops: Wrench,
  system: Bell,
};

export function NotificationsWidget({ items }: { readonly items: NotificationItem[] }): React.JSX.Element {
  return (
    <WidgetCard title={t.title} bodyClassName="p-0">
      {items.length === 0 ? (
        <div className="p-5">
          <EmptyState message={t.empty} />
        </div>
      ) : (
        <ul className="divide-y">
          {items.map((n) => {
            const Icon = TYPE_ICON[n.type];
            return (
              <li key={n.id} className={cn("flex gap-3 px-5 py-3", !n.read && "bg-primary/[0.03]")}>
                <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-secondary text-muted-foreground">
                  <Icon className="size-4" aria-hidden />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    {!n.read ? <span className="size-1.5 shrink-0 rounded-full bg-primary" aria-label="Unread" /> : null}
                    <p className="truncate text-sm font-medium">{n.title}</p>
                  </div>
                  <p className="truncate text-xs text-muted-foreground">{n.body}</p>
                </div>
                <span className="shrink-0 text-xs text-muted-foreground">{formatRelative(n.createdAt)}</span>
              </li>
            );
          })}
        </ul>
      )}
    </WidgetCard>
  );
}

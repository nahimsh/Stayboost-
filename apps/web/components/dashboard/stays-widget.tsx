import type { Stay } from "@stayboost/domain";
import { Badge } from "@stayboost/ui";
import { getDictionary } from "@stayboost/i18n";
import { WidgetCard, EmptyState } from "./widget-card";
import { formatStayDate } from "@/lib/dashboard-format";

const d = getDictionary().dashboard;

const STATUS_VARIANT: Record<Stay["status"], "primary" | "accent" | "muted"> = {
  due: "primary",
  checked_in: "accent",
  confirmed: "muted",
  pending: "muted",
};

export function StaysWidget({
  title,
  stays,
  emptyMessage,
}: {
  readonly title: string;
  readonly stays: Stay[];
  readonly emptyMessage: string;
}): React.JSX.Element {
  return (
    <WidgetCard title={title} bodyClassName="p-0">
      {stays.length === 0 ? (
        <div className="p-5">
          <EmptyState message={emptyMessage} />
        </div>
      ) : (
        <ul className="divide-y">
          {stays.map((stay) => (
            <li key={stay.id} className="flex items-center gap-3 px-5 py-3">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-semibold uppercase">
                {initials(stay.guestName)}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{stay.guestName}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {stay.unitName} · {stay.nights} {d.widgets.checkIns.nights} · {stay.guests}{" "}
                  {d.widgets.checkIns.guests}
                </p>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-1">
                <span className="text-xs font-medium">{formatStayDate(stay.date)}</span>
                <Badge variant={STATUS_VARIANT[stay.status]}>{d.stayStatus[stay.status]}</Badge>
              </div>
            </li>
          ))}
        </ul>
      )}
    </WidgetCard>
  );
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0] ?? "")
    .join("");
}

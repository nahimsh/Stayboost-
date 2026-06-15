import type { OccupancyWidget as OccupancyData } from "@stayboost/domain";
import { getDictionary } from "@stayboost/i18n";
import { WidgetCard } from "./widget-card";

const t = getDictionary().dashboard.widgets.occupancy;

export function OccupancyWidget({ data }: { readonly data: OccupancyData }): React.JSX.Element {
  const circumference = 2 * Math.PI * 42;
  const dash = (data.currentPct / 100) * circumference;
  return (
    <WidgetCard title={t.title}>
      <div className="flex items-center gap-5">
        <div className="relative shrink-0">
          <svg viewBox="0 0 100 100" className="size-24 -rotate-90" aria-hidden>
            <circle cx="50" cy="50" r="42" fill="none" stroke="hsl(var(--muted))" strokeWidth="10" />
            <circle
              cx="50"
              cy="50"
              r="42"
              fill="none"
              stroke="hsl(var(--primary))"
              strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray={`${dash} ${circumference}`}
            />
          </svg>
          <span className="absolute inset-0 flex items-center justify-center text-xl font-bold">
            {Math.round(data.currentPct)}%
          </span>
        </div>
        <div className="space-y-1 text-sm">
          <p className="text-muted-foreground">
            {t.ofTarget.replace("{target}", String(Math.round(data.targetPct)))}
          </p>
          <p className="font-medium">
            {t.unitsBooked
              .replace("{occupied}", String(data.occupiedUnits))
              .replace("{total}", String(data.totalUnits))}
          </p>
        </div>
      </div>
      <div className="mt-4">
        <p className="mb-2 text-xs text-muted-foreground">{t.next7}</p>
        <div className="flex items-end gap-1.5" aria-hidden>
          {data.next7Days.map((day) => (
            <div key={day.date} className="flex-1 rounded-t bg-primary/15" style={{ height: `${Math.max(8, day.pct * 0.5)}px` }} title={`${day.pct}%`}>
              <div className="h-full w-full rounded-t bg-primary/70" style={{ height: `${day.pct}%` }} />
            </div>
          ))}
        </div>
      </div>
    </WidgetCard>
  );
}

import type { PropertyHealth } from "@stayboost/domain";
import { getDictionary } from "@stayboost/i18n";
import { WidgetCard } from "./widget-card";

const t = getDictionary().dashboard.widgets.health;

const GRADE_TONE: Record<PropertyHealth["grade"], string> = {
  A: "text-success",
  B: "text-primary",
  C: "text-accent-strong",
  D: "text-destructive",
};

export function HealthWidget({ data }: { readonly data: PropertyHealth }): React.JSX.Element {
  return (
    <WidgetCard title={t.title}>
      <div className="flex items-center gap-4">
        <div className="flex size-16 shrink-0 flex-col items-center justify-center rounded-full border-2 border-border">
          <span className="text-2xl font-bold leading-none">{data.score}</span>
          <span className={`text-xs font-semibold ${GRADE_TONE[data.grade]}`}>{data.grade}</span>
        </div>
        <ul className="flex-1 space-y-2">
          {data.factors.map((factor) => (
            <li key={factor.label}>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">{factor.label}</span>
                <span className="font-medium">{factor.score}</span>
              </div>
              <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted">
                <div className="h-full rounded-full bg-primary" style={{ width: `${factor.score}%` }} />
              </div>
            </li>
          ))}
        </ul>
      </div>
    </WidgetCard>
  );
}

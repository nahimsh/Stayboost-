import type { RevenueOverview } from "@stayboost/domain";
import { formatMoney, makeMoney } from "@stayboost/utils";
import { getDictionary } from "@stayboost/i18n";
import { WidgetCard } from "./widget-card";
import { TrendChip } from "./trend-chip";

const t = getDictionary().dashboard.widgets.revenue;

function Sparkline({ values }: { readonly values: number[] }): React.JSX.Element {
  if (values.length < 2) return <div className="h-16" />;
  const max = Math.max(...values);
  const min = Math.min(...values);
  const range = max - min || 1;
  const points = values
    .map((v, i) => {
      const x = (i / (values.length - 1)) * 100;
      const y = 100 - ((v - min) / range) * 100;
      return `${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(" ");
  return (
    <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="h-16 w-full" aria-hidden>
      <polyline points={points} fill="none" stroke="hsl(var(--primary))" strokeWidth="2.5" vectorEffect="non-scaling-stroke" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

export function RevenueWidget({ data }: { readonly data: RevenueOverview }): React.JSX.Element {
  const money = (minor: number): string => formatMoney(makeMoney(minor, data.currency));
  return (
    <WidgetCard title={t.title}>
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="text-xs text-muted-foreground">{t.mtd}</p>
          <p className="text-3xl font-bold tracking-tight">{money(data.monthToDateMinor)}</p>
        </div>
        <TrendChip trend={data.trend} suffix={t.vsLastMonth} />
      </div>
      <div className="mt-3">
        <Sparkline values={data.dailyMinor} />
      </div>
      <dl className="mt-3 grid grid-cols-2 gap-3 border-t pt-3 text-sm">
        <div>
          <dt className="text-xs text-muted-foreground">{t.adr}</dt>
          <dd className="font-semibold">{money(data.adrMinor)}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">{t.revpar}</dt>
          <dd className="font-semibold">{money(data.revparMinor)}</dd>
        </div>
      </dl>
    </WidgetCard>
  );
}

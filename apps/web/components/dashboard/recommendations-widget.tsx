import { TrendingUp, Coins, Workflow, Sparkles, type LucideIcon } from "lucide-react";
import type { AiRecommendation, Pillar } from "@stayboost/domain";
import { Badge, Button } from "@stayboost/ui";
import { getDictionary } from "@stayboost/i18n";
import { WidgetCard, EmptyState } from "./widget-card";

const t = getDictionary().dashboard.widgets.recommendations;

const PILLAR_ICON: Record<Pillar, LucideIcon> = {
  acquire: TrendingUp,
  monetize: Coins,
  automate: Workflow,
  delight: Sparkles,
};

export function RecommendationsWidget({ items }: { readonly items: AiRecommendation[] }): React.JSX.Element {
  return (
    <WidgetCard title={t.title} bodyClassName="p-0">
      {items.length === 0 ? (
        <div className="p-5">
          <EmptyState message={t.empty} />
        </div>
      ) : (
        <ul className="divide-y">
          {items.map((rec) => {
            const Icon = PILLAR_ICON[rec.pillar];
            return (
              <li key={rec.id} className="flex gap-3 px-5 py-3.5">
                <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                  <Icon className="size-4" aria-hidden />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-medium">{rec.title}</p>
                    <Badge variant="accent">{rec.impactLabel}</Badge>
                  </div>
                  <p className="mt-0.5 text-xs text-muted-foreground">{rec.detail}</p>
                </div>
                <Button variant="ghost" size="sm" className="shrink-0 self-center">
                  {t.review}
                </Button>
              </li>
            );
          })}
        </ul>
      )}
    </WidgetCard>
  );
}

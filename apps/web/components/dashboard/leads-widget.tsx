import type { Lead } from "@stayboost/domain";
import { Badge } from "@stayboost/ui";
import { getDictionary } from "@stayboost/i18n";
import { WidgetCard, EmptyState } from "./widget-card";
import { formatRelative } from "@/lib/dashboard-format";

const d = getDictionary().dashboard;

export function LeadsWidget({ leads }: { readonly leads: Lead[] }): React.JSX.Element {
  return (
    <WidgetCard title={d.widgets.leads.title} bodyClassName="p-0">
      {leads.length === 0 ? (
        <div className="p-5">
          <EmptyState message={d.widgets.leads.empty} />
        </div>
      ) : (
        <ul className="divide-y">
          {leads.map((lead) => (
            <li key={lead.id} className="flex items-center gap-3 px-5 py-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="truncate text-sm font-medium">{lead.name}</p>
                  {lead.status === "new" ? <Badge variant="primary">{d.widgets.leads.newBadge}</Badge> : null}
                </div>
                <p className="truncate text-xs text-muted-foreground">{lead.interest}</p>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-0.5 text-xs">
                <span className="font-medium text-muted-foreground">{d.leadSource[lead.source]}</span>
                <span className="text-muted-foreground">{formatRelative(lead.createdAt)}</span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </WidgetCard>
  );
}

import { Check, Minus } from "lucide-react";
import { PLAN_LIST } from "@stayboost/domain";
import { getDictionary } from "@stayboost/i18n";

const dict = getDictionary();
const t = dict.pricing;
const a11y = dict.common.a11y;

type CellValue = boolean | string;

function Cell({ value }: { readonly value: CellValue }): React.JSX.Element {
  if (value === true) {
    return <Check className="mx-auto text-accent-strong" role="img" aria-label={a11y.included} />;
  }
  if (value === false) {
    return <Minus className="mx-auto text-muted-foreground" role="img" aria-label={a11y.notIncluded} />;
  }
  return <span className="text-sm">{value}</span>;
}

export function FeatureMatrix(): React.JSX.Element {
  const planCopy = t.plans;

  return (
    <section className="border-t py-20">
      <div className="container space-y-10">
        <h2 className="text-center text-3xl font-bold tracking-tight">{t.matrix.title}</h2>

        {/* Desktop: comparison table */}
        <div className="hidden md:block">
          <table className="w-full border-collapse">
            <caption className="sr-only">{t.matrix.caption}</caption>
            <thead>
              <tr className="border-b">
                <th scope="col" className="py-3 text-left text-sm font-semibold">
                  {t.matrix.featureColumn}
                </th>
                {PLAN_LIST.map((plan) => (
                  <th key={plan.id} scope="col" className="py-3 text-center text-sm font-semibold">
                    {planCopy[plan.id].name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {t.matrix.rows.map((row) => (
                <tr key={row.label} className="border-b">
                  <th scope="row" className="py-3 text-left text-sm font-normal text-muted-foreground">
                    {row.label}
                  </th>
                  {PLAN_LIST.map((plan) => (
                    <td key={plan.id} className="py-3 text-center">
                      <Cell value={row.values[plan.id]} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile: stacked per-plan cards */}
        <div className="space-y-6 md:hidden">
          {PLAN_LIST.map((plan) => (
            <div key={plan.id} className="rounded-lg border bg-card">
              <h3 className="border-b px-4 py-3 font-semibold">{planCopy[plan.id].name}</h3>
              <dl className="divide-y">
                {t.matrix.rows.map((row) => (
                  <div key={row.label} className="flex items-center justify-between gap-4 px-4 py-3">
                    <dt className="text-sm text-muted-foreground">{row.label}</dt>
                    <dd className="shrink-0 text-right">
                      <Cell value={row.values[plan.id]} />
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

import { ChevronDown } from "lucide-react";
import { getDictionary } from "@stayboost/i18n";

const t = getDictionary().pricing.faq;

export function PricingFaq(): React.JSX.Element {
  return (
    <section className="border-t py-20">
      <div className="container max-w-3xl space-y-8">
        <h2 className="text-center text-3xl font-bold tracking-tight">{t.title}</h2>
        <div className="space-y-3">
          {t.items.map((item) => (
            <details key={item.q} className="group rounded-lg border bg-card">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 p-5 font-medium [&::-webkit-details-marker]:hidden">
                {item.q}
                <ChevronDown
                  className="shrink-0 text-muted-foreground transition-transform group-open:rotate-180"
                  aria-hidden
                />
              </summary>
              <p className="px-5 pb-5 text-sm text-muted-foreground">{item.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

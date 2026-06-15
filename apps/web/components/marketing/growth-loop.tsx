import { getDictionary } from "@stayboost/i18n";

const t = getDictionary().landing.loop;

export function GrowthLoop(): React.JSX.Element {
  return (
    <section id="how" className="scroll-mt-20 border-b bg-secondary/30 py-20">
      <div className="container space-y-12">
        <div className="mx-auto max-w-2xl space-y-3 text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">{t.title}</h2>
          <p className="text-lg text-muted-foreground">{t.subtitle}</p>
        </div>
        <ol className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {t.steps.map((step, index) => (
            <li key={step.title} className="relative rounded-lg border bg-card p-6">
              <span className="flex size-9 items-center justify-center rounded-full bg-primary font-semibold text-primary-foreground">
                {index + 1}
              </span>
              <h3 className="mt-4 font-semibold">{step.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{step.body}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

import { TrendingUp, Coins, Workflow, Sparkles, type LucideIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@stayboost/ui";
import { getDictionary } from "@stayboost/i18n";

const t = getDictionary().landing.pillars;

const PILLARS: ReadonlyArray<{
  icon: LucideIcon;
  title: string;
  body: string;
}> = [
  { icon: TrendingUp, title: t.acquire.title, body: t.acquire.body },
  { icon: Coins, title: t.monetize.title, body: t.monetize.body },
  { icon: Workflow, title: t.automate.title, body: t.automate.body },
  { icon: Sparkles, title: t.delight.title, body: t.delight.body },
];

export function Pillars(): React.JSX.Element {
  return (
    <section id="features" className="scroll-mt-20 border-b py-20">
      <div className="container space-y-12">
        <div className="mx-auto max-w-2xl space-y-3 text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">{t.title}</h2>
          <p className="text-lg text-muted-foreground">{t.subtitle}</p>
        </div>
        <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {PILLARS.map(({ icon: Icon, title, body }) => (
            <li key={title}>
              <Card className="h-full transition-shadow hover:shadow-md">
                <CardHeader>
                  <span className="flex size-11 items-center justify-center rounded-md bg-primary/10 text-primary">
                    <Icon aria-hidden />
                  </span>
                  <CardTitle>{title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{body}</p>
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

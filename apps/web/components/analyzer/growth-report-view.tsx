import Link from "next/link";
import { TrendingUp, Coins, Workflow, Sparkles, Zap, type LucideIcon } from "lucide-react";
import type { GrowthReport, Pillar, Severity } from "@stayboost/domain";
import { Badge, Button, Card, CardContent, CardHeader, CardTitle, buttonVariants, cn } from "@stayboost/ui";
import { formatMoney, formatPercent, makeMoney } from "@stayboost/utils";
import { getDictionary } from "@stayboost/i18n";

const t = getDictionary().analyzer.report;
const pillarLabels = getDictionary().analyzer.pillars;

const PILLAR_ICON: Record<Pillar, LucideIcon> = {
  acquire: TrendingUp,
  monetize: Coins,
  automate: Workflow,
  delight: Sparkles,
};

const SEVERITY_VARIANT: Record<Severity, "primary" | "accent" | "muted"> = {
  high: "primary",
  medium: "accent",
  low: "muted",
};

export function GrowthReportView({
  report,
  onReset,
}: {
  readonly report: GrowthReport;
  readonly onReset?: () => void;
}): React.JSX.Element {
  const uplift = report.estimatedMonthlyUplift;
  const low = formatMoney(makeMoney(uplift.lowMinor, uplift.currency));
  const high = formatMoney(makeMoney(uplift.highMinor, uplift.currency));

  return (
    <div className="space-y-8">
      <header className="space-y-2 text-center">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{t.title}</h1>
        <p className="mx-auto max-w-2xl text-muted-foreground">{report.summary}</p>
      </header>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t.overallScore}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold">
              {report.overallScore}
              <span className="text-lg text-muted-foreground">/100</span>
            </p>
          </CardContent>
        </Card>
        <Card className="sm:col-span-2 border-accent-strong/40">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t.estimatedUplift}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-accent-strong">
              {low} – {high}{" "}
              <span className="text-base font-normal text-muted-foreground">{t.perMonth}</span>
            </p>
          </CardContent>
        </Card>
      </div>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">{t.quickWins}</h2>
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {report.quickWins.map((win) => (
            <li key={win.title} className="flex gap-3 rounded-lg border bg-card p-4">
              <Zap className="mt-0.5 size-5 shrink-0 text-accent-strong" aria-hidden />
              <div>
                <p className="font-medium">{win.title}</p>
                <p className="text-sm text-muted-foreground">{win.action}</p>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">{t.pillarsTitle}</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {report.pillars.map((pillar) => {
            const Icon = PILLAR_ICON[pillar.pillar];
            return (
              <Card key={pillar.pillar} className="h-full">
                <CardHeader>
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span className="flex size-9 items-center justify-center rounded-md bg-primary/10 text-primary">
                        <Icon aria-hidden className="size-5" />
                      </span>
                      <CardTitle>{pillarLabels[pillar.pillar]}</CardTitle>
                    </div>
                    <span className="text-sm font-semibold text-muted-foreground">
                      {pillar.score}/100
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">{pillar.headline}</p>
                </CardHeader>
                <CardContent className="space-y-4">
                  {pillar.findings.map((finding) => (
                    <div key={finding.title} className="space-y-1 border-l-2 border-border pl-3">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-medium">{finding.title}</p>
                        <Badge variant={SEVERITY_VARIANT[finding.severity]}>
                          {t.severity[finding.severity]}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{finding.rationale}</p>
                      <p className="text-sm">
                        <span className="font-medium">{t.action}:</span> {finding.recommendedAction}
                      </p>
                      <p className="text-xs text-accent-strong">
                        {t.impact}: {finding.estimatedImpact}
                      </p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      <section className="flex flex-col items-center gap-5 rounded-lg bg-primary px-6 py-12 text-center text-primary-foreground">
        <h2 className="max-w-xl text-2xl font-bold tracking-tight sm:text-3xl">{t.cta.title}</h2>
        <p className="max-w-xl text-primary-foreground/90">{t.cta.body}</p>
        <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
          <Link
            href="/signup"
            className={cn(buttonVariants({ variant: "accent", size: "lg" }), "w-full sm:w-auto")}
          >
            {t.cta.primary}
          </Link>
          <Link
            href="/pricing"
            className={cn(
              buttonVariants({ variant: "outline", size: "lg" }),
              "w-full border-primary-foreground/30 bg-transparent text-primary-foreground hover:bg-primary-foreground/10 sm:w-auto",
            )}
          >
            {t.cta.secondary}
          </Link>
        </div>
      </section>

      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>
          {t.poweredBy} · {t.confidence}: {formatPercent(report.confidence)}
        </span>
        {onReset ? (
          <Button variant="ghost" size="sm" onClick={onReset}>
            {t.again}
          </Button>
        ) : null}
      </div>
    </div>
  );
}

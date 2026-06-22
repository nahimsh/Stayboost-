import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Badge, buttonVariants, cn } from "@stayboost/ui";
import { getDictionary } from "@stayboost/i18n";

const t = getDictionary().landing.hero;

export function Hero(): React.JSX.Element {
  return (
    <section className="relative overflow-hidden border-b">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_50%_at_50%_0%,hsl(var(--primary)/0.12),transparent)]"
      />
      <div className="container relative flex flex-col items-center gap-6 py-20 text-center md:py-28">
        <Badge variant="accent">{t.eyebrow}</Badge>
        <h1 className="max-w-3xl text-balance text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
          {t.title}
        </h1>
        <p className="max-w-2xl text-pretty text-lg text-muted-foreground">{t.subtitle}</p>
        <div className="flex w-full flex-col items-center gap-3 sm:w-auto sm:flex-row">
          <Link href="/analyzer" className={cn(buttonVariants({ size: "lg" }), "w-full sm:w-auto")}>
            {t.primaryCta}
            <ArrowRight aria-hidden />
          </Link>
          <Link
            href="/demo"
            className={cn(buttonVariants({ variant: "outline", size: "lg" }), "w-full sm:w-auto")}
          >
            {t.demoCta}
          </Link>
          <Link
            href="/#how"
            className={cn(buttonVariants({ variant: "ghost", size: "lg" }), "w-full sm:w-auto")}
          >
            {t.secondaryCta}
          </Link>
        </div>
        <p className="text-sm text-muted-foreground">{t.trust}</p>
      </div>
    </section>
  );
}

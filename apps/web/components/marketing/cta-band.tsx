import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { buttonVariants, cn } from "@stayboost/ui";
import { getDictionary } from "@stayboost/i18n";

const t = getDictionary().landing;

/** Mid-page analyzer + pricing teasers and the closing call to action. */
export function CtaBand(): React.JSX.Element {
  return (
    <section className="py-20">
      <div className="container grid gap-6 lg:grid-cols-2">
        <article className="flex flex-col gap-4 rounded-lg border bg-card p-8">
          <h2 className="text-2xl font-bold tracking-tight">{t.analyzerTeaser.title}</h2>
          <p className="text-muted-foreground">{t.analyzerTeaser.body}</p>
          <Link href="/analyzer" className={cn(buttonVariants(), "mt-auto w-fit")}>
            {t.analyzerTeaser.cta}
            <ArrowRight aria-hidden />
          </Link>
        </article>
        <article className="flex flex-col gap-4 rounded-lg border bg-card p-8">
          <h2 className="text-2xl font-bold tracking-tight">{t.pricingTeaser.title}</h2>
          <p className="text-muted-foreground">{t.pricingTeaser.body}</p>
          <Link
            href="/pricing"
            className={cn(buttonVariants({ variant: "outline" }), "mt-auto w-fit")}
          >
            {t.pricingTeaser.cta}
          </Link>
        </article>
      </div>

      <div className="container mt-6">
        <div className="flex flex-col items-center gap-5 rounded-lg bg-primary px-6 py-14 text-center text-primary-foreground">
          <h2 className="max-w-2xl text-3xl font-bold tracking-tight sm:text-4xl">
            {t.finalCta.title}
          </h2>
          <p className="max-w-xl text-primary-foreground/90">{t.finalCta.body}</p>
          <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
            <Link
              href="/analyzer"
              className={cn(buttonVariants({ variant: "accent", size: "lg" }), "w-full sm:w-auto")}
            >
              {t.finalCta.primary}
            </Link>
            <Link
              href="/contact"
              className={cn(
                buttonVariants({ variant: "outline", size: "lg" }),
                "w-full border-primary-foreground/30 bg-transparent text-primary-foreground hover:bg-primary-foreground/10 sm:w-auto",
              )}
            >
              {t.finalCta.secondary}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

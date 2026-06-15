import type { Metadata } from "next";
import { getDictionary } from "@stayboost/i18n";
import { PricingPlans } from "@/components/pricing/pricing-plans";
import { FeatureMatrix } from "@/components/pricing/feature-matrix";
import { PricingFaq } from "@/components/pricing/pricing-faq";

const t = getDictionary().pricing;

export const metadata: Metadata = {
  title: t.meta.title,
  description: t.meta.description,
  alternates: { canonical: "/pricing" },
};

export default function PricingPage(): React.JSX.Element {
  return (
    <>
      <section className="border-b py-16 md:py-20">
        <div className="container space-y-10">
          <div className="mx-auto max-w-2xl space-y-3 text-center">
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">{t.hero.title}</h1>
            <p className="text-lg text-muted-foreground">{t.hero.subtitle}</p>
          </div>
          <PricingPlans />
        </div>
      </section>
      <FeatureMatrix />
      <PricingFaq />
    </>
  );
}

import type { Metadata } from "next";
import { Badge } from "@stayboost/ui";
import { getDictionary } from "@stayboost/i18n";
import { AnalyzerForm } from "@/components/analyzer/analyzer-form";

const t = getDictionary().analyzer;

export const metadata: Metadata = {
  title: t.meta.title,
  description: t.meta.description,
  alternates: { canonical: "/analyzer" },
};

export default function AnalyzerPage(): React.JSX.Element {
  return (
    <section className="py-16 md:py-20">
      <div className="container max-w-4xl space-y-10">
        <div className="space-y-3 text-center">
          <Badge variant="accent">{t.hero.eyebrow}</Badge>
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">{t.hero.title}</h1>
          <p className="mx-auto max-w-2xl text-lg text-muted-foreground">{t.hero.subtitle}</p>
        </div>
        <AnalyzerForm />
      </div>
    </section>
  );
}

import type { Metadata } from "next";
import { getDictionary } from "@stayboost/i18n";
import { ContactForm } from "@/components/contact/contact-form";

const t = getDictionary().contact;

export const metadata: Metadata = {
  title: t.meta.title,
  description: t.meta.description,
  alternates: { canonical: "/contact" },
};

export default function ContactPage(): React.JSX.Element {
  return (
    <section className="py-16 md:py-20">
      <div className="container grid gap-10 lg:grid-cols-2 lg:gap-16">
        <div className="space-y-4">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">{t.hero.title}</h1>
          <p className="text-lg text-muted-foreground">{t.hero.subtitle}</p>
        </div>
        <div className="lg:max-w-xl">
          <ContactForm />
        </div>
      </div>
    </section>
  );
}

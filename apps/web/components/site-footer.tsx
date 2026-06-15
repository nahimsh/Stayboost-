import Link from "next/link";
import { getDictionary } from "@stayboost/i18n";

const t = getDictionary().common;

const SECTIONS = [
  {
    heading: t.footer.product,
    links: [
      { href: "/#features", label: t.nav.features },
      { href: "/pricing", label: t.nav.pricing },
      { href: "/analyzer", label: t.nav.analyzer },
    ],
  },
  {
    heading: t.footer.company,
    links: [{ href: "/contact", label: t.nav.contact }],
  },
] as const;

export function SiteFooter(): React.JSX.Element {
  const year = new Date().getUTCFullYear();
  return (
    <footer className="border-t bg-secondary/30">
      <div className="container grid gap-8 py-12 sm:grid-cols-2 md:grid-cols-4">
        <div className="space-y-2">
          <p className="text-lg font-bold">{t.brand}</p>
          <p className="max-w-xs text-sm text-muted-foreground">{t.footer.builtFor}</p>
        </div>
        {SECTIONS.map((section) => (
          <nav key={section.heading} aria-label={section.heading} className="space-y-3">
            <p className="text-sm font-semibold">{section.heading}</p>
            <ul className="space-y-2">
              {section.links.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>
      <div className="border-t">
        <div className="container flex h-14 items-center text-xs text-muted-foreground">
          © {year} {t.brand}. {t.footer.rights}
        </div>
      </div>
    </footer>
  );
}

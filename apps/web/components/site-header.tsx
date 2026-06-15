"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { buttonVariants, cn } from "@stayboost/ui";
import { getDictionary } from "@stayboost/i18n";

const t = getDictionary().common;

const NAV_LINKS = [
  { href: "/#features", label: t.nav.features },
  { href: "/pricing", label: t.nav.pricing },
  { href: "/analyzer", label: t.nav.analyzer },
  { href: "/contact", label: t.nav.contact },
] as const;

export function SiteHeader(): React.JSX.Element {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between gap-4">
        <Link href="/" className="text-lg font-bold tracking-tight" onClick={() => setOpen(false)}>
          {t.brand}
        </Link>

        <nav aria-label="Primary" className="hidden items-center gap-1 md:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          <Link href="/login" className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}>
            {t.nav.login}
          </Link>
          <Link href="/signup" className={cn(buttonVariants({ size: "sm" }))}>
            {t.nav.signup}
          </Link>
        </div>

        <button
          type="button"
          className="inline-flex size-11 items-center justify-center rounded-md md:hidden"
          aria-expanded={open}
          aria-controls="mobile-nav"
          aria-label={open ? "Close menu" : "Open menu"}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X aria-hidden /> : <Menu aria-hidden />}
        </button>
      </div>

      {open ? (
        <nav
          id="mobile-nav"
          aria-label="Mobile"
          className="container flex flex-col gap-1 border-t py-4 md:hidden"
        >
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className="rounded-md px-3 py-3 text-base font-medium hover:bg-secondary"
            >
              {link.label}
            </Link>
          ))}
          <div className="mt-2 grid grid-cols-2 gap-2">
            <Link
              href="/login"
              onClick={() => setOpen(false)}
              className={cn(buttonVariants({ variant: "outline" }))}
            >
              {t.nav.login}
            </Link>
            <Link href="/signup" onClick={() => setOpen(false)} className={cn(buttonVariants())}>
              {t.nav.signup}
            </Link>
          </div>
        </nav>
      ) : null}
    </header>
  );
}

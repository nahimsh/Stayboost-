import Link from "next/link";
import { getDictionary } from "@stayboost/i18n";

export default function AuthLayout({
  children,
}: {
  readonly children: React.ReactNode;
}): React.JSX.Element {
  const t = getDictionary().common;
  return (
    <div className="flex min-h-dvh flex-col bg-secondary/30">
      <header className="container flex h-16 items-center">
        <Link href="/" className="text-lg font-bold tracking-tight">
          {t.brand}
        </Link>
      </header>
      <main className="flex flex-1 items-center justify-center px-4 py-10">
        <div className="w-full max-w-md">{children}</div>
      </main>
    </div>
  );
}

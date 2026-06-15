"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";
import { magicLinkRequestInputSchema } from "@stayboost/domain";
import { Button, Input, buttonVariants, cn } from "@stayboost/ui";
import { getDictionary } from "@stayboost/i18n";
import { api } from "@/lib/api";
import { AuthCard, AuthField } from "./auth-card";

const t = getDictionary().auth;

type Mode = "request" | "sent" | "consuming" | "error";

export function MagicLinkView(): React.JSX.Element {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("request");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // If we arrived with a token, consume it to log in.
  useEffect(() => {
    const token = new URLSearchParams(window.location.search).get("token");
    if (!token) return;
    setMode("consuming");
    api.auth
      .consumeMagicLink({ token })
      .then(() => router.push("/dashboard"))
      .catch(() => setMode("error"));
  }, [router]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    const parsed = magicLinkRequestInputSchema.safeParse(
      Object.fromEntries(new FormData(event.currentTarget)),
    );
    if (!parsed.success) {
      setError(t.common.invalidFields);
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      await api.auth.requestMagicLink(parsed.data);
    } catch {
      // Neutral confirmation regardless.
    }
    setMode("sent");
  }

  if (mode === "consuming") {
    return (
      <AuthCard title={t.magic.loggingIn}>
        <div className="flex justify-center py-4" role="status" aria-label={t.magic.loggingIn}>
          <Loader2 className="size-8 animate-spin text-primary" aria-hidden />
        </div>
      </AuthCard>
    );
  }

  if (mode === "error") {
    return (
      <AuthCard title={t.magic.errorTitle}>
        <div className="flex flex-col items-center gap-4 text-center">
          <XCircle className="size-10 text-destructive" aria-hidden />
          <p className="text-sm text-muted-foreground">{t.magic.errorBody}</p>
          <Link href="/magic-link" className={cn(buttonVariants({ variant: "outline" }), "w-full")}>
            {t.magic.backToLogin}
          </Link>
        </div>
      </AuthCard>
    );
  }

  if (mode === "sent") {
    return (
      <AuthCard title={t.magic.sentTitle}>
        <div role="status" className="flex flex-col items-center gap-3 text-center">
          <CheckCircle2 className="size-10 text-success" aria-hidden />
          <p className="text-sm text-muted-foreground">{t.magic.sentBody}</p>
          <Link href="/login" className="text-sm font-medium text-primary hover:underline">
            {t.magic.backToLogin}
          </Link>
        </div>
      </AuthCard>
    );
  }

  return (
    <AuthCard title={t.magic.requestTitle} subtitle={t.magic.requestSubtitle}>
      <form noValidate onSubmit={handleSubmit} className="space-y-4">
        <AuthField id="email" label={t.common.emailLabel}>
          <Input id="email" name="email" type="email" inputMode="email" autoComplete="email" required />
        </AuthField>
        {error ? <p role="alert" className="text-sm text-destructive">{error}</p> : null}
        <Button type="submit" size="lg" className="w-full" disabled={submitting}>
          {submitting ? (
            <>
              <Loader2 className="animate-spin" aria-hidden /> {t.magic.requestSubmitting}
            </>
          ) : (
            t.magic.requestSubmit
          )}
        </Button>
      </form>
      <p className="mt-5 text-center text-sm">
        <Link href="/login" className="text-muted-foreground hover:text-foreground">
          {t.magic.backToLogin}
        </Link>
      </p>
    </AuthCard>
  );
}

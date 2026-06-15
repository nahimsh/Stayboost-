"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { CheckCircle2, Loader2 } from "lucide-react";
import { requestPasswordResetInputSchema } from "@stayboost/domain";
import { Button, Input } from "@stayboost/ui";
import { getDictionary } from "@stayboost/i18n";
import { api } from "@/lib/api";
import { AuthCard, AuthField } from "./auth-card";

const t = getDictionary().auth;

export function ForgotPasswordForm(): React.JSX.Element {
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    const parsed = requestPasswordResetInputSchema.safeParse(
      Object.fromEntries(new FormData(event.currentTarget)),
    );
    if (!parsed.success) {
      setError(t.common.invalidFields);
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      await api.auth.forgotPassword(parsed.data);
    } catch {
      // Intentionally ignore — we always show the same neutral confirmation.
    }
    setSent(true);
  }

  if (sent) {
    return (
      <AuthCard title={t.forgot.sentTitle}>
        <div role="status" className="flex flex-col items-center gap-3 text-center">
          <CheckCircle2 className="size-10 text-success" aria-hidden />
          <p className="text-sm text-muted-foreground">{t.forgot.sentBody}</p>
          <Link href="/login" className="text-sm font-medium text-primary hover:underline">
            {t.forgot.backToLogin}
          </Link>
        </div>
      </AuthCard>
    );
  }

  return (
    <AuthCard title={t.forgot.title} subtitle={t.forgot.subtitle}>
      <form noValidate onSubmit={handleSubmit} className="space-y-4">
        <AuthField id="email" label={t.common.emailLabel}>
          <Input id="email" name="email" type="email" inputMode="email" autoComplete="email" required />
        </AuthField>
        {error ? <p role="alert" className="text-sm text-destructive">{error}</p> : null}
        <Button type="submit" size="lg" className="w-full" disabled={submitting}>
          {submitting ? (
            <>
              <Loader2 className="animate-spin" aria-hidden /> {t.forgot.submitting}
            </>
          ) : (
            t.forgot.submit
          )}
        </Button>
      </form>
      <p className="mt-5 text-center text-sm">
        <Link href="/login" className="text-muted-foreground hover:text-foreground">
          {t.forgot.backToLogin}
        </Link>
      </p>
    </AuthCard>
  );
}

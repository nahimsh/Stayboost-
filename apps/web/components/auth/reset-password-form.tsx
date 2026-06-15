"use client";

import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import { CheckCircle2, Loader2 } from "lucide-react";
import { passwordSchema } from "@stayboost/domain";
import { ApiError } from "@stayboost/api-client";
import { Button, Input } from "@stayboost/ui";
import { getDictionary } from "@stayboost/i18n";
import { api } from "@/lib/api";
import { AuthCard, AuthField } from "./auth-card";

const t = getDictionary().auth;

export function ResetPasswordForm(): React.JSX.Element {
  const [token, setToken] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setToken(new URLSearchParams(window.location.search).get("token"));
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    if (!token) {
      setError(t.reset.missingToken);
      return;
    }
    const password = String(new FormData(event.currentTarget).get("password") ?? "");
    const parsed = passwordSchema.safeParse(password);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? t.common.invalidFields);
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      await api.auth.resetPassword({ token, password: parsed.data });
      setDone(true);
    } catch (error) {
      setError(error instanceof ApiError && error.status === 401 ? t.reset.invalidToken : t.common.genericError);
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <AuthCard title={t.reset.successTitle}>
        <div className="flex flex-col items-center gap-3 text-center">
          <CheckCircle2 className="size-10 text-success" aria-hidden />
          <p className="text-sm text-muted-foreground">{t.reset.successBody}</p>
          <Link href="/login" className="text-sm font-medium text-primary hover:underline">
            {t.reset.goToLogin}
          </Link>
        </div>
      </AuthCard>
    );
  }

  return (
    <AuthCard title={t.reset.title} subtitle={t.reset.subtitle}>
      <form noValidate onSubmit={handleSubmit} className="space-y-4">
        <AuthField id="password" label={t.common.passwordLabel} hint={t.signup.passwordHint}>
          <Input id="password" name="password" type="password" autoComplete="new-password" required />
        </AuthField>
        {error ? <p role="alert" className="text-sm text-destructive">{error}</p> : null}
        <Button type="submit" size="lg" className="w-full" disabled={submitting}>
          {submitting ? (
            <>
              <Loader2 className="animate-spin" aria-hidden /> {t.reset.submitting}
            </>
          ) : (
            t.reset.submit
          )}
        </Button>
      </form>
    </AuthCard>
  );
}

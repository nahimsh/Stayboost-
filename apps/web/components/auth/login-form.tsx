"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { Loader2 } from "lucide-react";
import { loginInputSchema } from "@stayboost/domain";
import { ApiError } from "@stayboost/api-client";
import { Button, Input } from "@stayboost/ui";
import { getDictionary } from "@stayboost/i18n";
import { api } from "@/lib/api";
import { AuthCard, AuthField } from "./auth-card";
import { AuthDivider, GoogleButton } from "./google-button";

const t = getDictionary().auth;

export function LoginForm(): React.JSX.Element {
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Surface OAuth callback failures (?error=oauth) without needing Suspense.
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("error") === "oauth") {
      setFormError(t.login.oauthError);
    }
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(event.currentTarget));
    const parsed = loginInputSchema.safeParse(data);
    if (!parsed.success) {
      setFormError(t.common.invalidFields);
      return;
    }
    setFormError(null);
    setSubmitting(true);
    try {
      await api.auth.login(parsed.data);
      router.push("/dashboard");
    } catch (error) {
      setFormError(error instanceof ApiError ? error.message : t.common.genericError);
      setSubmitting(false);
    }
  }

  return (
    <AuthCard title={t.login.title} subtitle={t.login.subtitle}>
      <GoogleButton />
      <AuthDivider />
      <form noValidate onSubmit={handleSubmit} className="space-y-4">
        <AuthField id="email" label={t.common.emailLabel}>
          <Input id="email" name="email" type="email" inputMode="email" autoComplete="email" required />
        </AuthField>
        <AuthField id="password" label={t.common.passwordLabel}>
          <Input id="password" name="password" type="password" autoComplete="current-password" required />
        </AuthField>

        {formError ? (
          <p role="alert" className="text-sm text-destructive">
            {formError}
          </p>
        ) : null}

        <Button type="submit" size="lg" className="w-full" disabled={submitting}>
          {submitting ? (
            <>
              <Loader2 className="animate-spin" aria-hidden /> {t.login.submitting}
            </>
          ) : (
            t.login.submit
          )}
        </Button>
      </form>
      <div className="mt-4 flex items-center justify-between text-sm">
        <Link href="/forgot-password" className="text-muted-foreground hover:text-foreground">
          {t.login.forgot}
        </Link>
        <Link href="/magic-link" className="text-muted-foreground hover:text-foreground">
          {t.login.magicLink}
        </Link>
      </div>
      <p className="mt-5 text-center text-sm text-muted-foreground">
        {t.login.noAccount}{" "}
        <Link href="/signup" className="font-medium text-primary hover:underline">
          {t.login.signup}
        </Link>
      </p>
      <p className="mt-4 border-t pt-4 text-center text-sm">
        <Link href="/demo" className="font-medium text-primary hover:underline">
          {t.login.demoCta}
        </Link>
      </p>
    </AuthCard>
  );
}

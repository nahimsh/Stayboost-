"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Loader2 } from "lucide-react";
import { signupInputSchema } from "@stayboost/domain";
import { ApiError } from "@stayboost/api-client";
import { Button, Input } from "@stayboost/ui";
import { getDictionary } from "@stayboost/i18n";
import { api } from "@/lib/api";
import { AuthCard, AuthField } from "./auth-card";
import { AuthDivider, GoogleButton } from "./google-button";

const t = getDictionary().auth;

export function SignupForm(): React.JSX.Element {
  const router = useRouter();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(event.currentTarget));
    const parsed = signupInputSchema.safeParse(data);
    if (!parsed.success) {
      const next: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0];
        if (typeof key === "string" && !next[key]) next[key] = issue.message;
      }
      setErrors(next);
      setFormError(t.common.invalidFields);
      return;
    }
    setErrors({});
    setFormError(null);
    setSubmitting(true);
    try {
      await api.auth.signup(parsed.data);
      router.push("/dashboard");
    } catch (error) {
      if (error instanceof ApiError && error.status === 409) {
        setErrors({ email: error.title });
      }
      setFormError(error instanceof ApiError ? error.message : t.common.genericError);
      setSubmitting(false);
    }
  }

  return (
    <AuthCard title={t.signup.title} subtitle={t.signup.subtitle}>
      <GoogleButton />
      <AuthDivider />
      <form noValidate onSubmit={handleSubmit} className="space-y-4">
        <AuthField id="name" label={t.common.nameLabel} error={errors.name}>
          <Input id="name" name="name" autoComplete="name" required />
        </AuthField>
        <AuthField id="organizationName" label={t.common.orgLabel} error={errors.organizationName}>
          <Input id="organizationName" name="organizationName" autoComplete="organization" required />
        </AuthField>
        <AuthField id="email" label={t.common.emailLabel} error={errors.email}>
          <Input id="email" name="email" type="email" inputMode="email" autoComplete="email" required />
        </AuthField>
        <AuthField id="password" label={t.common.passwordLabel} hint={t.signup.passwordHint} error={errors.password}>
          <Input id="password" name="password" type="password" autoComplete="new-password" required />
        </AuthField>

        {formError ? (
          <p role="alert" className="text-sm text-destructive">
            {formError}
          </p>
        ) : null}

        <Button type="submit" size="lg" className="w-full" disabled={submitting}>
          {submitting ? (
            <>
              <Loader2 className="animate-spin" aria-hidden /> {t.signup.submitting}
            </>
          ) : (
            t.signup.submit
          )}
        </Button>
      </form>
      <p className="mt-5 text-center text-sm text-muted-foreground">
        {t.signup.haveAccount}{" "}
        <Link href="/login" className="font-medium text-primary hover:underline">
          {t.signup.login}
        </Link>
      </p>
    </AuthCard>
  );
}

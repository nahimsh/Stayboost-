"use client";

import { useState, type FormEvent } from "react";
import { CheckCircle2 } from "lucide-react";
import { CONTACT_REASONS, contactLeadInputSchema, type ContactReason } from "@stayboost/domain";
import { ApiError } from "@stayboost/api-client";
import { Button, Input, Label, Select, Textarea } from "@stayboost/ui";
import { getDictionary } from "@stayboost/i18n";
import { api } from "@/lib/api";

const t = getDictionary().contact;

type Status =
  | { kind: "idle" }
  | { kind: "submitting" }
  | { kind: "success" }
  | { kind: "error"; message: string };

type FieldErrors = Partial<Record<string, string>>;

export function ContactForm(): React.JSX.Element {
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const [errors, setErrors] = useState<FieldErrors>({});

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const raw = Object.fromEntries(form.entries());

    const parsed = contactLeadInputSchema.safeParse({
      ...raw,
      propertyCount: raw.propertyCount === "" ? undefined : raw.propertyCount,
      company: raw.company === "" ? undefined : raw.company,
    });
    if (!parsed.success) {
      const next: FieldErrors = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0];
        if (typeof key === "string" && !next[key]) next[key] = issue.message;
      }
      setErrors(next);
      setStatus({ kind: "error", message: t.error.required });
      return;
    }

    setErrors({});
    setStatus({ kind: "submitting" });
    try {
      await api.contact.submit(parsed.data);
      setStatus({ kind: "success" });
    } catch (error) {
      if (error instanceof ApiError && error.fieldErrors.length > 0) {
        const next: FieldErrors = {};
        for (const fe of error.fieldErrors) next[fe.field] = fe.message;
        setErrors(next);
      }
      setStatus({ kind: "error", message: t.error.generic });
    }
  }

  if (status.kind === "success") {
    return (
      <div role="status" className="flex flex-col items-center gap-4 rounded-lg border bg-card p-10 text-center">
        <CheckCircle2 className="size-12 text-success" aria-hidden />
        <h2 className="text-xl font-semibold">{t.success.title}</h2>
        <p className="text-muted-foreground">{t.success.body}</p>
        <Button variant="outline" onClick={() => setStatus({ kind: "idle" })}>
          {t.success.again}
        </Button>
      </div>
    );
  }

  const submitting = status.kind === "submitting";

  return (
    <form noValidate onSubmit={handleSubmit} className="space-y-5">
      <Field id="name" label={t.form.name} error={errors.name}>
        <Input id="name" name="name" autoComplete="name" required aria-invalid={Boolean(errors.name)} />
      </Field>
      <Field id="email" label={t.form.email} error={errors.email}>
        <Input id="email" name="email" type="email" inputMode="email" autoComplete="email" required aria-invalid={Boolean(errors.email)} />
      </Field>
      <div className="grid gap-5 sm:grid-cols-2">
        <Field id="company" label={t.form.company} error={errors.company}>
          <Input id="company" name="company" autoComplete="organization" />
        </Field>
        <Field id="propertyCount" label={t.form.propertyCount} error={errors.propertyCount}>
          <Input id="propertyCount" name="propertyCount" type="number" inputMode="numeric" min={0} />
        </Field>
      </div>
      <Field id="reason" label={t.form.reason} error={errors.reason}>
        <Select id="reason" name="reason" defaultValue={"sales" satisfies ContactReason}>
          {CONTACT_REASONS.map((reason) => (
            <option key={reason} value={reason}>
              {t.form.reasons[reason]}
            </option>
          ))}
        </Select>
      </Field>
      <Field id="message" label={t.form.message} error={errors.message}>
        <Textarea id="message" name="message" placeholder={t.form.messagePlaceholder} required aria-invalid={Boolean(errors.message)} />
      </Field>

      {/* Honeypot: hidden from users, catches bots. */}
      <div aria-hidden className="hidden">
        <label htmlFor="website">Website</label>
        <input id="website" name="website" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      {status.kind === "error" ? (
        <p role="alert" className="text-sm text-destructive">
          {status.message}
        </p>
      ) : null}

      <Button type="submit" size="lg" disabled={submitting} className="w-full sm:w-auto">
        {submitting ? t.form.submitting : t.form.submit}
      </Button>
    </form>
  );
}

function Field({
  id,
  label,
  error,
  children,
}: {
  readonly id: string;
  readonly label: string;
  readonly error?: string | undefined;
  readonly children: React.ReactNode;
}): React.JSX.Element {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      {children}
      {error ? (
        <p id={`${id}-error`} className="text-sm text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  );
}

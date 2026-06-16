"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2 } from "lucide-react";
import { PROPERTY_TYPES, propertySetupInputSchema } from "@stayboost/domain";
import { Button, Input, Label, Select, cn } from "@stayboost/ui";
import { getDictionary } from "@stayboost/i18n";
import { api } from "@/lib/api";

const t = getDictionary().onboarding;
const typeLabels = getDictionary().analyzer.propertyTypes;

type StepId = "basics" | "channels" | "capacity";
const STEPS: StepId[] = ["basics", "channels", "capacity"];

interface Values {
  name: string;
  type: string;
  country: string;
  city: string;
  airbnbUrl: string;
  bookingUrl: string;
  websiteUrl: string;
  roomsCount: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
}

const INITIAL: Values = {
  name: "",
  type: "villa",
  country: "",
  city: "",
  airbnbUrl: "",
  bookingUrl: "",
  websiteUrl: "",
  roomsCount: "1",
  contactName: "",
  contactEmail: "",
  contactPhone: "",
};

export function OnboardingWizard(): React.JSX.Element {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [values, setValues] = useState<Values>(INITIAL);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Gate: send already-onboarded users to the dashboard; unauthenticated to login.
  useEffect(() => {
    api.auth
      .me()
      .then((user) => {
        if (user.onboardingComplete) router.replace("/dashboard");
        else setReady(true);
      })
      .catch(() => router.replace("/login"));
  }, [router]);

  const step = STEPS[stepIndex] as StepId;
  const set = (key: keyof Values) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setValues((v) => ({ ...v, [key]: e.target.value }));

  function canAdvance(): boolean {
    if (step === "basics") return values.name.trim().length >= 2 && !!values.country.trim() && !!values.city.trim();
    if (step === "capacity") return Number(values.roomsCount) >= 1;
    return true;
  }

  function next(): void {
    if (!canAdvance()) {
      setError(t.error);
      return;
    }
    setError(null);
    setStepIndex((i) => Math.min(i + 1, STEPS.length - 1));
  }

  async function finish(): Promise<void> {
    const parsed = propertySetupInputSchema.safeParse(values);
    if (!parsed.success) {
      setError(t.error);
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      await api.properties.create(parsed.data);
      router.replace("/dashboard");
    } catch {
      setError(t.error);
      setSubmitting(false);
    }
  }

  if (!ready) {
    return (
      <div className="flex min-h-dvh items-center justify-center" role="status" aria-label="Loading">
        <Loader2 className="size-8 animate-spin text-primary" aria-hidden />
      </div>
    );
  }

  return (
    <div className="flex min-h-dvh flex-col bg-secondary/30">
      <header className="container flex h-16 items-center">
        <span className="text-lg font-bold tracking-tight">{getDictionary().common.brand}</span>
      </header>
      <main className="flex flex-1 items-start justify-center px-4 py-6 sm:items-center sm:py-10">
        <div className="w-full max-w-xl">
          <div className="mb-6 space-y-2 text-center">
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{t.title}</h1>
            <p className="text-sm text-muted-foreground">{t.subtitle}</p>
          </div>

          <ol className="mb-6 flex items-center gap-2" aria-label={t.stepLabel.replace("{current}", String(stepIndex + 1)).replace("{total}", String(STEPS.length))}>
            {STEPS.map((s, i) => (
              <li key={s} className="flex flex-1 items-center gap-2">
                <span
                  className={cn(
                    "flex size-7 shrink-0 items-center justify-center rounded-full border text-xs font-semibold",
                    i < stepIndex && "border-primary bg-primary text-primary-foreground",
                    i === stepIndex && "border-primary text-primary",
                    i > stepIndex && "border-border text-muted-foreground",
                  )}
                >
                  {i < stepIndex ? <Check className="size-4" aria-hidden /> : i + 1}
                </span>
                <span className="hidden text-sm font-medium sm:inline">{t.steps[s]}</span>
                {i < STEPS.length - 1 ? <span className="h-px flex-1 bg-border" /> : null}
              </li>
            ))}
          </ol>

          <div className="rounded-lg border bg-card p-6 shadow-sm">
            {step === "basics" ? <BasicsStep values={values} set={set} /> : null}
            {step === "channels" ? <ChannelsStep values={values} set={set} /> : null}
            {step === "capacity" ? <CapacityStep values={values} set={set} /> : null}

            {error ? <p role="alert" className="mt-4 text-sm text-destructive">{error}</p> : null}

            <div className="mt-6 flex items-center justify-between gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setStepIndex((i) => Math.max(0, i - 1))}
                disabled={stepIndex === 0 || submitting}
              >
                {t.back}
              </Button>
              {stepIndex < STEPS.length - 1 ? (
                <Button type="button" onClick={next}>
                  {t.next}
                </Button>
              ) : (
                <Button type="button" onClick={finish} disabled={submitting}>
                  {submitting ? (
                    <>
                      <Loader2 className="animate-spin" aria-hidden /> {t.finishing}
                    </>
                  ) : (
                    t.finish
                  )}
                </Button>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

type StepProps = {
  values: Values;
  set: (key: keyof Values) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
};

function Field({ id, label, optional, children }: { id: string; label: string; optional?: boolean; children: React.ReactNode }): React.JSX.Element {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>
        {label}
        {optional ? <span className="ml-1 text-xs font-normal text-muted-foreground">({t.fields.optional})</span> : null}
      </Label>
      {children}
    </div>
  );
}

function BasicsStep({ values, set }: StepProps): React.JSX.Element {
  return (
    <div className="space-y-4">
      <Field id="name" label={t.fields.name}>
        <Input id="name" value={values.name} onChange={set("name")} required />
      </Field>
      <Field id="type" label={t.fields.type}>
        <Select id="type" value={values.type} onChange={set("type")}>
          {PROPERTY_TYPES.map((type) => (
            <option key={type} value={type}>
              {typeLabels[type]}
            </option>
          ))}
        </Select>
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field id="country" label={t.fields.country}>
          <Input id="country" value={values.country} onChange={set("country")} autoComplete="country-name" required />
        </Field>
        <Field id="city" label={t.fields.city}>
          <Input id="city" value={values.city} onChange={set("city")} required />
        </Field>
      </div>
    </div>
  );
}

function ChannelsStep({ values, set }: StepProps): React.JSX.Element {
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">{t.channelsHint}</p>
      <Field id="airbnbUrl" label={t.fields.airbnbUrl} optional>
        <Input id="airbnbUrl" type="url" inputMode="url" placeholder="https://airbnb.com/rooms/…" value={values.airbnbUrl} onChange={set("airbnbUrl")} />
      </Field>
      <Field id="bookingUrl" label={t.fields.bookingUrl} optional>
        <Input id="bookingUrl" type="url" inputMode="url" placeholder="https://booking.com/hotel/…" value={values.bookingUrl} onChange={set("bookingUrl")} />
      </Field>
      <Field id="websiteUrl" label={t.fields.websiteUrl} optional>
        <Input id="websiteUrl" type="url" inputMode="url" placeholder="https://…" value={values.websiteUrl} onChange={set("websiteUrl")} />
      </Field>
    </div>
  );
}

function CapacityStep({ values, set }: StepProps): React.JSX.Element {
  return (
    <div className="space-y-4">
      <Field id="roomsCount" label={t.fields.roomsCount}>
        <Input id="roomsCount" type="number" inputMode="numeric" min={1} value={values.roomsCount} onChange={set("roomsCount")} required />
      </Field>
      <Field id="contactName" label={t.fields.contactName} optional>
        <Input id="contactName" value={values.contactName} onChange={set("contactName")} autoComplete="name" />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field id="contactEmail" label={t.fields.contactEmail} optional>
          <Input id="contactEmail" type="email" inputMode="email" value={values.contactEmail} onChange={set("contactEmail")} autoComplete="email" />
        </Field>
        <Field id="contactPhone" label={t.fields.contactPhone} optional>
          <Input id="contactPhone" type="tel" inputMode="tel" value={values.contactPhone} onChange={set("contactPhone")} autoComplete="tel" />
        </Field>
      </div>
    </div>
  );
}

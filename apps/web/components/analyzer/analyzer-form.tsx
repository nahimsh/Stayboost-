"use client";

import { useState, type FormEvent } from "react";
import { Loader2 } from "lucide-react";
import {
  CHALLENGES,
  CHANNELS,
  PROPERTY_TYPES,
  propertyProfileInputSchema,
  type GrowthReport,
} from "@stayboost/domain";
import { Button, Input, Label, Select } from "@stayboost/ui";
import { toMinorUnits } from "@stayboost/utils";
import { getDictionary } from "@stayboost/i18n";
import { api } from "@/lib/api";
import { GrowthReportView } from "./growth-report-view";

const t = getDictionary().analyzer;

type Status =
  | { kind: "idle" }
  | { kind: "analyzing" }
  | { kind: "done"; report: GrowthReport }
  | { kind: "error" };

function optionalNumber(value: FormDataEntryValue | null): number | undefined {
  if (value === null || String(value).trim() === "") return undefined;
  return Number(value);
}

export function AnalyzerForm(): React.JSX.Element {
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const [fieldError, setFieldError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const currency = String(form.get("currency") ?? "").toUpperCase();
    const rateMajor = optionalNumber(form.get("avgNightlyRate"));

    const raw = {
      propertyName: form.get("propertyName"),
      propertyType: form.get("propertyType"),
      country: form.get("country"),
      city: form.get("city"),
      unitsCount: form.get("unitsCount"),
      currency,
      avgNightlyRateMinor:
        rateMajor !== undefined && /^[A-Z]{3}$/.test(currency)
          ? toMinorUnits(rateMajor, currency)
          : undefined,
      occupancyPctLast30: optionalNumber(form.get("occupancyPctLast30")),
      channels: form.getAll("channels"),
      reviewScore: optionalNumber(form.get("reviewScore")),
      reviewResponseRatePct: optionalNumber(form.get("reviewResponseRatePct")),
      avgResponseTimeHours: optionalNumber(form.get("avgResponseTimeHours")),
      biggestChallenge: form.get("biggestChallenge"),
    };

    const parsed = propertyProfileInputSchema.safeParse(raw);
    if (!parsed.success) {
      setFieldError(t.error.required);
      setStatus({ kind: "error" });
      return;
    }

    setFieldError(null);
    setStatus({ kind: "analyzing" });
    try {
      const result = await api.analyzer.run(parsed.data);
      setStatus({ kind: "done", report: result.report });
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (error) {
      // Surface the real cause (network/CORS vs. API error) in the console so
      // production failures are diagnosable from the browser dev tools.
      // eslint-disable-next-line no-console
      console.error("Analyzer request failed:", error);
      setStatus({ kind: "error" });
    }
  }

  if (status.kind === "done") {
    return <GrowthReportView report={status.report} onReset={() => setStatus({ kind: "idle" })} />;
  }

  const analyzing = status.kind === "analyzing";

  return (
    <form onSubmit={handleSubmit} className="space-y-8" aria-busy={analyzing}>
      <fieldset className="space-y-5" disabled={analyzing}>
        <legend className="text-lg font-semibold">{t.form.sectionBasics}</legend>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field id="propertyName" label={t.form.propertyName}>
            <Input id="propertyName" name="propertyName" required />
          </Field>
          <Field id="propertyType" label={t.form.propertyType}>
            <Select id="propertyType" name="propertyType" defaultValue="villa">
              {PROPERTY_TYPES.map((type) => (
                <option key={type} value={type}>
                  {t.propertyTypes[type]}
                </option>
              ))}
            </Select>
          </Field>
          <Field id="country" label={t.form.country}>
            <Input id="country" name="country" autoComplete="country-name" required />
          </Field>
          <Field id="city" label={t.form.city}>
            <Input id="city" name="city" required />
          </Field>
          <Field id="unitsCount" label={t.form.unitsCount}>
            <Input id="unitsCount" name="unitsCount" type="number" inputMode="numeric" min={1} defaultValue={1} required />
          </Field>
          <Field id="currency" label={t.form.currency}>
            <Input id="currency" name="currency" maxLength={3} defaultValue="USD" required className="uppercase" />
          </Field>
        </div>

        <fieldset className="space-y-2">
          <legend className="text-sm font-medium">{t.form.channels}</legend>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {CHANNELS.map((channel) => (
              <label
                key={channel}
                className="flex items-center gap-2 rounded-md border p-3 text-sm has-[:checked]:border-primary has-[:checked]:bg-primary/5"
              >
                <input type="checkbox" name="channels" value={channel} className="size-4" />
                {t.channels[channel]}
              </label>
            ))}
          </div>
        </fieldset>

        <Field id="biggestChallenge" label={t.form.biggestChallenge}>
          <Select id="biggestChallenge" name="biggestChallenge" defaultValue="more_bookings">
            {CHALLENGES.map((challenge) => (
              <option key={challenge} value={challenge}>
                {t.challenges[challenge]}
              </option>
            ))}
          </Select>
        </Field>
      </fieldset>

      <fieldset className="space-y-5" disabled={analyzing}>
        <legend className="text-lg font-semibold">{t.form.sectionPerformance}</legend>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <Field id="avgNightlyRate" label={t.form.avgNightlyRate}>
            <Input id="avgNightlyRate" name="avgNightlyRate" type="number" inputMode="decimal" min={0} step="0.01" />
          </Field>
          <Field id="occupancyPctLast30" label={t.form.occupancy}>
            <Input id="occupancyPctLast30" name="occupancyPctLast30" type="number" inputMode="numeric" min={0} max={100} />
          </Field>
          <Field id="reviewScore" label={t.form.reviewScore}>
            <Input id="reviewScore" name="reviewScore" type="number" inputMode="decimal" min={0} max={5} step="0.1" />
          </Field>
          <Field id="reviewResponseRatePct" label={t.form.reviewResponseRate}>
            <Input id="reviewResponseRatePct" name="reviewResponseRatePct" type="number" inputMode="numeric" min={0} max={100} />
          </Field>
          <Field id="avgResponseTimeHours" label={t.form.responseTime}>
            <Input id="avgResponseTimeHours" name="avgResponseTimeHours" type="number" inputMode="decimal" min={0} step="0.5" />
          </Field>
        </div>
      </fieldset>

      {status.kind === "error" ? (
        <p role="alert" className="text-sm text-destructive">
          {fieldError ?? t.error.generic}
        </p>
      ) : null}

      <div className="space-y-2">
        <Button type="submit" size="lg" disabled={analyzing} className="w-full sm:w-auto">
          {analyzing ? (
            <>
              <Loader2 className="animate-spin" aria-hidden /> {t.form.analyzing}
            </>
          ) : (
            t.form.submit
          )}
        </Button>
        {analyzing ? <p className="text-sm text-muted-foreground">{t.form.analyzingHint}</p> : null}
      </div>
    </form>
  );
}

function Field({
  id,
  label,
  children,
}: {
  readonly id: string;
  readonly label: string;
  readonly children: React.ReactNode;
}): React.JSX.Element {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      {children}
    </div>
  );
}

"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plug } from "lucide-react";
import {
  CHANNEL_PROVIDERS,
  createChannelConnectionInputSchema,
  type ChannelConnection,
  type ChannelProvider,
  type PropertySummary,
} from "@stayboost/domain";
import { Button, Input, Label, Select } from "@stayboost/ui";
import { getDictionary } from "@stayboost/i18n";
import { api } from "@/lib/api";
import { ConnectionCard } from "./connection-card";

const t = getDictionary().channels;

type State =
  | { kind: "loading" }
  | { kind: "ready"; properties: PropertySummary[]; connections: ChannelConnection[] }
  | { kind: "error" };

export function ChannelConnectCenter(): React.JSX.Element {
  const router = useRouter();
  const [state, setState] = useState<State>({ kind: "loading" });
  const [provider, setProvider] = useState<ChannelProvider>("airbnb");
  const [connecting, setConnecting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const [properties, connections] = await Promise.all([api.properties.list(), api.channels.list()]);
    setState({ kind: "ready", properties, connections });
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const user = await api.auth.me();
        if (!user.onboardingComplete) {
          router.replace("/onboarding");
          return;
        }
        await load();
      } catch {
        setState((s) => (s.kind === "ready" ? s : { kind: "error" }));
      }
    })();
  }, [router, load]);

  async function connect(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    if (state.kind !== "ready") return;
    const propertyId = state.properties[0]?.id;
    if (!propertyId) {
      setFormError(t.needsProperty);
      return;
    }
    const icalUrl = String(new FormData(event.currentTarget).get("icalUrl") ?? "");
    const parsed = createChannelConnectionInputSchema.safeParse({ propertyId, provider, icalUrl });
    if (!parsed.success) {
      setFormError(t.connect.error);
      return;
    }
    setFormError(null);
    setConnecting(true);
    try {
      await api.channels.create(parsed.data);
      await load();
      (event.target as HTMLFormElement).reset();
    } catch {
      setFormError(t.connect.error);
    } finally {
      setConnecting(false);
    }
  }

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">{t.title}</h1>
        <p className="text-muted-foreground">{t.subtitle}</p>
      </header>

      {state.kind === "loading" ? (
        <div className="flex justify-center py-10" role="status" aria-label="Loading">
          <Loader2 className="size-8 animate-spin text-primary" aria-hidden />
        </div>
      ) : null}

      {state.kind === "error" ? <p className="text-sm text-destructive">{t.loadError}</p> : null}

      {state.kind === "ready" ? (
        <>
          <section className="rounded-xl border bg-card p-5 shadow-sm">
            <h2 className="mb-3 font-semibold">{t.connect.title}</h2>
            <form onSubmit={connect} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-[200px_1fr]">
                <div className="space-y-1.5">
                  <Label htmlFor="provider">{t.connect.provider}</Label>
                  <Select
                    id="provider"
                    value={provider}
                    onChange={(e) => setProvider(e.target.value as ChannelProvider)}
                  >
                    {CHANNEL_PROVIDERS.map((p) => (
                      <option key={p} value={p}>
                        {t.providers[p]}
                      </option>
                    ))}
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="icalUrl">{t.connect.icalUrl}</Label>
                  <Input id="icalUrl" name="icalUrl" type="url" inputMode="url" placeholder="https://…/calendar.ics" required />
                  <p className="text-xs text-muted-foreground">{t.connect.icalHint[provider]}</p>
                </div>
              </div>
              {formError ? <p role="alert" className="text-sm text-destructive">{formError}</p> : null}
              <Button type="submit" disabled={connecting}>
                {connecting ? <Loader2 className="animate-spin" aria-hidden /> : <Plug aria-hidden />}
                {connecting ? t.connect.connecting : t.connect.submit}
              </Button>
            </form>
          </section>

          {state.connections.length === 0 ? (
            <div className="rounded-xl border border-dashed bg-card p-8 text-center">
              <h2 className="font-semibold">{t.empty.title}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{t.empty.body}</p>
            </div>
          ) : (
            <section className="space-y-3">
              {state.connections.map((c) => (
                <ConnectionCard key={c.id} connection={c} onSynced={load} />
              ))}
            </section>
          )}
        </>
      ) : null}
    </div>
  );
}

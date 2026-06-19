"use client";

import { useState } from "react";
import { Loader2, RefreshCw } from "lucide-react";
import type { ChannelConnection, ConnectionHealth, SyncLog } from "@stayboost/domain";
import { Button, cn } from "@stayboost/ui";
import { getDictionary } from "@stayboost/i18n";
import { api } from "@/lib/api";
import { formatRelative } from "@/lib/dashboard-format";

const t = getDictionary().channels;

const HEALTH_TONE: Record<ConnectionHealth, string> = {
  healthy: "bg-success/10 text-success",
  stale: "bg-accent-strong/10 text-accent-strong",
  error: "bg-destructive/10 text-destructive",
  never_synced: "bg-muted text-muted-foreground",
};

export function ConnectionCard({
  connection,
  onSynced,
}: {
  readonly connection: ChannelConnection;
  readonly onSynced: () => void;
}): React.JSX.Element {
  const [syncing, setSyncing] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [logs, setLogs] = useState<SyncLog[] | "loading" | null>(null);

  async function sync(): Promise<void> {
    setSyncing(true);
    setResult(null);
    try {
      const r = await api.channels.sync(connection.id);
      setResult(
        t.card.syncResult
          .replace("{imported}", String(r.imported))
          .replace("{updated}", String(r.updated))
          .replace("{blocked}", String(r.blocked)),
      );
      if (logs && logs !== "loading") await loadLogs();
      onSynced();
    } catch {
      setResult(t.connect.error);
    } finally {
      setSyncing(false);
    }
  }

  async function loadLogs(): Promise<void> {
    setLogs("loading");
    try {
      setLogs(await api.channels.logs(connection.id));
    } catch {
      setLogs([]);
    }
  }

  function toggleLogs(): void {
    if (logs === null) void loadLogs();
    else setLogs(null);
  }

  return (
    <article className="rounded-xl border bg-card p-4 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold">{t.providers[connection.provider]}</h3>
            <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", HEALTH_TONE[connection.health])}>
              {t.health[connection.health]}
            </span>
          </div>
          <p className="mt-1 truncate text-xs text-muted-foreground" title={connection.icalUrl}>
            {connection.icalUrl}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {t.card.lastSynced}:{" "}
            {connection.lastSyncedAt ? formatRelative(connection.lastSyncedAt) : t.card.never}
          </p>
          {connection.lastError ? (
            <p className="mt-1 text-xs text-destructive">{connection.lastError}</p>
          ) : null}
        </div>
        <div className="flex shrink-0 gap-2">
          <Button size="sm" variant="outline" onClick={toggleLogs}>
            {logs === null ? t.card.viewLogs : t.card.hideLogs}
          </Button>
          <Button size="sm" onClick={sync} disabled={syncing}>
            {syncing ? <Loader2 className="animate-spin" aria-hidden /> : <RefreshCw aria-hidden />}
            {syncing ? t.card.syncing : t.card.syncNow}
          </Button>
        </div>
      </div>

      {result ? <p className="mt-2 text-sm text-foreground">{result}</p> : null}

      {logs !== null ? (
        <div className="mt-3 border-t pt-3">
          <p className="mb-2 text-xs font-semibold text-muted-foreground">{t.logs.title}</p>
          {logs === "loading" ? (
            <Loader2 className="size-4 animate-spin text-muted-foreground" aria-label="Loading" />
          ) : logs.length === 0 ? (
            <p className="text-xs text-muted-foreground">{t.logs.empty}</p>
          ) : (
            <ul className="space-y-1.5">
              {logs.map((log) => (
                <li key={log.id} className="flex items-center justify-between gap-3 text-xs">
                  <span className="text-muted-foreground">{formatRelative(log.createdAt)}</span>
                  <span className={log.status === "success" ? "text-success" : "text-destructive"}>
                    {log.status === "success" ? t.logs.success : t.logs.error}
                  </span>
                  <span className="text-muted-foreground">
                    {log.imported}/{log.updated}/{log.blocked}
                  </span>
                  <span className="text-muted-foreground">{log.durationMs}ms</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}
    </article>
  );
}

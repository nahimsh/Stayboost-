import { cn } from "@stayboost/ui";

/** Shared card chrome for dashboard widgets — clean borders, muted title, optional action. */
export function WidgetCard({
  title,
  action,
  className,
  bodyClassName,
  children,
}: {
  readonly title: string;
  readonly action?: React.ReactNode;
  readonly className?: string;
  readonly bodyClassName?: string;
  readonly children: React.ReactNode;
}): React.JSX.Element {
  return (
    <section className={cn("flex flex-col rounded-xl border bg-card shadow-sm", className)}>
      <header className="flex items-center justify-between gap-2 border-b px-5 py-3.5">
        <h2 className="text-sm font-semibold text-foreground">{title}</h2>
        {action}
      </header>
      <div className={cn("flex-1 p-5", bodyClassName)}>{children}</div>
    </section>
  );
}

export function EmptyState({ message }: { readonly message: string }): React.JSX.Element {
  return (
    <p className="flex h-full min-h-24 items-center justify-center text-center text-sm text-muted-foreground">
      {message}
    </p>
  );
}

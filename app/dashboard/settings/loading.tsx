export default function LoadingSettings() {
  return (
    <div
      aria-label="Loading settings"
      aria-busy="true"
      className="mx-auto max-w-5xl space-y-6"
    >
      <div className="space-y-2">
        <div className="h-4 w-32 animate-pulse rounded bg-surface-muted" />
        <div className="h-8 w-36 animate-pulse rounded bg-surface-muted" />
        <div className="h-4 w-72 max-w-full animate-pulse rounded bg-surface-muted" />
      </div>
      <div className="grid gap-6 lg:grid-cols-[12rem_minmax(0,1fr)] lg:gap-10">
        <div className="flex gap-2 border-b border-border pb-2 lg:flex-col lg:border-0">
          <div className="h-11 w-28 animate-pulse rounded-lg bg-surface-muted" />
          <div className="h-11 w-28 animate-pulse rounded-lg bg-surface-muted" />
        </div>
        <div className="space-y-6">
          <div className="h-6 w-28 animate-pulse rounded bg-surface-muted" />
          <div className="h-16 animate-pulse border-y border-border bg-surface-muted/50" />
          <div className="space-y-3 border-y border-border py-5">
            <div className="h-5 w-44 animate-pulse rounded bg-surface-muted" />
            <div className="h-10 animate-pulse rounded-lg bg-surface-muted" />
            <div className="h-10 animate-pulse rounded-lg bg-surface-muted" />
          </div>
        </div>
      </div>
    </div>
  );
}
export default function LoadingTasks() {
  return (
    <div aria-label="Loading tasks" aria-busy="true" className="mx-auto max-w-6xl space-y-6">
      <div className="flex items-end justify-between gap-4">
        <div className="space-y-2">
          <div className="h-4 w-40 animate-pulse rounded bg-surface-muted" />
          <div className="h-8 w-32 animate-pulse rounded bg-surface-muted" />
          <div className="h-4 w-64 max-w-full animate-pulse rounded bg-surface-muted" />
        </div>
        <div className="h-11 w-32 animate-pulse rounded-lg bg-surface-muted" />
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {Array.from({ length: 3 }, (_, index) => (
          <div key={index} className="h-16 animate-pulse rounded-xl border border-border bg-surface" />
        ))}
      </div>
      <div className="h-14 animate-pulse rounded-xl border border-border bg-surface" />
      <div className="space-y-2">
        {Array.from({ length: 5 }, (_, index) => (
          <div key={index} className="h-16 animate-pulse rounded-lg border border-border bg-surface" />
        ))}
      </div>
    </div>
  );
}
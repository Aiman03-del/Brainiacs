export default function LoadingProfile() {
  return (
    <div
      aria-label="Loading profile"
      aria-busy="true"
      className="mx-auto max-w-4xl space-y-6"
    >
      <div className="flex items-end justify-between gap-4">
        <div className="space-y-2">
          <div className="h-4 w-24 animate-pulse rounded bg-surface-muted" />
          <div className="h-8 w-32 animate-pulse rounded bg-surface-muted" />
        </div>
        <div className="h-11 w-32 animate-pulse rounded-lg bg-surface-muted" />
      </div>
      <div className="flex items-center gap-5 border-y border-border py-8">
        <div className="h-22 w-22 shrink-0 animate-pulse rounded-full bg-surface-muted" />
        <div className="min-w-0 flex-1 space-y-3">
          <div className="h-6 w-48 max-w-full animate-pulse rounded bg-surface-muted" />
          <div className="h-4 w-64 max-w-full animate-pulse rounded bg-surface-muted" />
          <div className="h-4 w-40 max-w-full animate-pulse rounded bg-surface-muted" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <div key={index} className="h-16 animate-pulse rounded-lg bg-surface-muted" />
        ))}
      </div>
      <div className="space-y-3">
        {Array.from({ length: 4 }, (_, index) => (
          <div key={index} className="h-12 animate-pulse border-b border-border bg-surface-muted/50" />
        ))}
      </div>
    </div>
  );
}
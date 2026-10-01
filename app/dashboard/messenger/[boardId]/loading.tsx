export default function LoadingBoardConversation() {
  return (
    <div aria-label="Loading conversation" aria-busy="true" className="flex h-full min-h-0 flex-col">
      <div className="flex min-h-14 items-center gap-3 border-b border-border px-4 py-3">
        <span className="h-4 w-4 animate-pulse rounded bg-surface-muted" />
        <span className="h-4 w-36 animate-pulse rounded bg-surface-muted" />
      </div>
      <div className="flex-1 space-y-6 overflow-hidden px-4 py-6">
        {Array.from({ length: 5 }, (_, index) => (
          <div key={index} className="flex gap-3">
            <span className="h-9 w-9 shrink-0 animate-pulse rounded-full bg-surface-muted" />
            <div className="min-w-0 flex-1 space-y-2 pt-1">
              <span className="block h-3 w-28 animate-pulse rounded bg-surface-muted" />
              <span className={`block h-3 animate-pulse rounded bg-surface-muted ${index % 2 ? "w-3/5" : "w-4/5"}`} />
            </div>
          </div>
        ))}
      </div>
      <div className="border-t border-border p-3">
        <div className="h-11 animate-pulse rounded-lg bg-surface-muted" />
      </div>
    </div>
  );
}
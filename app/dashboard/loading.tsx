import { Skeleton } from "@/components/ui/Skeleton";

export default function LoadingDashboardSection() {
  return (
    <div
      role="status"
      aria-label="Loading workspace"
      aria-busy="true"
      className="mx-auto max-w-6xl space-y-6"
    >
      <div className="space-y-2">
        <Skeleton className="h-4 w-36" />
        <Skeleton className="h-8 w-64 max-w-full" />
        <Skeleton className="h-4 w-72 max-w-full" />
      </div>
      <div className="grid grid-cols-1 gap-3 min-[480px]:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <Skeleton key={index} className="h-16 rounded-xl border" />
        ))}
      </div>
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.35fr)_minmax(18rem,0.85fr)]">
        <Skeleton className="h-64 rounded-xl border" />
        <Skeleton className="h-64 rounded-xl border" />
      </div>
    </div>
  );
}
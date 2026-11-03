export function ResultSkeleton() {
  return (
    <div className="rounded-xl border border-white/[0.06] bg-ink-850/40 px-5 py-4">
      <div className="flex items-start gap-4">
        <div className="mt-1 h-3 w-5 rounded bg-white/[0.06] shimmer" />
        <div className="min-w-0 flex-1 space-y-2.5">
          <div className="h-4 w-4/5 rounded bg-white/[0.06] shimmer" />
          <div className="h-4 w-2/3 rounded bg-white/[0.05] shimmer" />
          <div className="flex gap-3 pt-1">
            <div className="h-3 w-20 rounded bg-white/[0.05] shimmer" />
            <div className="h-3 w-16 rounded bg-white/[0.05] shimmer" />
          </div>
        </div>
        <div className="hidden w-28 shrink-0 flex-col items-end gap-2 sm:flex">
          <div className="h-3 w-12 rounded bg-white/[0.06] shimmer" />
          <div className="h-1.5 w-full rounded-full bg-white/[0.05] shimmer" />
        </div>
      </div>
    </div>
  );
}

export function ResultsSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <ResultSkeleton key={i} />
      ))}
    </div>
  );
}

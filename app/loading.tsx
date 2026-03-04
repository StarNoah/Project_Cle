export default function Loading() {
  return (
    <div className="space-y-6">
      <div>
        <div className="skeleton h-9 w-64" />
        <div className="skeleton h-5 w-40 mt-2" />
      </div>

      <div className="skeleton h-14 w-full rounded-lg" />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-[var(--border)] overflow-hidden">
            <div className="skeleton aspect-square w-full" />
            <div className="p-4 space-y-2">
              <div className="skeleton h-4 w-3/4" />
              <div className="skeleton h-4 w-1/2" />
              <div className="flex gap-4 mt-3">
                <div className="skeleton h-4 w-16" />
                <div className="skeleton h-4 w-16" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

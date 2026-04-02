export default function Loading() {
  return (
    <div className="flex flex-col">
      {/* Page header skeleton */}
      <div className="page-header px-6 py-5">
        <div className="h-6 w-36 animate-pulse rounded-md bg-white/[0.08]" />
        <div className="mt-1.5 h-4 w-64 animate-pulse rounded-md bg-white/[0.05]" />
      </div>

      {/* Content skeleton */}
      <div className="space-y-3 p-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="glass animate-pulse rounded-xl px-4 py-3"
            style={{ opacity: 1 - i * 0.1 }}
          >
            <div className="flex items-center gap-3">
              <div className="size-8 rounded-md bg-white/[0.07]" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-2/3 rounded bg-white/[0.07]" />
                <div className="h-3 w-1/3 rounded bg-white/[0.05]" />
              </div>
              <div className="h-6 w-16 rounded-full bg-white/[0.05]" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

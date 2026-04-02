export default function Loading() {
  return (
    <div className="animate-pulse space-y-4 p-6">
      <div className="h-8 w-48 rounded bg-muted" />
      <div className="h-4 w-96 rounded bg-muted" />
      <div className="mt-6 grid gap-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-12 rounded-md bg-muted" />
        ))}
      </div>
    </div>
  )
}

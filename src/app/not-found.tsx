import Link from "next/link"

export default function NotFound() {
  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center gap-4 p-6">
      <h2 className="text-xl font-semibold">Page not found</h2>
      <p className="text-sm text-muted-foreground">The page you are looking for does not exist.</p>
      <Link
        href="/"
        className="inline-flex h-8 items-center rounded-lg border border-border bg-background px-2.5 text-sm font-medium transition-colors hover:bg-muted"
      >
        Go home
      </Link>
    </div>
  )
}

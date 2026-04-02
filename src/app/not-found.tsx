import Link from "next/link"

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-6">
      <div className="glass flex flex-col items-center gap-4 rounded-xl px-10 py-10 text-center">
        <span className="text-5xl font-bold text-[#3b82f6]/40">404</span>
        <div className="space-y-1">
          <h2 className="text-base font-semibold text-[#e2e8f8]">Page not found</h2>
          <p className="text-sm text-[#8ba3cc]">The page you are looking for does not exist.</p>
        </div>
        <Link
          href="/"
          className="cursor-pointer rounded-md border border-white/[0.1] bg-white/[0.06] px-4 py-2 text-sm font-medium text-[#e2e8f8] transition-all duration-150 hover:bg-white/[0.1]"
        >
          Go home
        </Link>
      </div>
    </div>
  )
}

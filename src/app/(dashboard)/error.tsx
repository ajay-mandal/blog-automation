// 'use client' — error.tsx must be a Client Component
"use client"

import { useEffect } from "react"
import { AlertTriangle } from "lucide-react"

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 p-6">
      <div className="glass flex flex-col items-center gap-4 rounded-xl px-10 py-10 text-center">
        <div className="flex size-12 items-center justify-center rounded-xl bg-red-500/10 ring-1 ring-red-500/20">
          <AlertTriangle className="size-6 text-red-400" />
        </div>
        <div className="space-y-1">
          <h2 className="text-base font-semibold text-[#e2e8f8]">Something went wrong</h2>
          <p className="text-sm text-[#8ba3cc]">An unexpected error occurred.</p>
        </div>
        <button
          type="button"
          onClick={reset}
          className="cursor-pointer rounded-md border border-white/[0.1] bg-white/[0.06] px-4 py-2 text-sm font-medium text-[#e2e8f8] transition-all duration-150 hover:bg-white/[0.1]"
        >
          Try again
        </button>
      </div>
    </div>
  )
}

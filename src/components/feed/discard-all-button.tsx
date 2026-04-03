"use client"

// Client component: calls the bulk unselect API and refreshes the page

import { useState } from "react"
import { useRouter } from "next/navigation"
import { X, Loader2 } from "lucide-react"
import { toast } from "sonner"

export function DiscardAllButton({ selectedCount }: { selectedCount: number }) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)

  async function discardAll() {
    setBusy(true)
    try {
      const res = await fetch("/api/articles/unselect", { method: "POST" })
      if (!res.ok) {
        toast.error("Failed to discard selections")
        return
      }
      const { unselected } = (await res.json()) as { unselected: number }
      toast.success(`Cleared ${unselected} selection${unselected !== 1 ? "s" : ""}`)
      router.refresh()
    } finally {
      setBusy(false)
    }
  }

  return (
    <button
      onClick={discardAll}
      disabled={busy}
      className="flex items-center gap-1.5 rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-1.5 text-xs font-medium text-red-400 transition-all hover:border-red-500/40 hover:bg-red-500/20 disabled:opacity-50"
    >
      {busy ? <Loader2 className="size-3 animate-spin" /> : <X className="size-3" />}
      Discard all ({selectedCount})
    </button>
  )
}

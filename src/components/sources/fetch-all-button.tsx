"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { RefreshCw, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"

export function FetchAllButton({ sourceIds }: { sourceIds: string[] }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function fetchAll() {
    if (sourceIds.length === 0) return
    setLoading(true)
    try {
      const results = await Promise.allSettled(
        sourceIds.map((id) => fetch(`/api/sources/${id}/fetch`, { method: "POST" }))
      )
      const succeeded = results.filter((r) => r.status === "fulfilled").length
      const failed = results.length - succeeded
      if (failed === 0) {
        toast.success(`Fetched all ${succeeded} source${succeeded !== 1 ? "s" : ""}`)
      } else {
        toast.warning(`${succeeded} fetched, ${failed} failed`)
      }
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      className="gap-1.5 text-[#8ba3cc] hover:text-white"
      onClick={fetchAll}
      disabled={loading || sourceIds.length === 0}
    >
      {loading ? <Loader2 className="size-3.5 animate-spin" /> : <RefreshCw className="size-3.5" />}
      Fetch All
    </Button>
  )
}

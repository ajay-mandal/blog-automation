"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Sparkles, Loader2, ChevronDown } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"

const AI_MODELS = [
  { id: "anthropic/claude-4-opus", label: "Claude 4 Opus" },
  { id: "anthropic/claude-3-7-sonnet", label: "Claude 3.7 Sonnet" },
  { id: "openai/gpt-4o", label: "GPT-4o" },
  { id: "google/gemini-2.5-flash", label: "Gemini 2.5 Flash" },
]

export function GenerateButton({ selectedCount }: { selectedCount: number }) {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [model, setModel] = useState("anthropic/claude-4-opus")

  async function generate() {
    setBusy(true)
    try {
      // First, fetch the selected articles
      const articlesRes = await fetch("/api/articles/selected", { method: "GET" })
      if (!articlesRes.ok) {
        toast.error("Failed to fetch selected articles")
        return
      }
      const { articles } = (await articlesRes.json()) as {
        articles: { id: string }[]
      }
      const articleIds = articles.map((a) => a.id)

      if (articleIds.length === 0) {
        toast.error("No selected articles found")
        return
      }

      // Then generate drafts with those IDs
      const res = await fetch("/api/articles/selected", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ articleIds, aiModel: model }),
      })

      if (!res.ok) {
        toast.error("Failed to generate drafts")
        return
      }

      const { count, failures } = (await res.json()) as {
        count: number
        failures: { articleId: string; title: string; reason: string; code: string }[]
      }

      // Surface failures prominently
      if (failures?.length) {
        // Deduplicate by error code so one quota error doesn't spam
        const uniqueCodes = [...new Set(failures.map((f) => f.code))]
        for (const code of uniqueCodes) {
          const sample = failures.find((f) => f.code === code)!
          const affected = failures.filter((f) => f.code === code)
          const articleLabel =
            affected.length === 1 ? `"${sample.title}"` : `${affected.length} articles`
          toast.error(`${articleLabel}: ${sample.reason}`, { duration: 8000 })
        }
      }

      if (count > 0) {
        toast.success(`Generated ${count} draft${count !== 1 ? "s" : ""}`)
        router.push("/blogs")
        setIsOpen(false)
      } else if (!failures?.length) {
        toast.error("No drafts were generated")
      }
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={selectedCount === 0 || busy}
        className="flex items-center gap-1.5 rounded-lg border border-blue-500/20 bg-blue-500/10 px-3 py-1.5 text-xs font-medium text-blue-400 transition-all hover:border-blue-500/40 hover:bg-blue-500/20 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <Sparkles className="size-3.5" />
        Generate ({selectedCount})
        <ChevronDown className={`size-3 transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full right-0 z-50 mt-2 min-w-64 rounded-lg border border-white/[0.08] bg-[#0a1220] shadow-lg shadow-black/80">
          <div className="flex flex-col gap-2 border-b border-white/[0.04] p-3">
            <label className="text-[11px] font-semibold text-white/60">SELECT MODEL</label>
            <select
              value={model}
              onChange={(e) => setModel(e.target.value)}
              className="rounded-lg border border-white/[0.08] bg-white/[0.04] px-2.5 py-1.5 text-xs text-white/80"
            >
              {AI_MODELS.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>
          <div className="flex gap-2 p-3">
            <Button
              onClick={generate}
              disabled={busy}
              size="sm"
              className="flex-1 bg-blue-500/20 text-blue-300 hover:bg-blue-500/30"
            >
              {busy ? (
                <>
                  <Loader2 className="size-3 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="size-3" />
                  Generate Drafts
                </>
              )}
            </Button>
            <Button
              onClick={() => setIsOpen(false)}
              size="sm"
              variant="ghost"
              className="text-white/50"
            >
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

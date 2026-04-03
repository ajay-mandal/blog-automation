"use client"

// Client component: select/unselect toggle, OG image lazy-load, status mutations

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ExternalLink, Check, EyeOff, Sparkles, RotateCcw, Clock, X } from "lucide-react"
import { toast } from "sonner"

type ArticleSource = {
  id: string
  name: string
  category: string | null
}

type Article = {
  id: string
  title: string
  url: string
  summary: string | null
  author: string | null
  publishedAt: string | null
  fetchedAt: string
  status: string
  source: ArticleSource
}

function useOgImage(url: string): string | null | "loading" {
  const [state, setState] = useState<string | null | "loading">("loading")
  useEffect(() => {
    let cancelled = false
    fetch(`/api/og?url=${encodeURIComponent(url)}`)
      .then((r) => r.json())
      .then((d: { imageUrl: string | null }) => {
        if (!cancelled) setState(d.imageUrl)
      })
      .catch(() => {
        if (!cancelled) setState(null)
      })
    return () => {
      cancelled = true
    }
  }, [url])
  return state
}

export function ArticleCard({ article }: { article: Article }) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const [hovering, setHovering] = useState(false)
  const ogImage = useOgImage(article.url)

  const isIgnored = article.status === "ignored"
  const isSelected = article.status === "selected"

  async function setStatus(status: "new" | "selected" | "ignored") {
    setBusy(true)
    try {
      const res = await fetch("/api/articles", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: article.id, status }),
      })
      if (!res.ok) {
        toast.error("Failed to update article")
        return
      }
      window.dispatchEvent(new CustomEvent("article-selection-changed"))
      router.refresh()
    } finally {
      setBusy(false)
    }
  }

  return (
    <div
      className={`group relative flex flex-col overflow-hidden rounded-xl border transition-all duration-200 ${
        isSelected
          ? "border-green-500/40 bg-[#080f1e] shadow-xl ring-1 shadow-green-950/40 ring-green-500/20"
          : isIgnored
            ? "border-white/[0.04] bg-white/[0.01] opacity-40 grayscale"
            : "border-white/[0.07] bg-[#0a1220] hover:border-white/[0.14] hover:shadow-lg hover:shadow-black/30"
      }`}
    >
      {/* ── OG Image ─────────────────────────────────── */}
      <div className="relative aspect-video w-full overflow-hidden bg-[#050c18]">
        {ogImage === "loading" && (
          <div className="absolute inset-0 animate-pulse bg-gradient-to-r from-[#0a1628] via-[#0f2040]/80 to-[#0a1628]" />
        )}
        {ogImage && ogImage !== "loading" && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={ogImage}
            alt=""
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
          />
        )}
        {ogImage === null && (
          <div className="absolute inset-0 bg-gradient-to-br from-[#0e1e3a] via-[#060c18] to-[#030710]">
            <div className="absolute inset-0 flex items-center justify-center">
              <span
                className="font-black text-white/[0.03] select-none"
                style={{ fontSize: "4rem" }}
              >
                {article.source.name.charAt(0).toUpperCase()}
              </span>
            </div>
          </div>
        )}

        {/* Gradient overlay for legibility */}
        <div className="absolute inset-x-0 bottom-0 h-14 bg-gradient-to-t from-black/60 to-transparent" />

        {/* Source badge */}
        <div className="absolute bottom-2 left-2.5">
          <span className="inline-flex items-center gap-1 rounded-md bg-black/55 px-2 py-0.5 text-[10px] font-medium text-white/75 backdrop-blur-sm">
            {article.source.name}
            {article.source.category && (
              <span className="text-white/35"> · {article.source.category}</span>
            )}
          </span>
        </div>

        {/* Selected checkmark badge */}
        {isSelected && (
          <div className="absolute top-2.5 right-2.5 flex size-5 items-center justify-center rounded-full bg-green-500 shadow-lg ring-2 shadow-green-500/50 ring-green-400/30">
            <Check className="size-3 text-white" strokeWidth={3} />
          </div>
        )}
      </div>

      {/* ── Card body ────────────────────────────────── */}
      <div className="flex flex-1 flex-col gap-2 p-3">
        {/* Title */}
        <a
          href={article.url}
          target="_blank"
          rel="noopener noreferrer"
          className="group/link flex items-start gap-1"
        >
          <span className="line-clamp-2 text-[12px] leading-snug font-semibold text-white/90 transition-colors group-hover/link:text-blue-400">
            {article.title}
          </span>
          <ExternalLink className="mt-0.5 size-2.5 shrink-0 text-white/0 transition-all group-hover/link:text-blue-400" />
        </a>

        {/* Summary */}
        {article.summary && (
          <p className="line-clamp-2 text-[11px] leading-relaxed text-[#5e7aa0]">
            {article.summary}
          </p>
        )}

        <div className="flex-1" />

        {/* Date */}
        {article.publishedAt && (
          <div className="flex items-center gap-1 text-[10px] text-[#3a5070]">
            <Clock className="size-2.5" />
            {new Date(article.publishedAt).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </div>
        )}

        {/* ── Action row ─────────────────────────────── */}
        <div className="mt-1.5 flex items-center gap-1.5 border-t border-white/[0.05] pt-2">
          <button
            disabled={busy}
            onMouseEnter={() => setHovering(true)}
            onMouseLeave={() => setHovering(false)}
            onClick={() => setStatus(isSelected ? "new" : "selected")}
            className={`flex h-7 flex-1 items-center justify-center gap-1.5 rounded-lg text-[11px] font-medium transition-all disabled:cursor-not-allowed disabled:opacity-50 ${
              isSelected
                ? hovering
                  ? "bg-red-500/10 text-red-400/80"
                  : "bg-green-500/15 text-green-300"
                : "bg-white/[0.04] text-[#7a99bb] hover:bg-green-500/10 hover:text-green-400"
            }`}
          >
            {isSelected ? (
              hovering ? (
                <>
                  <X className="size-3" />
                  Unselect
                </>
              ) : (
                <>
                  <Check className="size-3" strokeWidth={2.5} />
                  Selected
                </>
              )
            ) : (
              <>
                <Sparkles className="size-3" />
                Select
              </>
            )}
          </button>

          {!isIgnored ? (
            <button
              disabled={busy}
              onClick={() => setStatus("ignored")}
              title="Ignore this article"
              className="flex size-7 shrink-0 items-center justify-center rounded-lg text-white/20 transition-colors hover:bg-red-500/10 hover:text-red-400/60 disabled:opacity-50"
            >
              <EyeOff className="size-3.5" />
            </button>
          ) : (
            <button
              disabled={busy}
              onClick={() => setStatus("new")}
              title="Restore"
              className="flex size-7 shrink-0 items-center justify-center rounded-lg text-white/20 transition-colors hover:bg-white/[0.06] hover:text-white/50 disabled:opacity-50"
            >
              <RotateCcw className="size-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

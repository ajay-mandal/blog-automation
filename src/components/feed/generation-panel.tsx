"use client"

// GenerationPanel: right-side slide-in panel with three phases:
//   setup      → model picker + generate trigger
//   generating → progress indicator
//   results    → draft previews with compare tabs + maximize editor

import { useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { marked } from "marked"
import DOMPurify from "dompurify"
import {
  Sparkles,
  X,
  ChevronRight,
  Loader2,
  Maximize2,
  Minimize2,
  Save,
  ArrowRight,
  Check,
  AlertTriangle,
  Bot,
} from "lucide-react"
import type { ModelId } from "@/lib/ai-models"

// ─── types ────────────────────────────────────────────────────────────────────

type Draft = {
  id: string
  title: string
  slug: string
  contentMd: string
  aiModel: string
  status: string
}

type GenerateResponse = {
  generated: Draft[]
  count: number
  failures: { articleId: string; title: string; reason: string; code: string }[]
}

// ─── constants ────────────────────────────────────────────────────────────────

const MODEL_OPTIONS: { id: ModelId; label: string; provider: string; badge?: string }[] = [
  { id: "qwen/qwen3.6-plus:free", label: "Qwen3 6B Plus", provider: "Qwen", badge: "free" },
]

// ─── helpers ──────────────────────────────────────────────────────────────────

function renderMarkdown(md: string): string {
  const raw = marked.parse(md, { async: false }) as string
  if (typeof window === "undefined") return raw
  return DOMPurify.sanitize(raw)
}

// ─── sub-components ───────────────────────────────────────────────────────────

function ModelPicker({ value, onChange }: { value: ModelId; onChange: (id: ModelId) => void }) {
  const grouped = {
    Anthropic: MODEL_OPTIONS.filter((m) => m.provider === "Anthropic"),
    OpenAI: MODEL_OPTIONS.filter((m) => m.provider === "OpenAI"),
    Google: MODEL_OPTIONS.filter((m) => m.provider === "Google"),
  }

  return (
    <div className="flex flex-col gap-2">
      {(Object.entries(grouped) as [string, (typeof MODEL_OPTIONS)[number][]][]).map(
        ([provider, models]) => (
          <div key={provider} className="flex flex-col gap-1">
            <span className="px-1 text-[10px] font-semibold tracking-wider text-white/25 uppercase">
              {provider}
            </span>
            {models.map((m) => (
              <button
                key={m.id}
                onClick={() => onChange(m.id)}
                className={`flex items-center justify-between rounded-lg border px-3 py-2 text-left text-xs transition-all ${
                  value === m.id
                    ? "border-blue-500/40 bg-blue-500/10 text-white/90"
                    : "border-white/[0.06] bg-white/[0.02] text-white/50 hover:border-white/[0.12] hover:bg-white/[0.04] hover:text-white/70"
                }`}
              >
                <span>{m.label}</span>
                {m.badge && (
                  <span className="rounded bg-blue-500/20 px-1.5 py-0.5 text-[9px] font-semibold text-blue-400">
                    {m.badge}
                  </span>
                )}
                {value === m.id && <Check className="size-3 shrink-0 text-blue-400" />}
              </button>
            ))}
          </div>
        )
      )}
    </div>
  )
}

function DraftTab({
  draft,
  active,
  onClick,
  index,
}: {
  draft: Draft
  active: boolean
  onClick: () => void
  index: number
}) {
  const modelLabel = MODEL_OPTIONS.find((m) => m.id === draft.aiModel)?.label ?? draft.aiModel
  return (
    <button
      onClick={onClick}
      className={`flex min-w-0 flex-1 flex-col gap-0.5 rounded-lg border px-2.5 py-2 text-left transition-all ${
        active
          ? "border-blue-500/30 bg-blue-500/10"
          : "border-white/[0.06] bg-white/[0.02] hover:border-white/[0.10] hover:bg-white/[0.04]"
      }`}
    >
      <span className={`text-[10px] font-semibold ${active ? "text-blue-400" : "text-white/30"}`}>
        Draft {index + 1}
      </span>
      <span className={`truncate text-[11px] ${active ? "text-white/80" : "text-white/40"}`}>
        {modelLabel}
      </span>
    </button>
  )
}

// ─── main component ───────────────────────────────────────────────────────────

type Phase = "setup" | "generating" | "results" | "editing"

export function GenerationPanel({ selectedCount }: { selectedCount: number }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [phase, setPhase] = useState<Phase>("setup")
  const [model, setModel] = useState<ModelId>("qwen/qwen3.6-plus:free")
  const [drafts, setDrafts] = useState<Draft[]>([])
  const [activeDraft, setActiveDraft] = useState(0)
  const [maximized, setMaximized] = useState(false)

  // Editor state (for the maximize/edit phase)
  const [editTitle, setEditTitle] = useState("")
  const [editContent, setEditContent] = useState("")
  const [editPreview, setEditPreview] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  const openPanel = () => {
    setOpen(true)
    if (phase === "results" && drafts.length === 0) setPhase("setup")
  }

  const closePanel = () => {
    setOpen(false)
    setMaximized(false)
  }

  // ── generate ────────────────────────────────────────────────────────────────

  const generate = useCallback(async () => {
    setPhase("generating")

    try {
      // 1. Fetch selected article IDs
      const articlesRes = await fetch("/api/articles/selected")
      if (!articlesRes.ok) {
        toast.error("Failed to fetch selected articles")
        setPhase("setup")
        return
      }
      const { articles } = (await articlesRes.json()) as { articles: { id: string }[] }
      const articleIds = articles.map((a) => a.id)

      if (articleIds.length === 0) {
        toast.error("No selected articles found")
        setPhase("setup")
        return
      }

      // 2. Generate drafts
      const res = await fetch("/api/articles/selected", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ articleIds, aiModel: model }),
      })

      const data = (await res.json()) as GenerateResponse

      // Surface failures
      if (data.failures?.length) {
        const uniqueCodes = [...new Set(data.failures.map((f) => f.code))]
        for (const code of uniqueCodes) {
          const sample = data.failures.find((f) => f.code === code)!
          const affected = data.failures.filter((f) => f.code === code)
          const label = affected.length === 1 ? `"${sample.title}"` : `${affected.length} articles`
          toast.error(`${label}: ${sample.reason}`, { duration: 8000 })
        }
      }

      if (data.count > 0) {
        setDrafts(data.generated)
        setActiveDraft(0)
        setPhase("results")
        router.refresh()
      } else {
        setPhase("setup")
      }
    } catch {
      toast.error("Generation failed — check your connection")
      setPhase("setup")
    }
  }, [model, router])

  // ── open maximize editor ─────────────────────────────────────────────────────

  const openEditor = (draft: Draft) => {
    setEditTitle(draft.title)
    setEditContent(draft.contentMd)
    setEditPreview(false)
    setPhase("editing")
    setMaximized(true)
  }

  // ── save draft ───────────────────────────────────────────────────────────────

  const saveDraft = async (andContinue = false) => {
    const draft = drafts[activeDraft]
    if (!draft) return
    if (!editTitle.trim() || !editContent.trim()) {
      toast.error("Title and content are required")
      return
    }

    setIsSaving(true)
    try {
      const res = await fetch(`/api/generated-blogs/${draft.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: editTitle.trim(),
          contentMd: editContent.trim(),
          ...(andContinue ? { status: "reviewed" } : {}),
        }),
      })

      if (!res.ok) {
        toast.error("Failed to save draft")
        return
      }

      const updated = (await res.json()) as Draft
      setDrafts((prev) => prev.map((d) => (d.id === updated.id ? updated : d)))

      if (andContinue) {
        toast.success("Saved — continuing to publish…")
        router.push(`/blogs/${draft.id}/publish`)
      } else {
        toast.success("Draft saved")
        setPhase("results")
        setMaximized(false)
      }
    } finally {
      setIsSaving(false)
    }
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────────────

  if (selectedCount === 0 && !open) return null

  const currentDraft = drafts[activeDraft]

  return (
    <>
      {/* ── Trigger button (only when closed) ─────────────────────────────── */}
      {!open && (
        <button
          onClick={openPanel}
          className="flex items-center gap-1.5 rounded-lg border border-blue-500/20 bg-blue-500/10 px-3 py-1.5 text-xs font-medium text-blue-400 transition-all hover:border-blue-500/40 hover:bg-blue-500/20"
        >
          <Sparkles className="size-3.5" />
          Generate ({selectedCount})
          <ChevronRight className="size-3" />
        </button>
      )}

      {/* ── Open trigger (in header, when panel is open) ───────────────────── */}
      {open && !maximized && (
        <button
          onClick={closePanel}
          className="flex items-center gap-1.5 rounded-lg border border-blue-500/30 bg-blue-500/15 px-3 py-1.5 text-xs font-medium text-blue-400"
        >
          <Sparkles className="size-3.5" />
          Generate panel
          <X className="ml-0.5 size-3" />
        </button>
      )}

      {/* ── Backdrop (maximize mode only) ─────────────────────────────────── */}
      {maximized && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
          onClick={() => {
            setMaximized(false)
            setPhase("results")
          }}
        />
      )}

      {/* ── Panel ─────────────────────────────────────────────────────────── */}
      {open && (
        <div
          className={`fixed top-0 right-0 z-50 flex h-full flex-col border-l border-white/[0.07] bg-[#060d18] shadow-2xl shadow-black/60 transition-all duration-300 ${
            maximized ? "w-full max-w-5xl" : "w-[420px]"
          }`}
        >
          {/* Panel header */}
          <div className="flex shrink-0 items-center justify-between border-b border-white/[0.06] px-4 py-3">
            <div className="flex items-center gap-2">
              <div className="flex size-7 items-center justify-center rounded-lg bg-blue-500/10">
                <Sparkles className="size-3.5 text-blue-400" />
              </div>
              <span className="text-sm font-semibold text-white/80">
                {phase === "setup"
                  ? "Generate Drafts"
                  : phase === "generating"
                    ? "Generating…"
                    : phase === "results"
                      ? `${drafts.length} Draft${drafts.length !== 1 ? "s" : ""} Generated`
                      : "Edit Draft"}
              </span>
            </div>
            <div className="flex items-center gap-1">
              {phase === "editing" && (
                <button
                  onClick={() => {
                    setMaximized((v) => !v)
                  }}
                  title={maximized ? "Restore" : "Maximize"}
                  className="flex size-7 items-center justify-center rounded-lg text-white/30 transition-colors hover:bg-white/[0.06] hover:text-white/60"
                >
                  {maximized ? (
                    <Minimize2 className="size-3.5" />
                  ) : (
                    <Maximize2 className="size-3.5" />
                  )}
                </button>
              )}
              <button
                onClick={() => {
                  if (phase === "editing") {
                    setPhase("results")
                    setMaximized(false)
                  } else {
                    closePanel()
                  }
                }}
                className="flex size-7 items-center justify-center rounded-lg text-white/30 transition-colors hover:bg-white/[0.06] hover:text-white/60"
              >
                <X className="size-3.5" />
              </button>
            </div>
          </div>

          {/* ── Setup phase ─────────────────────────────────────────────── */}
          {phase === "setup" && (
            <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-4">
              {/* Selected count */}
              <div className="flex items-center gap-2 rounded-lg border border-blue-500/20 bg-blue-500/5 px-3 py-2.5">
                <Check className="size-3.5 shrink-0 text-blue-400" />
                <span className="text-xs text-blue-300/80">
                  <span className="font-semibold text-blue-300">{selectedCount}</span> article
                  {selectedCount !== 1 ? "s" : ""} selected
                </span>
              </div>

              {/* Model picker */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-white/40">
                  <Bot className="size-3.5" />
                  AI Model
                </div>
                <ModelPicker value={model} onChange={setModel} />
              </div>

              <div className="flex-1" />

              {/* Generate button */}
              <button
                onClick={generate}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-500/20 py-2.5 text-sm font-medium text-blue-300 transition-all hover:bg-blue-500/30 active:scale-[0.99]"
              >
                <Sparkles className="size-4" />
                Generate {selectedCount} Draft{selectedCount !== 1 ? "s" : ""}
              </button>
            </div>
          )}

          {/* ── Generating phase ─────────────────────────────────────────── */}
          {phase === "generating" && (
            <div className="flex flex-1 flex-col items-center justify-center gap-4 p-6">
              <div className="relative flex size-14 items-center justify-center">
                <div className="absolute inset-0 animate-ping rounded-full bg-blue-500/10" />
                <div className="relative flex size-14 items-center justify-center rounded-full bg-blue-500/10 ring-1 ring-blue-500/20">
                  <Loader2 className="size-6 animate-spin text-blue-400" />
                </div>
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-white/70">Generating drafts…</p>
                <p className="mt-1 text-xs text-white/30">
                  Using {MODEL_OPTIONS.find((m) => m.id === model)?.label}
                </p>
              </div>
            </div>
          )}

          {/* ── Results phase ────────────────────────────────────────────── */}
          {phase === "results" && (
            <div className="flex flex-1 flex-col overflow-hidden">
              {/* Draft tabs */}
              {drafts.length > 1 && (
                <div className="flex shrink-0 gap-2 border-b border-white/[0.05] px-4 py-3">
                  {drafts.map((d, i) => (
                    <DraftTab
                      key={d.id}
                      draft={d}
                      index={i}
                      active={activeDraft === i}
                      onClick={() => setActiveDraft(i)}
                    />
                  ))}
                </div>
              )}

              {/* Draft content preview */}
              {currentDraft && (
                <div className="flex flex-1 flex-col overflow-hidden">
                  {/* Draft meta */}
                  <div className="shrink-0 border-b border-white/[0.04] px-4 py-3">
                    <h3 className="text-sm leading-snug font-semibold text-white/90">
                      {currentDraft.title}
                    </h3>
                    <div className="mt-1 flex items-center gap-2">
                      <span className="text-[10px] text-white/30">
                        {MODEL_OPTIONS.find((m) => m.id === currentDraft.aiModel)?.label ??
                          currentDraft.aiModel}
                      </span>
                      <span className="size-1 rounded-full bg-white/10" />
                      <span className="text-[10px] text-white/30 capitalize">
                        {currentDraft.status}
                      </span>
                    </div>
                  </div>

                  {/* Scrollable markdown preview */}
                  <div className="flex-1 overflow-y-auto px-4 py-3">
                    <div
                      className="prose prose-invert prose-sm prose-headings:text-white/80 prose-p:text-white/50 prose-strong:text-white/70 prose-code:text-blue-300 max-w-none"
                      dangerouslySetInnerHTML={{
                        __html: renderMarkdown(currentDraft.contentMd),
                      }}
                    />
                  </div>

                  {/* Actions */}
                  <div className="flex shrink-0 gap-2 border-t border-white/[0.05] px-4 py-3">
                    <button
                      onClick={() => openEditor(currentDraft)}
                      className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-white/[0.08] bg-white/[0.03] py-2 text-xs font-medium text-white/60 transition-all hover:border-white/[0.14] hover:bg-white/[0.06] hover:text-white/80"
                    >
                      <Maximize2 className="size-3.5" />
                      Edit in full screen
                    </button>
                    <button
                      onClick={() => router.push(`/blogs/${currentDraft.id}/publish`)}
                      className="flex items-center justify-center gap-1.5 rounded-lg bg-blue-500/20 px-3 py-2 text-xs font-medium text-blue-300 transition-all hover:bg-blue-500/30"
                    >
                      Publish
                      <ArrowRight className="size-3.5" />
                    </button>
                  </div>
                </div>
              )}

              {/* No drafts fallback */}
              {!currentDraft && (
                <div className="flex flex-1 flex-col items-center justify-center gap-2 p-6 text-center">
                  <AlertTriangle className="size-6 text-yellow-500/50" />
                  <p className="text-sm text-white/40">No drafts to display</p>
                  <button
                    onClick={() => setPhase("setup")}
                    className="mt-2 text-xs text-blue-400 hover:underline"
                  >
                    Try again
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ── Editing/maximize phase ────────────────────────────────────── */}
          {phase === "editing" && (
            <div className="flex flex-1 flex-col overflow-hidden">
              {/* Editor toolbar */}
              <div className="flex shrink-0 items-center gap-2 border-b border-white/[0.05] px-4 py-2.5">
                <button
                  onClick={() => setEditPreview((v) => !v)}
                  className={`rounded-md px-2.5 py-1 text-[11px] font-medium transition-colors ${
                    !editPreview
                      ? "bg-white/[0.08] text-white/80"
                      : "text-white/30 hover:text-white/60"
                  }`}
                >
                  Edit
                </button>
                <button
                  onClick={() => setEditPreview((v) => !v)}
                  className={`rounded-md px-2.5 py-1 text-[11px] font-medium transition-colors ${
                    editPreview
                      ? "bg-white/[0.08] text-white/80"
                      : "text-white/30 hover:text-white/60"
                  }`}
                >
                  Preview
                </button>
              </div>

              {/* Title */}
              <div className="shrink-0 border-b border-white/[0.04] px-4 py-3">
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  placeholder="Draft title…"
                  className="w-full bg-transparent text-base font-semibold text-white/90 placeholder:text-white/20 focus:outline-none"
                />
              </div>

              {/* Content */}
              <div className="flex-1 overflow-hidden">
                {editPreview ? (
                  <div className="h-full overflow-y-auto px-4 py-3">
                    <div
                      className="prose prose-invert prose-headings:text-white/80 prose-p:text-white/60 prose-strong:text-white/75 prose-code:text-blue-300 max-w-none"
                      dangerouslySetInnerHTML={{ __html: renderMarkdown(editContent) }}
                    />
                  </div>
                ) : (
                  <textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    placeholder="Write markdown here…"
                    className="h-full w-full resize-none bg-transparent px-4 py-3 font-mono text-sm leading-relaxed text-white/70 placeholder:text-white/20 focus:outline-none"
                  />
                )}
              </div>

              {/* Save actions */}
              <div className="flex shrink-0 gap-2 border-t border-white/[0.05] px-4 py-3">
                <button
                  onClick={() => saveDraft(false)}
                  disabled={isSaving}
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-white/[0.08] bg-white/[0.03] py-2 text-xs font-medium text-white/60 transition-all hover:border-white/[0.14] hover:bg-white/[0.06] hover:text-white/80 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isSaving ? (
                    <Loader2 className="size-3 animate-spin" />
                  ) : (
                    <Save className="size-3.5" />
                  )}
                  Save Draft
                </button>
                <button
                  onClick={() => saveDraft(true)}
                  disabled={isSaving}
                  className="flex items-center justify-center gap-1.5 rounded-lg bg-blue-500/20 px-3 py-2 text-xs font-medium text-blue-300 transition-all hover:bg-blue-500/30 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Save & Continue
                  <ArrowRight className="size-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  )
}

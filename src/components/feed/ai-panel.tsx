"use client"

// AiPanel — persistent right-side panel on the Feed page.
// Sections: model picker · selected article context · Generate tab · Chat tab

import { useState, useRef, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { marked } from "marked"
import DOMPurify from "dompurify"
import {
  Sparkles,
  RefreshCw,
  Bot,
  Send,
  Loader2,
  Check,
  ArrowRight,
  Save,
  FileText,
  Eye,
  Pencil,
  ChevronDown,
  X,
  PanelRightClose,
  PanelRightOpen,
} from "lucide-react"
import type { ModelId } from "@/lib/ai-models"

// ─── types ────────────────────────────────────────────────────────────────────

type SelectedArticle = {
  id: string
  title: string
  summary: string | null
  source: { name: string }
}

type Draft = {
  id: string
  title: string
  slug: string
  contentMd: string
  aiModel: string
  status: string
}

type ChatMessage = {
  role: "user" | "assistant"
  content: string
}

type GenerateResponse = {
  generated: Draft[]
  count: number
  failures: { articleId: string; title: string; reason: string; code: string }[]
}

// ─── constants ────────────────────────────────────────────────────────────────

const MODEL_GROUPS: {
  provider: string
  color: string
  models: { id: ModelId; label: string; badge?: string }[]
}[] = [
  {
    provider: "Qwen",
    color: "text-cyan-400",
    models: [{ id: "qwen/qwen3.6-plus:free", label: "Qwen3 6B Plus", badge: "free" }],
  },
]

const ALL_MODELS = MODEL_GROUPS.flatMap((g) => g.models)

// ─── helpers ──────────────────────────────────────────────────────────────────

function renderMd(md: string): string {
  const raw = marked.parse(md, { async: false }) as string
  if (typeof window === "undefined") return raw
  return DOMPurify.sanitize(raw)
}

function modelLabel(id: string) {
  return ALL_MODELS.find((m) => m.id === id)?.label ?? id
}

// ─── Model picker dropdown ────────────────────────────────────────────────────

function ModelPicker({ value, onChange }: { value: ModelId; onChange: (id: ModelId) => void }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [])

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 rounded-lg border border-white/[0.08] bg-white/[0.03] px-2.5 py-1.5 text-xs text-white/70 transition-colors hover:border-white/[0.14] hover:bg-white/[0.06]"
      >
        <Bot className="size-3 text-white/30" />
        <span className="max-w-[120px] truncate">{modelLabel(value)}</span>
        <ChevronDown
          className={`size-3 text-white/30 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div className="absolute top-full left-0 z-50 mt-1.5 w-56 rounded-xl border border-white/[0.08] bg-[#09131f] shadow-xl shadow-black/60">
          {MODEL_GROUPS.map((group) => (
            <div key={group.provider} className="py-1.5">
              <div
                className={`px-3 pt-0.5 pb-1 text-[9px] font-bold tracking-widest uppercase ${group.color}`}
              >
                {group.provider}
              </div>
              {group.models.map((m) => (
                <button
                  key={m.id}
                  onClick={() => {
                    onChange(m.id)
                    setOpen(false)
                  }}
                  className={`flex w-full items-center justify-between px-3 py-1.5 text-xs transition-colors hover:bg-white/[0.05] ${value === m.id ? "text-white/90" : "text-white/50"}`}
                >
                  <span>{m.label}</span>
                  <div className="flex items-center gap-1.5">
                    {m.badge && (
                      <span className="rounded bg-blue-500/20 px-1 py-0.5 text-[8px] font-bold text-blue-400 uppercase">
                        {m.badge}
                      </span>
                    )}
                    {value === m.id && <Check className="size-3 text-blue-400" />}
                  </div>
                </button>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Draft tab pill ───────────────────────────────────────────────────────────

function DraftPill({
  draft,
  index,
  active,
  onClick,
}: {
  draft: Draft
  index: number
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs transition-all ${
        active
          ? "border-blue-500/30 bg-blue-500/10 text-blue-300"
          : "border-white/[0.06] bg-white/[0.02] text-white/40 hover:border-white/[0.10] hover:text-white/60"
      }`}
    >
      <FileText className="size-3 shrink-0" />
      Draft {index + 1}
      <span className="text-[10px] opacity-60">{modelLabel(draft.aiModel).split(" ")[0]}</span>
    </button>
  )
}

// ─── Main AiPanel ─────────────────────────────────────────────────────────────

type DraftView = "preview" | "edit"

export function AiPanel() {
  const router = useRouter()

  // ── model
  const [model, setModel] = useState<ModelId>("qwen/qwen3.6-plus:free")

  // ── panel open/collapsed
  const [open, setOpen] = useState(true)

  // ── context
  const [articles, setArticles] = useState<SelectedArticle[]>([])
  const [isLoadingCtx, setIsLoadingCtx] = useState(false)

  const loadContext = useCallback(async (silent = false) => {
    if (!silent) setIsLoadingCtx(true)
    try {
      const res = await fetch("/api/articles/selected")
      if (!res.ok) return
      const { articles: data } = (await res.json()) as { articles: SelectedArticle[] }
      setArticles(data)
    } finally {
      if (!silent) setIsLoadingCtx(false)
    }
  }, [])

  const silentReload = useCallback(() => loadContext(true), [loadContext])

  // Reload context whenever an article is selected/deselected
  useEffect(() => {
    loadContext()
    window.addEventListener("article-selection-changed", silentReload)
    return () => window.removeEventListener("article-selection-changed", silentReload)
  }, [loadContext, silentReload])

  // ── generate / drafts
  const [isGenerating, setIsGenerating] = useState(false)
  const [drafts, setDrafts] = useState<Draft[]>([])
  const [activeDraftIdx, setActiveDraftIdx] = useState(0)
  const [draftView, setDraftView] = useState<DraftView>("preview")

  // ── editor (within panel)
  const [editTitle, setEditTitle] = useState("")
  const [editContent, setEditContent] = useState("")
  const [isSaving, setIsSaving] = useState(false)

  // ── chat
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [chatInput, setChatInput] = useState("")
  const [isStreaming, setIsStreaming] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const chatInputRef = useRef<HTMLTextAreaElement>(null)

  // Scroll chat to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  // ── generate drafts ────────────────────────────────────────────────────────

  const generate = useCallback(async () => {
    if (articles.length === 0) {
      toast.error("Load article context first")
      return
    }
    setIsGenerating(true)
    try {
      const res = await fetch("/api/articles/selected", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          articleIds: articles.map((a) => a.id),
          aiModel: model,
        }),
      })
      const data = (await res.json()) as GenerateResponse

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
        setActiveDraftIdx(0)
        setDraftView("preview")
        router.refresh()
        toast.success(`Generated ${data.count} draft${data.count !== 1 ? "s" : ""}`)
      }
    } catch {
      toast.error("Generation failed")
    } finally {
      setIsGenerating(false)
    }
  }, [articles, model, router])

  // ── open editor for a draft ────────────────────────────────────────────────

  function openEdit(draft: Draft) {
    setEditTitle(draft.title)
    setEditContent(draft.contentMd)
    setDraftView("edit")
  }

  // ── save draft ─────────────────────────────────────────────────────────────

  async function saveDraft(andPublish = false) {
    const draft = drafts[activeDraftIdx]
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
          ...(andPublish ? { status: "reviewed" } : {}),
        }),
      })
      if (!res.ok) {
        toast.error("Failed to save")
        return
      }
      const updated = (await res.json()) as Draft
      setDrafts((prev) => prev.map((d) => (d.id === updated.id ? updated : d)))
      if (andPublish) {
        router.push(`/blogs/${draft.id}/publish`)
      } else {
        toast.success("Draft saved")
        setDraftView("preview")
      }
    } finally {
      setIsSaving(false)
    }
  }

  // ── chat send ──────────────────────────────────────────────────────────────

  const sendChat = useCallback(async () => {
    const text = chatInput.trim()
    if (!text || isStreaming) return

    const userMsg: ChatMessage = { role: "user", content: text }
    const newMessages = [...messages, userMsg]
    setMessages([...newMessages, { role: "assistant", content: "" }])
    setChatInput("")
    setIsStreaming(true)

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: newMessages,
          model,
          articleIds: articles.map((a) => a.id),
        }),
      })

      if (!res.ok) {
        let errorMsg = "Chat failed"
        if (res.status === 402) {
          errorMsg =
            "Insufficient credits on OpenRouter. Add a payment method at https://openrouter.ai/settings/credits"
        } else if (res.status === 401) {
          errorMsg = "OpenRouter API key invalid"
        } else if (res.status === 429) {
          errorMsg = "OpenRouter is overloaded. Try again in a moment."
        } else {
          try {
            const errorData = (await res.json()) as { error?: string }
            errorMsg = errorData.error || errorMsg
          } catch {
            // Ignore JSON parse error, use default
          }
        }
        toast.error(errorMsg, { duration: 8000 })
        setMessages((prev) => prev.slice(0, -1))
        return
      }

      if (!res.body) {
        toast.error("No response from server")
        setMessages((prev) => prev.slice(0, -1))
        return
      }

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let accumulated = ""

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        accumulated += decoder.decode(value, { stream: true })
        setMessages((prev) => {
          const updated = [...prev]
          updated[updated.length - 1] = { role: "assistant", content: accumulated }
          return updated
        })
      }
    } catch {
      toast.error("Chat error: Network or connection issue")
      setMessages((prev) => prev.slice(0, -1))
    } finally {
      setIsStreaming(false)
      chatInputRef.current?.focus()
    }
  }, [chatInput, isStreaming, messages, model, articles])

  const activeDraft = drafts[activeDraftIdx]

  // ─────────────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────────────

  return (
    <div
      className={`flex shrink-0 flex-col overflow-hidden border-l border-white/[0.06] bg-[#060d18] transition-all duration-300 ease-in-out ${
        open ? "w-[380px]" : "w-[44px]"
      }`}
    >
      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div
        className={`flex shrink-0 items-center border-b border-white/[0.05] px-3 py-3 ${open ? "justify-between" : "justify-center"}`}
      >
        {open && (
          <div className="flex items-center gap-2">
            <div className="flex size-7 items-center justify-center rounded-lg bg-blue-500/10">
              <Sparkles className="size-3.5 text-blue-400" />
            </div>
            <span className="text-sm font-semibold text-white/80">AI Assistant</span>
          </div>
        )}
        <button
          onClick={() => setOpen((v) => !v)}
          title={open ? "Collapse AI panel" : "Expand AI panel"}
          className="flex size-7 shrink-0 items-center justify-center rounded-md text-white/30 transition-colors hover:bg-white/6 hover:text-white/70"
        >
          {open ? <PanelRightClose className="size-4" /> : <PanelRightOpen className="size-4" />}
        </button>
      </div>

      {/* Content — hidden when collapsed */}
      {open && (
        <>
          {/* ── Context bar ──────────────────────────────────────────────────────────── */}
          <div className="shrink-0 border-b border-white/[0.04] px-4 py-2.5">
            <div className="flex items-center justify-between gap-2">
              <div className="flex min-w-0 items-center gap-2">
                {articles.length > 0 ? (
                  <span className="flex items-center gap-1.5 text-xs text-white/50">
                    <Check className="size-3 shrink-0 text-emerald-400" />
                    <span className="truncate">
                      {articles.length} article{articles.length !== 1 ? "s" : ""} in context
                    </span>
                  </span>
                ) : (
                  <span className="text-xs text-white/20">No articles selected</span>
                )}
                {isLoadingCtx && (
                  <RefreshCw className="size-3 shrink-0 animate-spin text-white/20" />
                )}
              </div>
            </div>

            {/* Article chips */}
            {articles.length > 0 && (
              <div className="mt-2 flex flex-col gap-1">
                {articles.slice(0, 3).map((a) => (
                  <div
                    key={a.id}
                    className="flex items-center gap-1.5 rounded-md bg-white/[0.03] px-2 py-1"
                  >
                    <span className="size-1.5 shrink-0 rounded-full bg-blue-400/50" />
                    <span className="min-w-0 flex-1 truncate text-[11px] text-white/50">
                      {a.title}
                    </span>
                    <span className="shrink-0 text-[10px] text-white/20">{a.source.name}</span>
                  </div>
                ))}
                {articles.length > 3 && (
                  <span className="pl-2 text-[10px] text-white/25">
                    +{articles.length - 3} more
                  </span>
                )}
              </div>
            )}
          </div>

          {/* ── Scrollable chat area ────────────────────────────────────────────────── */}
          <div className="flex-1 overflow-y-auto">
            <div className="flex flex-col gap-0 px-4 py-3">
              {messages.length === 0 && drafts.length === 0 && (
                <div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
                  <Bot className="size-8 text-white/10" />
                  <p className="text-xs text-white/30">
                    Ask anything about the articles or generate new drafts
                  </p>
                  {articles.length > 0 && (
                    <p className="text-[10px] text-white/20">
                      {articles.length} article{articles.length !== 1 ? "s" : ""} loaded as context
                    </p>
                  )}
                </div>
              )}

              {/* Draft section when drafts exist */}
              {drafts.length > 0 && (
                <div className="mb-4 flex flex-col gap-2">
                  <div className="flex items-center gap-2 pb-2">
                    <FileText className="size-3.5 text-blue-400/60" />
                    <span className="text-xs font-medium text-white/40">Generated Drafts</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {drafts.map((d, i) => (
                      <DraftPill
                        key={d.id}
                        draft={d}
                        index={i}
                        active={activeDraftIdx === i}
                        onClick={() => {
                          setActiveDraftIdx(i)
                          setDraftView("preview")
                        }}
                      />
                    ))}
                  </div>

                  {/* Draft preview below pills */}
                  {activeDraft && draftView === "preview" && (
                    <div className="mt-3 flex flex-col overflow-hidden rounded-lg border border-white/[0.08] bg-white/[0.02]">
                      {/* Title + meta */}
                      <div className="border-b border-white/[0.06] px-3 py-2">
                        <h4 className="text-xs leading-snug font-semibold text-white/85">
                          {activeDraft.title}
                        </h4>
                        <div className="mt-1 flex items-center gap-1.5">
                          <span className="text-[9px] text-white/30">
                            {modelLabel(activeDraft.aiModel)}
                          </span>
                          <span className="size-0.5 rounded-full bg-white/[0.08]" />
                          <span className="text-[9px] text-white/30 capitalize">
                            {activeDraft.status}
                          </span>
                        </div>
                      </div>

                      {/* Markdown preview (truncated) */}
                      <div className="max-h-[180px] overflow-y-auto px-3 py-2">
                        <div
                          className="prose prose-invert prose-sm prose-p:my-1 prose-headings:mb-1 prose-headings:mt-1.5 prose-headings:text-white/75 prose-p:text-white/45 prose-strong:text-white/65 prose-code:text-blue-300 prose-a:text-blue-400 max-w-none"
                          dangerouslySetInnerHTML={{ __html: renderMd(activeDraft.contentMd) }}
                        />
                      </div>

                      {/* Actions */}
                      <div className="flex gap-1 border-t border-white/[0.06] px-3 py-2">
                        <button
                          onClick={() => openEdit(activeDraft)}
                          title="Edit draft"
                          className="flex flex-1 items-center justify-center gap-1 rounded-md border border-white/[0.08] bg-white/[0.03] px-2 py-1.5 text-[10px] text-white/50 transition-colors hover:border-white/[0.14] hover:bg-white/[0.06] hover:text-white/70"
                        >
                          <Pencil className="size-3" /> Edit
                        </button>
                        <button
                          onClick={() => router.push(`/blogs/${activeDraft.id}/publish`)}
                          title="Go to publish"
                          className="flex flex-1 items-center justify-center gap-1 rounded-md border border-blue-500/20 bg-blue-500/10 px-2 py-1.5 text-[10px] text-blue-400 transition-colors hover:bg-blue-500/20"
                        >
                          <ArrowRight className="size-3" /> Publish
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Edit mode for draft */}
                  {activeDraft && draftView === "edit" && (
                    <div className="mt-3 flex flex-col gap-0 overflow-hidden rounded-lg border border-white/[0.08] bg-white/[0.02]">
                      {/* Edit/Preview toggle */}
                      <div className="flex shrink-0 items-center gap-0 border-b border-white/[0.06] px-3 py-2">
                        <button className="flex items-center gap-1 rounded-md bg-white/[0.06] px-2 py-1 text-[10px] font-medium text-white/70">
                          <Pencil className="size-3" /> Edit
                        </button>
                        <button
                          onClick={() => setDraftView("preview")}
                          className="ml-1 flex items-center gap-1 rounded-md px-2 py-1 text-[10px] font-medium text-white/30 hover:text-white/60"
                        >
                          <Eye className="size-3" /> Preview
                        </button>
                      </div>

                      {/* Title */}
                      <div className="border-b border-white/[0.06] px-3 py-2">
                        <input
                          type="text"
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          placeholder="Title…"
                          className="w-full bg-transparent text-xs font-semibold text-white/85 placeholder:text-white/20 focus:outline-none"
                        />
                      </div>

                      {/* Content */}
                      <textarea
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        placeholder="Markdown content…"
                        className="max-h-[180px] min-h-[120px] w-full resize-none overflow-y-auto bg-transparent px-3 py-2 font-mono text-xs leading-relaxed text-white/65 placeholder:text-white/20 focus:outline-none"
                      />

                      {/* Save buttons */}
                      <div className="flex gap-1 border-t border-white/[0.06] px-3 py-2">
                        <button
                          onClick={() => saveDraft(false)}
                          disabled={isSaving}
                          className="flex flex-1 items-center justify-center gap-1 rounded-md border border-white/[0.08] bg-white/[0.03] px-2 py-1.5 text-[10px] font-medium text-white/60 transition-all hover:border-white/[0.14] hover:bg-white/[0.06] hover:text-white/80 disabled:opacity-50"
                        >
                          {isSaving ? (
                            <Loader2 className="size-3 animate-spin" />
                          ) : (
                            <Save className="size-3" />
                          )}
                          Save
                        </button>
                        <button
                          onClick={() => saveDraft(true)}
                          disabled={isSaving}
                          className="flex flex-1 items-center justify-center gap-1 rounded-md bg-blue-500/20 px-2 py-1.5 text-[10px] font-medium text-blue-300 transition-all hover:bg-blue-500/30 disabled:opacity-50"
                        >
                          Save & Publish
                          <ArrowRight className="size-3" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Chat messages with animations */}
              <div className="flex flex-col gap-3">
                {messages.map((msg, i) => (
                  <div
                    key={i}
                    className={`animate-fadeIn flex flex-col gap-1 ${msg.role === "user" ? "items-end" : "items-start"}`}
                  >
                    <div
                      className={`max-w-[90%] rounded-xl px-3 py-2 text-xs leading-relaxed transition-all ${
                        msg.role === "user"
                          ? "bg-blue-500/15 text-blue-100/80"
                          : "bg-white/[0.04] text-white/70"
                      }`}
                    >
                      {msg.role === "assistant" ? (
                        <div
                          className="prose prose-invert prose-xs prose-p:my-1 prose-headings:text-white/75 prose-code:text-blue-300 max-w-none"
                          dangerouslySetInnerHTML={{ __html: renderMd(msg.content || "▋") }}
                        />
                      ) : (
                        msg.content
                      )}
                    </div>
                  </div>
                ))}

                {/* Typing indicator when streaming */}
                {isStreaming && (
                  <div className="animate-fadeIn flex items-start gap-1">
                    <div className="flex gap-1 rounded-xl bg-white/[0.04] px-3 py-2">
                      <span className="size-1.5 animate-pulse rounded-full bg-white/30" />
                      <span className="animation-delay-100 size-1.5 animate-pulse rounded-full bg-white/30" />
                      <span className="animation-delay-200 size-1.5 animate-pulse rounded-full bg-white/30" />
                    </div>
                  </div>
                )}

                {/* Generating spinner */}
                {isGenerating && (
                  <div className="flex items-center justify-center gap-2 py-3 text-center">
                    <div className="relative flex size-8 items-center justify-center">
                      <div className="absolute inset-0 animate-ping rounded-full bg-blue-500/10" />
                      <div className="relative flex size-8 items-center justify-center rounded-full bg-blue-500/10 ring-1 ring-blue-500/20">
                        <Loader2 className="size-3.5 animate-spin text-blue-400" />
                      </div>
                    </div>
                    <p className="text-xs text-white/40">Generating with {modelLabel(model)}…</p>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Clear chat */}
              {messages.length > 0 && !isStreaming && (
                <button
                  onClick={() => setMessages([])}
                  className="mt-4 flex items-center gap-1 self-center rounded-md px-2 py-1 text-[10px] text-white/20 transition-colors hover:text-white/40"
                >
                  <X className="size-3" /> Clear chat
                </button>
              )}
            </div>
          </div>

          {/* ── Footer: Input + Model + Generate ────────────────────────────────── */}
          <div className="shrink-0 border-t border-white/[0.05] px-4 py-3">
            <div className="flex items-end gap-2">
              <textarea
                ref={chatInputRef}
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault()
                    sendChat()
                  }
                }}
                placeholder={
                  articles.length > 0
                    ? "Ask or request a draft…"
                    : "Ask anything… (load articles for context)"
                }
                rows={2}
                className="flex-1 resize-none rounded-xl border border-white/[0.08] bg-white/[0.04] px-3 py-2 text-xs text-white/80 placeholder:text-white/25 focus:border-blue-500/30 focus:bg-white/[0.06] focus:outline-none"
              />
              <button
                onClick={sendChat}
                disabled={isStreaming || !chatInput.trim()}
                className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-blue-500/20 text-blue-400 transition-all hover:bg-blue-500/30 disabled:cursor-not-allowed disabled:opacity-30"
              >
                {isStreaming ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <Send className="size-3.5" />
                )}
              </button>
            </div>

            {/* Model selector + Generate button row */}
            <div className="mt-3 flex gap-2">
              <ModelPicker value={model} onChange={setModel} />
              <button
                onClick={generate}
                disabled={isGenerating || articles.length === 0}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-blue-500/20 px-3 py-1.5 text-xs font-medium text-blue-300 transition-all hover:bg-blue-500/30 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="size-3 animate-spin" /> Generating…
                  </>
                ) : (
                  <>
                    <Sparkles className="size-3" /> Generate
                  </>
                )}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

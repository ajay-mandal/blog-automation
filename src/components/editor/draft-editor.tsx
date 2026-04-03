"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"

type DraftEditorProps = {
  id: string
  initialTitle: string
  initialContent: string
  articleTitle?: string
}

export function DraftEditor({ id, initialTitle, initialContent }: DraftEditorProps) {
  const router = useRouter()
  const [title, setTitle] = useState(initialTitle)
  const [content, setContent] = useState(initialContent)
  const [isSaving, setIsSaving] = useState(false)
  const [isGeneratingImage, setIsGeneratingImage] = useState(false)

  async function saveDraft() {
    if (!title.trim() || !content.trim()) {
      toast.error("Title and content are required")
      return
    }

    setIsSaving(true)
    try {
      const res = await fetch(`/api/generated-blogs/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: title.trim(), contentMd: content.trim() }),
      })

      if (!res.ok) {
        toast.error("Failed to save draft")
        return
      }

      toast.success("Draft saved successfully")
      router.refresh()
    } finally {
      setIsSaving(false)
    }
  }

  async function saveAndGenerateImage() {
    if (!title.trim() || !content.trim()) {
      toast.error("Title and content are required")
      return
    }

    setIsGeneratingImage(true)
    try {
      // First, save the draft
      const saveRes = await fetch(`/api/generated-blogs/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          contentMd: content.trim(),
          status: "reviewed",
        }),
      })

      if (!saveRes.ok) {
        toast.error("Failed to save draft")
        return
      }

      toast.success("Draft saved and marked as reviewed. Generating image...")
      router.push(`/blogs/${id}/publish`)
    } finally {
      setIsGeneratingImage(false)
    }
  }

  return (
    <div className="rounded-xl border border-white/[0.06] bg-[#0a1220] p-6">
      <h2 className="mb-4 text-sm font-semibold text-white/80">Edit Draft Content</h2>

      {/* Title */}
      <div className="mb-4">
        <label className="mb-1.5 block text-xs font-medium text-[#7a99bb]">Title</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full rounded-lg border border-white/[0.08] bg-white/[0.04] px-3 py-2 text-sm text-white placeholder:text-[#3a5070] focus:border-blue-500/30 focus:bg-white/[0.06] focus:outline-none"
        />
      </div>

      {/* Content textarea */}
      <div className="mb-4">
        <label className="mb-1.5 block text-xs font-medium text-[#7a99bb]">
          Content (Markdown)
        </label>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="h-96 w-full rounded-lg border border-white/[0.08] bg-white/[0.04] px-3 py-2 font-mono text-sm text-white placeholder:text-[#3a5070] focus:border-blue-500/30 focus:bg-white/[0.06] focus:outline-none"
        />
      </div>

      {/* Action buttons */}
      <div className="flex gap-2">
        <Button
          onClick={saveDraft}
          disabled={isSaving || isGeneratingImage}
          className="flex-1 bg-blue-500/20 text-blue-300 hover:bg-blue-500/30"
        >
          {isSaving ? (
            <>
              <Loader2 className="size-3 animate-spin" />
              Saving...
            </>
          ) : (
            "Save Draft"
          )}
        </Button>
        <Button
          onClick={saveAndGenerateImage}
          disabled={isSaving || isGeneratingImage}
          className="flex-1 bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30"
        >
          {isGeneratingImage ? (
            <>
              <Loader2 className="size-3 animate-spin" />
              Saving...
            </>
          ) : (
            "Save & Move to Image"
          )}
        </Button>
      </div>
    </div>
  )
}

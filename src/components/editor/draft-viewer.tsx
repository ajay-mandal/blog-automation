"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Link as LinkIcon, Loader2 } from "lucide-react"
import { toast } from "sonner"
import Link from "next/link"
import { Button } from "@/components/ui/button"

type DraftViewerProps = {
  id: string
  title: string
  status: string
  htmlContent: string
  sourceArticleUrl?: string
}

export function DraftViewer({ id, status, htmlContent, sourceArticleUrl }: DraftViewerProps) {
  const router = useRouter()
  const [isMarking, setIsMarking] = useState(false)

  async function markAsReviewed() {
    setIsMarking(true)
    try {
      const res = await fetch(`/api/generated-blogs/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "reviewed" }),
      })

      if (!res.ok) {
        toast.error("Failed to mark as reviewed")
        return
      }

      toast.success("Marked as reviewed")
      router.refresh()
      router.push(`/blogs/${id}/publish`)
    } finally {
      setIsMarking(false)
    }
  }

  return (
    <>
      <div className="mx-auto max-w-3xl rounded-xl border border-white/[0.06] bg-[#0a1220] p-8">
        {/* Rendered markdown */}
        <div
          className="prose prose-invert max-w-none"
          dangerouslySetInnerHTML={{ __html: htmlContent }}
        />

        {/* Action buttons */}
        <div className="mt-8 flex gap-2 border-t border-white/[0.05] pt-6">
          <Link
            href={`/blogs/${id}/edit`}
            className="flex-1 rounded-lg bg-blue-500/20 px-4 py-2 text-center text-sm font-medium text-blue-300 transition-colors hover:bg-blue-500/30"
          >
            Edit Draft
          </Link>
          {status === "draft" && (
            <Button
              onClick={markAsReviewed}
              disabled={isMarking}
              className="flex-1 bg-amber-500/20 text-amber-300 hover:bg-amber-500/30"
            >
              {isMarking ? (
                <>
                  <Loader2 className="size-3 animate-spin" />
                  Marking...
                </>
              ) : (
                "Mark as Reviewed"
              )}
            </Button>
          )}
          {status === "reviewed" && (
            <Link
              href={`/blogs/${id}/publish`}
              className="flex-1 rounded-lg bg-emerald-500/20 px-4 py-2 text-center text-sm font-medium text-emerald-300 transition-colors hover:bg-emerald-500/30"
            >
              Continue to Image
            </Link>
          )}
        </div>
      </div>

      {/* Source article link */}
      {sourceArticleUrl && (
        <div className="mt-4 text-right">
          <a
            href={sourceArticleUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300"
          >
            View source article <LinkIcon className="size-3" />
          </a>
        </div>
      )}
    </>
  )
}

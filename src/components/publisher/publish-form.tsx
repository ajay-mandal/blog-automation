"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { toast } from "sonner"
import { Loader2, Sparkles, ImageIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

type PublishFormProps = {
  id: string
  initialSlug: string
  initialCategory: string
  initialTags: string[]
  initialCoverImage?: string
  title: string
}

export function PublishForm({
  id,
  initialSlug,
  initialCategory,
  initialTags,
  initialCoverImage,
  title,
}: PublishFormProps) {
  const router = useRouter()
  const [slug, setSlug] = useState(initialSlug)
  const [category, setCategory] = useState(initialCategory)
  const [tagsString, setTagsString] = useState(initialTags.join(", "))
  const [coverImage, setCoverImage] = useState(initialCoverImage || "")
  const [isPublishing, setIsPublishing] = useState(false)
  const [isGeneratingImage, setIsGeneratingImage] = useState(false)

  async function generateCoverImage() {
    setIsGeneratingImage(true)
    try {
      const res = await fetch(`/api/generated-blogs/${id}/generate-image`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      })

      if (!res.ok) {
        toast.error("Failed to generate image")
        return
      }

      const { coverImageUrl } = (await res.json()) as { coverImageUrl: string }
      setCoverImage(coverImageUrl)
      toast.success("Cover image generated successfully")
    } finally {
      setIsGeneratingImage(false)
    }
  }

  async function publish() {
    // Validate inputs
    if (!slug.trim()) {
      toast.error("Slug is required")
      return
    }

    if (!["findings", "project"].includes(category)) {
      toast.error("Invalid category")
      return
    }

    setIsPublishing(true)
    try {
      const tags = tagsString
        .split(",")
        .map((t) => t.trim())
        .filter((t) => t.length > 0)

      const res = await fetch(`/api/generated-blogs/${id}/publish`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug: slug.trim(),
          category,
          tags,
          coverImageUrl: coverImage.trim() || undefined,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        toast.error(data.error || "Failed to publish")
        return
      }

      toast.success("Published successfully!")
      router.push("/blogs")
    } finally {
      setIsPublishing(false)
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* Cover Image Section */}
      <div className="rounded-xl border border-white/[0.06] bg-[#0a1220] p-6">
        <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-white/80">
          <ImageIcon className="size-4" />
          Cover Image
        </h2>

        {coverImage ? (
          <div className="space-y-3">
            <Image
              src={coverImage}
              alt={title}
              width={800}
              height={480}
              className="h-48 w-full rounded-lg object-cover"
            />
            <p className="text-xs text-[#3a5070]">{coverImage}</p>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed border-white/[0.08] p-8">
            <Sparkles className="size-8 text-[#3a5070]" />
            <p className="text-sm font-medium text-white/60">No cover image</p>
            <Button
              onClick={generateCoverImage}
              disabled={isGeneratingImage}
              className="bg-blue-500/20 text-xs text-blue-300 hover:bg-blue-500/30"
            >
              {isGeneratingImage ? (
                <>
                  <Loader2 className="size-3 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="size-3" />
                  Generate with AI
                </>
              )}
            </Button>
          </div>
        )}
      </div>

      {/* Publish Details */}
      <div className="rounded-xl border border-white/[0.06] bg-[#0a1220] p-6">
        <h2 className="mb-4 text-sm font-semibold text-white/80">Publish Details</h2>

        <div className="space-y-3">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-[#7a99bb]">Slug</label>
            <input
              type="text"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              className="w-full rounded-lg border border-white/[0.08] bg-white/[0.04] px-3 py-2 text-sm text-white placeholder:text-[#3a5070]"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-[#7a99bb]">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full rounded-lg border border-white/[0.08] bg-white/[0.04] px-3 py-2 text-sm text-white"
            >
              <option value="findings">Findings</option>
              <option value="project">Project</option>
            </select>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-[#7a99bb]">Tags</label>
            <input
              type="text"
              value={tagsString}
              onChange={(e) => setTagsString(e.target.value)}
              placeholder="tag1, tag2, tag3"
              className="w-full rounded-lg border border-white/[0.08] bg-white/[0.04] px-3 py-2 text-sm text-white placeholder:text-[#3a5070]"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-[#7a99bb]">
              Cover Image URL
            </label>
            <input
              type="url"
              value={coverImage}
              onChange={(e) => setCoverImage(e.target.value)}
              placeholder="https://example.com/image.jpg"
              className="w-full rounded-lg border border-white/[0.08] bg-white/[0.04] px-3 py-2 text-sm text-white placeholder:text-[#3a5070]"
            />
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex gap-2">
        <Link
          href={`/blogs/${id}/view`}
          className="flex-1 rounded-lg border border-white/[0.08] bg-white/[0.04] px-4 py-2 text-center text-sm font-medium text-white/60 transition-colors hover:bg-white/[0.06]"
        >
          Back to Preview
        </Link>
        <Button
          onClick={publish}
          disabled={isPublishing}
          className="flex-1 bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30"
        >
          {isPublishing ? (
            <>
              <Loader2 className="size-3 animate-spin" />
              Publishing...
            </>
          ) : (
            "Publish to Portfolio"
          )}
        </Button>
      </div>
    </div>
  )
}

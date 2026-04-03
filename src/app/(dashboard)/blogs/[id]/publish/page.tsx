import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import { BlogPipeline } from "@/components/publisher/blog-pipeline"
import { PublishForm } from "@/components/publisher/publish-form"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

export default async function PublishBlogPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const draft = await prisma.generatedBlog.findUnique({
    where: { id },
    include: { article: { select: { id: true, title: true } } },
  })

  if (!draft) notFound()

  return (
    <div className="flex flex-col">
      {/* Header */}
      <div className="border-b border-white/[0.05] bg-[#060d18]/60 px-6 py-4 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <Link
            href="/blogs"
            className="flex size-9 items-center justify-center rounded-lg border border-white/[0.08] hover:bg-white/[0.04]"
          >
            <ArrowLeft className="size-4" />
          </Link>
          <div>
            <h1 className="text-[15px] font-semibold text-white/90">Publish Blog</h1>
            <p className="mt-0.5 text-xs text-[#3a5070]">{draft.title}</p>
          </div>
        </div>
      </div>

      {/* Pipeline - image step active */}
      <div className="border-b border-white/[0.05] px-6 py-4">
        <BlogPipeline
          currentStep="image"
          status={draft.status as "draft" | "reviewed" | "published"}
        />
      </div>

      {/* Content */}
      <div className="flex-1 p-6">
        <PublishForm
          id={id}
          initialSlug={draft.slug}
          initialCategory={draft.category}
          initialTags={draft.tags}
          initialCoverImage={draft.coverImageUrl || undefined}
          title={draft.title}
        />
      </div>
    </div>
  )
}

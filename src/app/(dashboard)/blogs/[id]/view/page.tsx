import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import { BlogPipeline } from "@/components/publisher/blog-pipeline"
import { DraftViewer } from "@/components/editor/draft-viewer"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { marked } from "marked"

export default async function ViewBlogPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const draft = await prisma.generatedBlog.findUnique({
    where: { id },
    include: { article: { select: { id: true, title: true, url: true } } },
  })

  if (!draft) notFound()

  // Render markdown to HTML
  let htmlContent = ""
  if (draft.contentMd) {
    htmlContent = await marked(draft.contentMd)
  }

  return (
    <div className="flex flex-col">
      {/* Header */}
      <div className="border-b border-white/[0.05] bg-[#060d18]/60 px-6 py-4 backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/blogs"
              className="flex size-9 items-center justify-center rounded-lg border border-white/[0.08] hover:bg-white/[0.04]"
            >
              <ArrowLeft className="size-4" />
            </Link>
            <div>
              <h1 className="text-[15px] font-semibold text-white/90">{draft.title}</h1>
              <p className="mt-0.5 text-xs text-[#3a5070]">
                Version {draft.version} · {draft.status}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Pipeline */}
      <div className="border-b border-white/[0.05] px-6 py-4">
        <BlogPipeline
          currentStep="draft"
          status={draft.status as "draft" | "reviewed" | "published"}
        />
      </div>

      {/* Content */}
      <div className="flex-1 p-6">
        <DraftViewer
          id={id}
          title={draft.title}
          status={draft.status}
          htmlContent={htmlContent}
          sourceArticleUrl={draft.article?.url}
        />
      </div>
    </div>
  )
}

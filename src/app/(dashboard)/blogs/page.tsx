import { prisma } from "@/lib/prisma"
import { Suspense } from "react"
import { FileText, Edit2, Eye, Send } from "lucide-react"

export const dynamic = "force-dynamic"

type SearchParams = {
  status?: string
  page?: string
}

async function DraftsList({ searchParams }: { searchParams: SearchParams }) {
  const page = Math.max(1, parseInt(searchParams.page ?? "1", 10) || 1)
  const PAGE_SIZE = 12

  const where = searchParams.status ? { status: searchParams.status } : {}

  const [drafts, total] = await Promise.all([
    prisma.generatedBlog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: { article: { select: { id: true, title: true, url: true, source: true } } },
    }),
    prisma.generatedBlog.count({ where }),
  ])

  if (drafts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-white/[0.06] bg-[#0a1220] py-20">
        <div className="flex size-12 items-center justify-center rounded-xl bg-white/[0.04]">
          <FileText className="size-5 text-[#3a5070]" />
        </div>
        <p className="text-sm font-medium text-[#4a6080]">No drafts yet</p>
        <p className="text-xs text-[#2a3a50]">
          Select articles from Feed and generate to see drafts here
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Count bar */}
      <p className="text-xs text-[#3a5070]">
        {total.toLocaleString()} draft{total !== 1 ? "s" : ""}
        {Math.ceil(total / PAGE_SIZE) > 1 && (
          <span className="ml-1 text-[#2a3a50]">
            · page {page} of {Math.ceil(total / PAGE_SIZE)}
          </span>
        )}
      </p>

      {/* Grid */}
      <div className="grid gap-3 lg:grid-cols-2 xl:grid-cols-3">
        {drafts.map((draft) => (
          <div
            key={draft.id}
            className="flex flex-col rounded-xl border border-white/[0.07] bg-[#0a1220] p-4 transition-all hover:border-white/[0.12] hover:shadow-lg hover:shadow-black/30"
          >
            {/* Header */}
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <h3 className="line-clamp-2 text-sm font-semibold text-white/90">{draft.title}</h3>
                <p className="mt-1 text-[10px] text-[#3a5070]">
                  {draft.article?.title && draft.article.title.substring(0, 40)}
                </p>
              </div>
              <span
                className={`shrink-0 rounded-full px-2 py-0.5 text-[9px] font-medium ${
                  draft.status === "draft"
                    ? "bg-blue-500/15 text-blue-400"
                    : draft.status === "reviewed"
                      ? "bg-purple-500/15 text-purple-400"
                      : "bg-emerald-500/15 text-emerald-400"
                }`}
              >
                {draft.status}
              </span>
            </div>

            {/* Content preview */}
            {draft.contentMd && (
              <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-[#5e7aa0]">
                {draft.contentMd.replace(/^#+\s+/, "").substring(0, 120)}...
              </p>
            )}

            {/* Meta */}
            <div className="mt-3 flex items-center gap-2 border-t border-white/[0.05] pt-3 text-[10px] text-[#3a5070]">
              <FileText className="size-2.5" />v{draft.version} · {draft.aiModel.split("-").pop()}
            </div>

            {/* Actions */}
            <div className="mt-3 flex gap-1.5">
              <a
                href={`/blogs/${draft.id}/edit`}
                className="flex flex-1 items-center justify-center gap-1 rounded-lg border border-white/[0.08] bg-white/[0.04] py-1.5 text-[11px] font-medium text-[#7a99bb] transition-colors hover:bg-white/[0.06] hover:text-white/70"
              >
                <Edit2 className="size-3" />
                Edit
              </a>
              <a
                href={`/blogs/${draft.id}/view`}
                className="flex flex-1 items-center justify-center gap-1 rounded-lg border border-white/[0.08] bg-white/[0.04] py-1.5 text-[11px] font-medium text-[#7a99bb] transition-colors hover:bg-white/[0.06] hover:text-white/70"
              >
                <Eye className="size-3" />
                Preview
              </a>
              {draft.status === "reviewed" && (
                <a
                  href={`/blogs/${draft.id}/publish`}
                  className="flex flex-1 items-center justify-center gap-1 rounded-lg border border-emerald-500/20 bg-emerald-500/10 py-1.5 text-[11px] font-medium text-emerald-400 transition-colors hover:bg-emerald-500/15"
                >
                  <Send className="size-3" />
                  Publish
                </a>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default async function BlogsPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams

  return (
    <div className="flex flex-col">
      <div className="border-b border-white/[0.05] bg-[#060d18]/60 px-6 py-4 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-xl bg-blue-500/10 ring-1 ring-blue-500/20">
            <FileText className="size-4 text-blue-400" />
          </div>
          <div>
            <h1 className="text-[15px] font-semibold tracking-[-0.02em] text-white/90">
              Blog Drafts
            </h1>
            <p className="mt-0.5 text-xs text-[#3a5070]">
              Create, edit, and publish AI-generated blog posts
            </p>
          </div>
        </div>
      </div>

      <div className="p-6">
        <Suspense
          fallback={<div className="text-center text-sm text-[#3a5070]">Loading drafts...</div>}
        >
          <DraftsList searchParams={params} />
        </Suspense>
      </div>
    </div>
  )
}

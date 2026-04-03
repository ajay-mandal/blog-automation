import { prisma } from "@/lib/prisma"
import { AddSourceDialog } from "@/components/sources/add-source-dialog"
import { SourcesList } from "@/components/sources/sources-list"
import { FetchAllButton } from "@/components/sources/fetch-all-button"
import { Rss } from "lucide-react"

export const dynamic = "force-dynamic"

export default async function SourcesPage() {
  const sources = await prisma.source.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { articles: true } } },
  })

  const activeSources = sources.filter((s) => s.active)
  const totalArticles = sources.reduce((sum, s) => sum + s._count.articles, 0)
  const recentlyFetched = sources.filter((s) => s.lastFetchedAt).length

  return (
    <div className="flex flex-col">
      {/* Header */}
      <div className="border-b border-white/[0.05] bg-[#060d18]/60 px-6 py-4 backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-xl bg-blue-500/10 ring-1 ring-blue-500/20">
              <Rss className="size-4 text-blue-400" />
            </div>
            <div>
              <h1 className="text-[15px] font-semibold tracking-[-0.02em] text-white/90">
                News Sources
              </h1>
              <p className="mt-0.5 text-xs text-[#3a5070]">Manage RSS feeds and blog sources</p>
            </div>
          </div>
          <AddSourceDialog />
        </div>
      </div>

      {/* Stats */}
      <div className="border-b border-white/[0.04] bg-[#050b15]/40 px-6 py-3">
        <div className="flex gap-4">
          <div>
            <p className="text-[10px] tracking-wider text-[#3a5070] uppercase">Sources</p>
            <p className="text-sm font-semibold text-white/80">{sources.length}</p>
          </div>
          <div className="h-8 w-px bg-white/[0.05]" />
          <div>
            <p className="text-[10px] tracking-wider text-[#3a5070] uppercase">Articles</p>
            <p className="text-sm font-semibold text-white/80">{totalArticles.toLocaleString()}</p>
          </div>
          <div className="h-8 w-px bg-white/[0.05]" />
          <div>
            <p className="text-[10px] tracking-wider text-[#3a5070] uppercase">Fetched</p>
            <p className="text-sm font-semibold text-white/80">{recentlyFetched}</p>
          </div>
          {activeSources.length > 0 && (
            <>
              <div className="ml-auto h-8 w-px bg-white/[0.05]" />
              <FetchAllButton sourceIds={activeSources.map((s) => s.id)} />
            </>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        <SourcesList sources={sources} />
      </div>
    </div>
  )
}

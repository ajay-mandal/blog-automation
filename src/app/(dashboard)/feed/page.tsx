import { prisma } from "@/lib/prisma"
import { ArticleCard } from "@/components/feed/article-card"
import { FeedFilters } from "@/components/feed/feed-filters"
import { DiscardAllButton } from "@/components/feed/discard-all-button"
import { AiPanel } from "@/components/feed/ai-panel"
import { Suspense } from "react"
import { Newspaper, Sparkles, LayoutGrid } from "lucide-react"

const PAGE_SIZE = 48 // divisible by 2, 3, 4 for clean grid rows

type SearchParams = {
  status?: string
  sourceId?: string
  page?: string
  q?: string
}

type Article = {
  id: string
  title: string
  url: string
  summary: string | null
  author: string | null
  publishedAt: Date | null
  fetchedAt: Date
  status: string
  source: { id: string; name: string; category: string | null }
}

function GridSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="overflow-hidden rounded-xl border border-white/[0.06] bg-[#0a1220]">
          <div className="aspect-video w-full animate-pulse bg-gradient-to-r from-[#0a1628] via-[#0f2040]/60 to-[#0a1628]" />
          <div className="flex flex-col gap-2 p-3">
            <div className="h-3 w-3/4 animate-pulse rounded bg-white/5" />
            <div className="h-3 w-full animate-pulse rounded bg-white/[0.03]" />
            <div className="h-3 w-2/3 animate-pulse rounded bg-white/[0.03]" />
          </div>
        </div>
      ))}
    </div>
  )
}

async function ArticleGrid({ searchParams }: { searchParams: SearchParams }) {
  const page = Math.max(1, parseInt(searchParams.page ?? "1", 10) || 1)
  const where: Record<string, unknown> = {
    ...(searchParams.status ? { status: searchParams.status } : {}),
    ...(searchParams.sourceId ? { sourceId: searchParams.sourceId } : {}),
  }

  // Add content search
  if (searchParams.q && searchParams.q.trim()) {
    const query = searchParams.q.trim().toLowerCase()
    where.OR = [
      { title: { contains: query, mode: "insensitive" as const } },
      { summary: { contains: query, mode: "insensitive" as const } },
    ]
  }

  const [articles, total] = await Promise.all([
    prisma.article.findMany({
      where,
      orderBy: { fetchedAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: { source: { select: { id: true, name: true, category: true } } },
    }),
    prisma.article.count({ where }),
  ])

  if (articles.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-white/[0.06] bg-[#0a1220] py-20">
        <div className="flex size-12 items-center justify-center rounded-xl bg-white/[0.04]">
          <Newspaper className="size-5 text-[#3a5070]" />
        </div>
        <p className="text-sm font-medium text-[#4a6080]">
          {total === 0 ? "No articles yet" : "No articles match this filter"}
        </p>
        <p className="text-xs text-[#2a3a50]">
          {total === 0 ? "Add sources and fetch to see articles here" : "Try a different filter"}
        </p>
      </div>
    )
  }

  const totalPages = Math.ceil(total / PAGE_SIZE)

  return (
    <div className="flex flex-col gap-4">
      {/* Count bar */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-[#3a5070]">
          {total.toLocaleString()} article{total !== 1 ? "s" : ""}
          {totalPages > 1 && (
            <span className="ml-1 text-[#2a3a50]">
              · page {page} of {totalPages}
            </span>
          )}
        </p>
        <div className="flex items-center gap-1 text-[10px] text-[#2a3a50]">
          <LayoutGrid className="size-3" />
          {articles.length} shown
        </div>
      </div>

      {/* Card grid — narrower since right panel takes ~380px */}
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-3">
        {(articles as Article[]).map((article) => (
          <ArticleCard
            key={article.id}
            article={{
              ...article,
              publishedAt: article.publishedAt?.toISOString() ?? null,
              fetchedAt: article.fetchedAt.toISOString(),
            }}
          />
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 pt-2">
          {page > 1 && (
            <a
              href={`?${new URLSearchParams({
                ...(searchParams.status ? { status: searchParams.status } : {}),
                ...(searchParams.sourceId ? { sourceId: searchParams.sourceId } : {}),
                page: String(page - 1),
              })}`}
              className="rounded-lg border border-white/[0.08] bg-white/[0.04] px-4 py-1.5 text-xs text-[#7a99bb] transition-colors hover:bg-white/[0.08] hover:text-white/70"
            >
              ← Previous
            </a>
          )}
          <span className="text-xs text-[#3a5070]">
            {page} / {totalPages}
          </span>
          {page < totalPages && (
            <a
              href={`?${new URLSearchParams({
                ...(searchParams.status ? { status: searchParams.status } : {}),
                ...(searchParams.sourceId ? { sourceId: searchParams.sourceId } : {}),
                page: String(page + 1),
              })}`}
              className="rounded-lg border border-white/[0.08] bg-white/[0.04] px-4 py-1.5 text-xs text-[#7a99bb] transition-colors hover:bg-white/[0.08] hover:text-white/70"
            >
              Next →
            </a>
          )}
        </div>
      )}
    </div>
  )
}

export default async function FeedPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams

  const [sources, selectedCount, totalCount, newCount] = await Promise.all([
    prisma.source.findMany({
      where: { active: true },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    prisma.article.count({ where: { status: "selected" } }),
    prisma.article.count(),
    prisma.article.count({ where: { status: "new" } }),
  ])

  return (
    // Two-column layout: article feed (left, scrollable) + AI panel (right, fixed)
    <div className="flex h-full overflow-hidden">
      {/* ── Left: feed ─────────────────────────────── */}
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        {/* Page header */}
        <div className="shrink-0 border-b border-white/[0.05] bg-[#060d18]/60 px-6 py-4 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex size-9 items-center justify-center rounded-xl bg-blue-500/10 ring-1 ring-blue-500/20">
                <Newspaper className="size-4 text-blue-400" />
              </div>
              <div>
                <h1 className="text-[15px] font-semibold tracking-[-0.02em] text-white/90">
                  Article Feed
                </h1>
                <div className="mt-0.5 flex items-center gap-2">
                  <span className="text-[11px] text-[#3a5070]">
                    {totalCount.toLocaleString()} total
                  </span>
                  {newCount > 0 && (
                    <span className="rounded-full bg-[#0f2040] px-2 py-0.5 text-[10px] font-medium text-[#5588cc]">
                      {newCount} new
                    </span>
                  )}
                  {selectedCount > 0 && (
                    <span className="flex items-center gap-1 rounded-full bg-blue-500/15 px-2 py-0.5 text-[10px] font-medium text-blue-400">
                      <Sparkles className="size-2.5" />
                      {selectedCount} selected
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {selectedCount > 0 && <DiscardAllButton selectedCount={selectedCount} />}
            </div>
          </div>
        </div>

        {/* Filters bar */}
        <div className="shrink-0 border-b border-white/[0.04] bg-[#050b15]/40 px-6 py-2.5">
          <Suspense>
            <FeedFilters sources={sources} />
          </Suspense>
        </div>

        {/* Scrollable article grid */}
        <div className="flex-1 overflow-y-auto p-6">
          <Suspense fallback={<GridSkeleton />}>
            <ArticleGrid searchParams={params} />
          </Suspense>
        </div>
      </div>

      {/* ── Right: AI panel (always visible) ────────── */}
      <AiPanel />
    </div>
  )
}

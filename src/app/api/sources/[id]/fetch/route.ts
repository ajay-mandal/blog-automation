import Parser from "rss-parser"
import { prisma } from "@/lib/prisma"
import { scrapeHtmlPage, type ScrapedArticle } from "@/lib/html-scraper"

const parser = new Parser()

type ArticleInput = {
  title: string
  url: string
  summary: string | null
  author: string | null
  publishedAt: Date | null
}

/** Attempt RSS/Atom parse. Returns null if the URL is not a feed. */
async function tryRss(url: string): Promise<ArticleInput[] | null> {
  try {
    const feed = await parser.parseURL(url)
    return (feed.items ?? []).flatMap((item) => {
      const articleUrl = item.link ?? item.guid
      if (!articleUrl) return []
      const pubDate =
        item.pubDate || item.isoDate ? new Date(item.pubDate ?? item.isoDate ?? "") : null
      return [
        {
          title: item.title ?? "Untitled",
          url: articleUrl,
          summary: item.contentSnippet ?? item.summary ?? null,
          author: item.creator ?? item.author ?? null,
          publishedAt: pubDate && !isNaN(pubDate.getTime()) ? pubDate : null,
        },
      ]
    })
  } catch {
    return null
  }
}

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const source = await prisma.source.findUnique({ where: { id } })
  if (!source) {
    return Response.json({ error: "Source not found" }, { status: 404 })
  }

  // ── 1. Try RSS/Atom first ──────────────────────────────────────────────────
  let items: ArticleInput[] | null = await tryRss(source.url)

  // ── 2. Fall back to HTML scraping ─────────────────────────────────────────
  if (items === null) {
    try {
      const result = await scrapeHtmlPage(source.url)

      if (result.type === "rss") {
        // Page had an RSS autodiscovery link — use that feed
        items = await tryRss(result.feedUrl)
        if (items === null) {
          return Response.json(
            { error: "Autodiscovered RSS feed could not be parsed." },
            { status: 502 }
          )
        }
      } else {
        items = result.articles.map((a: ScrapedArticle) => ({
          title: a.title,
          url: a.url,
          summary: a.summary,
          author: a.author,
          publishedAt: a.publishedAt,
        }))
      }
    } catch (err) {
      console.error(`[fetch source ${id}] HTML scrape failed`, err)
      return Response.json(
        { error: "Failed to fetch the page. Make sure the URL is publicly accessible." },
        { status: 502 }
      )
    }
  }

  if (items.length === 0) {
    return Response.json(
      { error: "No articles found at this URL. The page may require JavaScript or a login." },
      { status: 422 }
    )
  }

  // ── 3. Upsert articles ────────────────────────────────────────────────────
  let created = 0
  let skipped = 0

  for (const item of items) {
    try {
      await prisma.article.upsert({
        where: { url: item.url },
        create: {
          sourceId: id,
          title: item.title,
          url: item.url,
          summary: item.summary,
          author: item.author,
          publishedAt: item.publishedAt,
          status: "new",
        },
        update: {},
      })
      created++
    } catch {
      skipped++
    }
  }

  await prisma.source.update({
    where: { id },
    data: { lastFetchedAt: new Date() },
  })

  return Response.json({ fetched: items.length, created, skipped })
}

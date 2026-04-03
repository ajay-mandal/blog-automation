import * as cheerio from "cheerio"

export type ScrapedArticle = {
  title: string
  url: string
  summary: string | null
  author: string | null
  publishedAt: Date | null
}

export type ScrapeResult =
  | { type: "rss"; feedUrl: string }
  | { type: "articles"; articles: ScrapedArticle[] }

/**
 * Fetches a blog/news HTML page and either:
 * - Returns the autodiscovered RSS/Atom feed URL, or
 * - Scrapes article links from the page HTML
 */
export async function scrapeHtmlPage(pageUrl: string): Promise<ScrapeResult> {
  const res = await fetch(pageUrl, {
    headers: {
      "User-Agent": "Mozilla/5.0 (compatible; BlogFetcher/1.0; +https://ajaymandal.com)",
      Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    },
    // Next.js: do not cache — we always want fresh results
    cache: "no-store",
  })

  if (!res.ok) {
    throw new Error(`HTTP ${res.status} fetching ${pageUrl}`)
  }

  const html = await res.text()
  const $ = cheerio.load(html)
  const base = new URL(pageUrl)

  // ── Step 1: Check for RSS/Atom autodiscovery ───────────────────────────────
  const feedLink =
    $('link[rel="alternate"][type="application/rss+xml"]').attr("href") ??
    $('link[rel="alternate"][type="application/atom+xml"]').attr("href")

  if (feedLink) {
    const feedUrl = feedLink.startsWith("http") ? feedLink : new URL(feedLink, base).href
    return { type: "rss", feedUrl }
  }

  // ── Step 2: Scrape article links from HTML ─────────────────────────────────
  const articles: ScrapedArticle[] = []
  const seen = new Set<string>()

  function resolveUrl(href: string): string {
    return href.startsWith("http") ? href : new URL(href, base).href
  }

  function parseDate(str: string): Date | null {
    if (!str) return null
    const d = new Date(str)
    return isNaN(d.getTime()) ? null : d
  }

  function extractText($el: cheerio.Cheerio<ReturnType<typeof $>["0"]>): string {
    return $el.text().replace(/\s+/g, " ").trim()
  }

  // Strategy A: semantic <article> elements
  $("article").each((_, el) => {
    const $el = $(el)

    // Prefer the first heading's link, fall back to any link
    const $headingLink = $el.find("h1 a, h2 a, h3 a, h4 a").first()
    const $anyLink = $el.find("a[href]").first()
    const $link = $headingLink.length ? $headingLink : $anyLink

    const href = $link.attr("href")
    if (!href) return

    const url = resolveUrl(href)
    if (seen.has(url) || url === pageUrl) return
    seen.add(url)

    const title = extractText($el.find("h1, h2, h3, h4").first()) || extractText($link)
    if (!title) return

    const $time = $el.find("time").first()
    const dateStr = $time.attr("datetime") ?? $time.text().trim()
    const publishedAt = parseDate(dateStr)

    const $summary = $el.find("p").first()
    const summary = extractText($summary) || null

    const authorRaw = extractText($el.find('[class*="author"], [rel="author"]').first())
    const author = authorRaw || null

    articles.push({ title, url, summary, author, publishedAt })
  })

  // Strategy B: heading links (h2/h3 with href — common in listing/index pages)
  if (articles.length === 0) {
    $("h2 a[href], h3 a[href]").each((_, el) => {
      const $el = $(el)
      const href = $el.attr("href")
      if (!href) return

      const url = resolveUrl(href)
      if (seen.has(url) || url === pageUrl) return

      // Only include links that look like individual post URLs
      // (have a path segment beyond the listing path)
      try {
        const parsed = new URL(url)
        const listingPath = base.pathname.replace(/\/$/, "")
        if (!parsed.pathname.startsWith(listingPath + "/")) return
      } catch {
        return
      }

      seen.add(url)

      const title = extractText($el)
      if (!title) return

      // Look sibling/parent for date and summary
      const $parent = $el.closest("li, div, section")
      const $time = $parent.find("time").first()
      const dateStr = $time.attr("datetime") ?? $time.text().trim()
      const publishedAt = parseDate(dateStr)

      const $summary = $parent.find("p").first()
      const summary = extractText($summary) || null

      articles.push({ title, url, summary: summary || null, author: null, publishedAt })
    })
  }

  // Strategy C: any link whose href is a sub-path of the current URL
  // (last resort fallback — e.g. minimal or custom blog layouts)
  if (articles.length === 0) {
    $("a[href]").each((_, el) => {
      const $el = $(el)
      const href = $el.attr("href")
      if (!href) return

      const url = resolveUrl(href)
      if (seen.has(url) || url === pageUrl) return

      try {
        const parsed = new URL(url)
        if (parsed.origin !== base.origin) return
        const listingPath = base.pathname.replace(/\/$/, "")
        if (!parsed.pathname.startsWith(listingPath + "/")) return
        if (parsed.pathname === listingPath + "/") return
      } catch {
        return
      }

      seen.add(url)
      const title = extractText($el)
      if (!title || title.length < 10) return

      articles.push({ title, url, summary: null, author: null, publishedAt: null })
    })
  }

  return { type: "articles", articles }
}

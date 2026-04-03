import * as cheerio from "cheerio"
import { z } from "zod"

const QuerySchema = z.object({
  url: z.string().url(),
})

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const parsed = QuerySchema.safeParse({ url: searchParams.get("url") })

  if (!parsed.success) {
    return Response.json({ imageUrl: null }, { status: 400 })
  }

  const { url } = parsed.data

  // Only allow http/https to prevent SSRF
  const parsedUrl = new URL(url)
  if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") {
    return Response.json({ imageUrl: null }, { status: 400 })
  }

  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; BlogFetcher/1.0)",
        Accept: "text/html,application/xhtml+xml",
      },
      // Cache for 24h in Next.js data cache
      next: { revalidate: 86400 },
    })

    if (!res.ok) return Response.json({ imageUrl: null })

    const html = await res.text()
    const $ = cheerio.load(html)

    let imageUrl =
      $('meta[property="og:image"]').attr("content") ??
      $('meta[name="twitter:image"]').attr("content") ??
      $('meta[name="twitter:image:src"]').attr("content") ??
      null

    // Resolve relative URLs
    if (imageUrl && !imageUrl.startsWith("http")) {
      try {
        imageUrl = new URL(imageUrl, url).href
      } catch {
        imageUrl = null
      }
    }

    return Response.json(
      { imageUrl },
      { headers: { "Cache-Control": "public, max-age=86400, s-maxage=86400" } }
    )
  } catch {
    return Response.json({ imageUrl: null })
  }
}

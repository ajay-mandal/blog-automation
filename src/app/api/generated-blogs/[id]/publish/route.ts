import { prisma } from "@/lib/prisma"
import { getPortfolioSupabase } from "@/lib/portfolio-supabase"
import { marked } from "marked"
import { codeToHtml } from "shiki"
import { z } from "zod"

const PublishSchema = z.object({
  slug: z.string().min(1),
  category: z.enum(["project", "findings"]),
  tags: z.array(z.string()).optional(),
  coverImageUrl: z.string().url().optional(),
  excerpt: z.string().optional(),
})

async function markdownToHtml(content: string): Promise<string> {
  let htmlContent = await marked.parse(content)

  // Highlight code blocks with Shiki (multi-theme for light/navy/sepia)
  const codeBlockRegex = /<pre><code class="language-(\w+)">([\s\S]*?)<\/code><\/pre>/g
  const matches = [...htmlContent.matchAll(codeBlockRegex)]

  for (const match of matches) {
    const [fullMatch, lang, code] = match
    try {
      const decodedCode = code
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&amp;/g, "&")
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")

      const highlighted = await codeToHtml(decodedCode, {
        lang,
        themes: { light: "github-light", navy: "github-dark", sepia: "min-light" },
        defaultColor: false,
      })
      htmlContent = htmlContent.replace(fullMatch, highlighted)
    } catch {
      // Keep original code block on highlight failure
    }
  }

  return htmlContent
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  try {
    const body = await req.json()
    const parsed = PublishSchema.safeParse(body)

    if (!parsed.success) {
      return Response.json({ error: parsed.error.flatten() }, { status: 400 })
    }

    // Fetch the draft
    const draft = await prisma.generatedBlog.findUnique({
      where: { id },
      include: { article: { select: { title: true, summary: true } } },
    })

    if (!draft) {
      return Response.json({ error: "Draft not found" }, { status: 404 })
    }

    // Convert markdown to HTML
    let html: string
    try {
      if (!draft.contentMd) {
        return Response.json({ error: "Draft content is empty" }, { status: 400 })
      }
      html = await markdownToHtml(draft.contentMd)
    } catch (error) {
      console.error("Failed to convert markdown to HTML:", error)
      return Response.json({ error: "Failed to convert content" }, { status: 500 })
    }

    // Prepare portfolio post data
    const { slug, category, tags, coverImageUrl, excerpt } = parsed.data
    const portfolioData = {
      title: draft.title,
      slug,
      excerpt: excerpt || draft.article?.summary || "",
      content: html,
      cover_image: coverImageUrl || null,
      category,
      tags: tags || [],
      published: true,
      published_at: new Date().toISOString(),
    }

    // Upsert into portfolio Supabase
    const portfolioDb = getPortfolioSupabase()
    const { data, error } = await portfolioDb
      .from("posts")
      .upsert([portfolioData], { onConflict: "slug" })
      .select()

    if (error) {
      console.error("Failed to publish to portfolio:", error)
      return Response.json({ error: "Failed to publish to portfolio" }, { status: 500 })
    }

    // Update draft status to published
    await prisma.generatedBlog.update({
      where: { id },
      data: { status: "published" },
    })

    // Update article status to published
    await prisma.article.update({
      where: { id: draft.articleId },
      data: { status: "published" },
    })

    return Response.json({ published: data?.[0], draft })
  } catch (error) {
    console.error(`[POST /api/generated-blogs/${id}/publish] failed:`, error)
    return Response.json({ error: "Failed to publish draft" }, { status: 500 })
  }
}

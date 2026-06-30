import { prisma } from "@/lib/prisma"
import { z } from "zod"

const CreateDraftSchema = z.object({
  articleId: z.string().min(1),
  contentMd: z.string().min(1),
  aiModel: z.string().min(1),
})

export async function POST(req: Request) {
  const body = await req.json()
  const parsed = CreateDraftSchema.safeParse(body)

  if (!parsed.success) {
    return Response.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const { articleId, contentMd, aiModel } = parsed.data

  try {
    // Extract title from generated content
    const titleMatch = contentMd.match(/^# (.+)$/m)
    const title = titleMatch?.[1] || "Untitled"

    // Create slug from title
    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")

    // Generate excerpt from first paragraph
    const firstParagraphMatch = contentMd.match(/^#+.*?\n\n(.+?)(?:\n\n|$)/s)
    const excerpt = firstParagraphMatch?.[1]?.substring(0, 150).trim() || "AI-generated blog post"

    // Fetch article to get source info
    const article = await prisma.article.findUnique({
      where: { id: articleId },
      include: { source: { select: { name: true } } },
    })

    if (!article) {
      return Response.json({ error: "Article not found" }, { status: 404 })
    }

    const sourceName = article.source?.name || ""
    const tags = sourceName
      ? [sourceName.toLowerCase().replace(/\s+/g, "-"), "ai-generated"]
      : ["ai-generated"]

    // Create the draft
    const draft = await prisma.generatedBlog.create({
      data: {
        articleId,
        version: 1,
        title,
        slug,
        contentMd,
        excerpt,
        tags,
        status: "draft",
        aiModel,
        category: "findings",
      },
    })

    // Update article status to "generated"
    await prisma.article.update({
      where: { id: articleId },
      data: { status: "generated" },
    })

    return Response.json(draft)
  } catch (error) {
    console.error("[POST /api/generated-blogs/create] failed", error)
    return Response.json({ error: "Failed to create draft" }, { status: 500 })
  }
}

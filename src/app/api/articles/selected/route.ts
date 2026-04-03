import { prisma } from "@/lib/prisma"
import { z } from "zod"
import { generateText } from "ai"
import { resolveModel } from "@/lib/ai-models"
import type { ModelId } from "@/lib/ai-models"

export async function GET() {
  try {
    const articles = await prisma.article.findMany({
      where: { status: "selected" },
      orderBy: { fetchedAt: "desc" },
      include: { source: { select: { id: true, name: true } } },
    })
    return Response.json({ articles })
  } catch {
    console.error("[GET /api/articles/selected] failed")
    return Response.json({ error: "Failed to fetch articles" }, { status: 500 })
  }
}

const GenerateSchema = z.object({
  articleIds: z.array(z.string()).min(1),
  aiModel: z.string().min(1),
})

export async function POST(req: Request) {
  const body = await req.json()
  const parsed = GenerateSchema.safeParse(body)

  if (!parsed.success) {
    return Response.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const { articleIds, aiModel } = parsed.data

  try {
    // Fetch selected articles
    const articles = await prisma.article.findMany({
      where: { id: { in: articleIds }, status: "selected" },
      include: { source: { select: { name: true } } },
    })

    if (articles.length === 0) {
      return Response.json({ error: "No selected articles found" }, { status: 404 })
    }

    // Get the model instance
    let model
    try {
      model = resolveModel(aiModel as ModelId)
    } catch {
      return Response.json({ error: "Invalid AI model" }, { status: 400 })
    }

    // Generate drafts for each article using AI
    const generated = []
    const failures: { articleId: string; title: string; reason: string; code: string }[] = []

    for (const article of articles) {
      try {
        const prompt = `You are a skilled technical blogger. Create a comprehensive blog post based on the following article.

Article Title: ${article.title || "Untitled"}
Source: ${article.source.name}
Summary: ${article.summary || "No summary provided"}

Requirements:
- Write in first person where appropriate
- Use markdown formatting with proper headings
- Include 2-3 main sections with insights
- Add a conclusion
- Keep it informative and engaging
- Make it suitable for ${article.source.name} audience

Return ONLY the markdown content, starting with a level 1 heading (# Title).`

        const { text } = await generateText({
          model,
          prompt,
          temperature: 0.7,
        })

        // Extract title from generated content or use article title
        const titleMatch = text.match(/^# (.+)$/m)
        const title = titleMatch?.[1] || article.title || "Untitled"

        // Create slug from title
        const slug = title
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-|-$/g, "")

        const draft = await prisma.generatedBlog.create({
          data: {
            articleId: article.id,
            version: 1,
            title,
            slug,
            contentMd: text,
            status: "draft",
            aiModel,
          },
        })
        generated.push(draft)

        // Update article status to "generated"
        await prisma.article.update({
          where: { id: article.id },
          data: { status: "generated" },
        })
      } catch (error) {
        console.error(
          `[POST /api/articles/selected] failed to generate for article ${article.id}:`,
          error
        )
        // Classify the error for the client
        const err = error as {
          statusCode?: number
          errors?: { data?: { error?: { code?: string } } }[]
          lastError?: { statusCode?: number; data?: { error?: { code?: string } } }
        }
        const statusCode = err.statusCode ?? err.lastError?.statusCode
        const apiCode = err.lastError?.data?.error?.code ?? err.errors?.[0]?.data?.error?.code

        let reason = "Generation failed"
        let code = "unknown"
        if (apiCode === "insufficient_quota" || statusCode === 429) {
          reason = "API quota exceeded — add billing credits or switch to a different model"
          code = "quota_exceeded"
        } else if (statusCode === 401 || statusCode === 403) {
          reason = "Invalid API key — check your key in Settings"
          code = "auth_error"
        } else if (statusCode === 503 || statusCode === 529) {
          reason = "Model overloaded — try again in a moment"
          code = "overloaded"
        }

        failures.push({ articleId: article.id, title: article.title ?? "Untitled", reason, code })
      }
    }

    return Response.json({ generated, count: generated.length, failures })
  } catch {
    console.error("[POST /api/articles/selected] failed")
    return Response.json({ error: "Failed to generate drafts" }, { status: 500 })
  }
}

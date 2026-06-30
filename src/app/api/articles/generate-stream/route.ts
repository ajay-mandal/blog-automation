import { prisma } from "@/lib/prisma"
import { z } from "zod"
import { streamText } from "ai"
import { resolveModel } from "@/lib/ai-models"
import type { ModelId } from "@/lib/ai-models"

const GenerateStreamSchema = z.object({
  articleId: z.string().min(1),
  aiModel: z.string().min(1),
})

export async function POST(req: Request) {
  const body = await req.json()
  const parsed = GenerateStreamSchema.safeParse(body)

  if (!parsed.success) {
    return Response.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const { articleId, aiModel } = parsed.data

  try {
    // Fetch article
    const article = await prisma.article.findUnique({
      where: { id: articleId },
      include: { source: { select: { name: true } } },
    })

    if (!article) {
      return Response.json({ error: "Article not found" }, { status: 404 })
    }

    // Get the model instance
    let model
    try {
      model = resolveModel(aiModel as ModelId)
    } catch {
      return Response.json({ error: "Invalid AI model" }, { status: 400 })
    }

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

    // Stream the text generation
    const result = streamText({
      model,
      prompt,
      temperature: 0.7,
    })

    return result.toTextStreamResponse()
  } catch (error) {
    console.error("[POST /api/articles/generate-stream] failed", error)

    const err = error as {
      statusCode?: number
      errors?: { data?: { error?: { code?: string } } }[]
      lastError?: { statusCode?: number; data?: { error?: { code?: string } } }
    }
    const statusCode = err.statusCode ?? err.lastError?.statusCode
    const apiCode = err.lastError?.data?.error?.code ?? err.errors?.[0]?.data?.error?.code

    let reason = "Generation failed"
    if (apiCode === "insufficient_quota" || statusCode === 429) {
      reason = "API quota exceeded — add billing credits or switch to a different model"
    } else if (statusCode === 401 || statusCode === 403) {
      reason = "Invalid API key — check your key in Settings"
    } else if (statusCode === 503 || statusCode === 529) {
      reason = "Model overloaded — try again in a moment"
    }

    return Response.json({ error: reason }, { status: statusCode || 500 })
  }
}

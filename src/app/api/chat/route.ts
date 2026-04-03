import { streamText } from "ai"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { resolveModel } from "@/lib/ai-models"
import type { ModelId } from "@/lib/ai-models"

const ChatSchema = z.object({
  messages: z.array(
    z.object({
      role: z.enum(["user", "assistant"]),
      content: z.string(),
    })
  ),
  model: z.string().min(1),
  articleIds: z.array(z.string()).optional(),
})

export async function POST(req: Request) {
  const body = await req.json()
  const parsed = ChatSchema.safeParse(body)
  if (!parsed.success) {
    return Response.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const { messages, model: modelId, articleIds } = parsed.data

  let model
  try {
    model = resolveModel(modelId as ModelId)
  } catch {
    return Response.json({ error: "Invalid AI model" }, { status: 400 })
  }

  // Build article context from DB
  let contextBlock = ""
  if (articleIds?.length) {
    const articles = await prisma.article.findMany({
      where: { id: { in: articleIds } },
      select: {
        title: true,
        summary: true,
        url: true,
        source: { select: { name: true } },
      },
    })
    contextBlock = articles
      .map(
        (a, i) =>
          `[Article ${i + 1}] "${a.title}" — ${a.source.name}\n${a.summary ?? "No summary available."}`
      )
      .join("\n\n")
  }

  const system = contextBlock
    ? `You are a skilled technical blog writing assistant. Help the user create, refine, and improve blog posts.\n\nCurrent article context:\n${contextBlock}\n\nUse this context when answering questions or generating content.`
    : "You are a skilled technical blog writing assistant. Help the user create, refine, and improve blog posts."

  try {
    const result = streamText({
      model,
      system,
      messages: messages.map((m) => ({ role: m.role, content: m.content })),
    })

    // Plain text stream — simplest format for manual client parsing
    const stream = new ReadableStream({
      async start(controller) {
        for await (const chunk of result.textStream) {
          controller.enqueue(new TextEncoder().encode(chunk))
        }
        controller.close()
      },
    })

    return new Response(stream, {
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    })
  } catch (error) {
    console.error("[POST /api/chat] failed", error)

    // Classify error for user-friendly messaging
    if (error instanceof Error) {
      const message = error.message.toLowerCase()

      // OpenRouter credit/quota errors (402)
      if (message.includes("402") || message.includes("more credits")) {
        return Response.json(
          {
            error:
              "Insufficient credits on OpenRouter. Add a payment method at https://openrouter.ai/settings/credits",
          },
          { status: 402 }
        )
      }

      // Auth errors
      if (message.includes("unauthorized") || message.includes("invalid api key")) {
        return Response.json(
          { error: "OpenRouter API key invalid. Check OPENROUTER_API_KEY." },
          { status: 401 }
        )
      }

      // Rate limits / overload
      if (message.includes("429") || message.includes("overload")) {
        return Response.json(
          { error: "OpenRouter is overloaded. Try again in a moment." },
          { status: 429 }
        )
      }
    }

    return Response.json({ error: "Chat generation failed" }, { status: 500 })
  }
}

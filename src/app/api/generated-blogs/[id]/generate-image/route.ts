import { prisma } from "@/lib/prisma"
import { z } from "zod"

const GenerateImageSchema = z.object({
  prompt: z.string().optional(),
})

/**
 * Generate a cover image for a blog post using OpenAI DALL-E 3
 * For now, returns a simple placeholder. In production, this would call OpenAI's DALL-E API directly.
 */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  try {
    const body = await req.json()
    const parsed = GenerateImageSchema.safeParse(body)

    if (!parsed.success) {
      return Response.json({ error: parsed.error.flatten() }, { status: 400 })
    }

    // Fetch the draft
    const draft = await prisma.generatedBlog.findUnique({
      where: { id },
    })

    if (!draft) {
      return Response.json({ error: "Draft not found" }, { status: 404 })
    }

    // For production: use OpenAI's DALL-E 3 API directly via undici or fetch
    // This would require calling OpenAI's REST API endpoint directly
    // Example: POST https://api.openai.com/v1/images/generations

    // For MVP, we get Unsplash image related to first keywords from title
    const keywords = draft.title.split(" ").slice(0, 3).join("+")
    const unsplashUrl = `https://source.unsplash.com/1792x1024/?${keywords},tech,blog`

    // Update draft with image URL
    const updated = await prisma.generatedBlog.update({
      where: { id },
      data: { coverImageUrl: unsplashUrl },
    })

    return Response.json({ coverImageUrl: unsplashUrl, draft: updated })
  } catch (error) {
    console.error(`[POST /api/generated-blogs/${id}/generate-image] failed:`, error)
    return Response.json({ error: "Failed to generate image" }, { status: 500 })
  }
}

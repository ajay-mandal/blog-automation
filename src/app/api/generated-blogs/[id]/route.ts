import { prisma } from "@/lib/prisma"
import { z } from "zod"

const UpdateDraftSchema = z.object({
  title: z.string().optional(),
  contentMd: z.string().optional(),
  status: z.enum(["draft", "reviewed", "published"]).optional(),
  slug: z.string().optional(),
  category: z.string().optional(),
  tags: z.array(z.string()).optional(),
  coverImageUrl: z.string().optional(),
})

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  try {
    const body = await req.json()
    const parsed = UpdateDraftSchema.safeParse(body)

    if (!parsed.success) {
      return Response.json({ error: parsed.error.flatten() }, { status: 400 })
    }

    const upgraded = await prisma.generatedBlog.update({
      where: { id },
      data: parsed.data,
    })

    return Response.json(upgraded)
  } catch (error) {
    console.error(`[PATCH /api/generated-blogs/${id}] failed`, error)
    return Response.json({ error: "Failed to update draft" }, { status: 500 })
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  try {
    await prisma.generatedBlog.delete({
      where: { id },
    })

    return new Response(null, { status: 204 })
  } catch {
    console.error(`[DELETE /api/generated-blogs/${id}] failed`)
    return Response.json({ error: "Failed to delete draft" }, { status: 500 })
  }
}

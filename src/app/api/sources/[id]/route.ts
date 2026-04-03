import { prisma } from "@/lib/prisma"
import { z } from "zod"

const UpdateSourceSchema = z.object({
  active: z.boolean().optional(),
})

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  try {
    const body = (await req.json()) as unknown
    const parsed = UpdateSourceSchema.safeParse(body)
    if (!parsed.success) {
      return Response.json({ error: parsed.error.flatten() }, { status: 400 })
    }

    const { active } = parsed.data
    const updated = await prisma.source.update({
      where: { id },
      data: { ...(active !== undefined && { active }) },
    })

    return Response.json(updated)
  } catch {
    console.error(`[PATCH /api/sources/${id}] failed`)
    return Response.json({ error: "Failed to update source" }, { status: 500 })
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  try {
    await prisma.source.delete({ where: { id } })
    return new Response(null, { status: 204 })
  } catch {
    console.error(`[DELETE /api/sources/${id}] failed`)
    return Response.json({ error: "Failed to delete source" }, { status: 500 })
  }
}

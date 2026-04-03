import { z } from "zod"
import { prisma } from "@/lib/prisma"

const CreateSourceSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  url: z.string().url("Must be a valid URL"),
  siteUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  category: z.string().max(50).optional().or(z.literal("")),
})

export async function GET() {
  try {
    const sources = await prisma.source.findMany({
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { articles: true } } },
    })
    return Response.json(sources)
  } catch {
    console.error("[GET /api/sources] failed")
    return Response.json({ error: "Failed to fetch sources" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  const body = await req.json()
  const parsed = CreateSourceSchema.safeParse(body)
  if (!parsed.success) {
    return Response.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const { name, url, siteUrl, category } = parsed.data

  try {
    const source = await prisma.source.create({
      data: {
        name,
        url,
        siteUrl: siteUrl || null,
        category: category || null,
      },
    })
    return Response.json(source, { status: 201 })
  } catch (err: unknown) {
    const isUnique = err instanceof Error && err.message.includes("Unique constraint")
    if (isUnique) {
      return Response.json({ error: "A source with this URL already exists" }, { status: 409 })
    }
    console.error("[POST /api/sources] failed", err)
    return Response.json({ error: "Failed to create source" }, { status: 500 })
  }
}

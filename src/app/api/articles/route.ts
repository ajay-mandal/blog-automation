import { z } from "zod"
import { prisma } from "@/lib/prisma"

const QuerySchema = z.object({
  status: z.string().optional(),
  sourceId: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
})

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)

  const parsed = QuerySchema.safeParse(Object.fromEntries(searchParams))
  if (!parsed.success) {
    return Response.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const { status, sourceId, page, limit } = parsed.data

  try {
    const where = {
      ...(status ? { status } : {}),
      ...(sourceId ? { sourceId } : {}),
    }

    const [articles, total] = await Promise.all([
      prisma.article.findMany({
        where,
        orderBy: { fetchedAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          source: { select: { id: true, name: true, category: true } },
        },
      }),
      prisma.article.count({ where }),
    ])

    return Response.json({ articles, total, page, limit })
  } catch {
    console.error("[GET /api/articles] failed")
    return Response.json({ error: "Failed to fetch articles" }, { status: 500 })
  }
}

const PatchSchema = z.object({
  id: z.string(),
  status: z.enum(["new", "selected", "generated", "published", "ignored"]),
})

export async function PATCH(req: Request) {
  const body = await req.json()
  const parsed = PatchSchema.safeParse(body)
  if (!parsed.success) {
    return Response.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const { id, status } = parsed.data

  try {
    const article = await prisma.article.update({
      where: { id },
      data: { status },
    })
    return Response.json(article)
  } catch {
    console.error("[PATCH /api/articles] failed")
    return Response.json({ error: "Failed to update article" }, { status: 500 })
  }
}

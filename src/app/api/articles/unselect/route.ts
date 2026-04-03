import { prisma } from "@/lib/prisma"

export async function POST() {
  try {
    const result = await prisma.article.updateMany({
      where: { status: "selected" },
      data: { status: "new" },
    })
    return Response.json({ unselected: result.count })
  } catch {
    console.error("[POST /api/articles/unselect] failed")
    return Response.json({ error: "Failed to unselect articles" }, { status: 500 })
  }
}

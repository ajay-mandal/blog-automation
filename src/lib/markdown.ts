import { marked } from "marked"
import matter from "gray-matter"
import { codeToHtml } from "shiki"

// Configure marked — mirrors ajaymandal.com/lib/markdown.js
marked.setOptions({ gfm: true, breaks: true })

type ParseResult = {
  frontmatter: Record<string, unknown>
  content: string
  htmlContent: string
  excerpt: string
}

/**
 * Convert a Markdown string (with YAML frontmatter) to HTML.
 * Replicates the pipeline from ajaymandal.com/lib/markdown.js exactly:
 *   gray-matter → marked → shiki (3 themes) → path rewrite
 */
export async function parseMarkdown(markdownContent: string): Promise<ParseResult> {
  const { data, content } = matter(markdownContent)

  let htmlContent = await marked.parse(content)

  // Highlight code blocks with Shiki (multi-theme for light/navy/sepia)
  const codeBlockRegex = /<pre><code class="language-(\w+)">([\s\S]*?)<\/code><\/pre>/g
  const matches = [...htmlContent.matchAll(codeBlockRegex)]

  for (const match of matches) {
    const [fullMatch, lang, code] = match
    try {
      const decodedCode = code
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&amp;/g, "&")
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")

      const highlighted = await codeToHtml(decodedCode, {
        lang,
        themes: { light: "github-light", navy: "github-dark", sepia: "min-light" },
        defaultColor: false,
      })
      htmlContent = htmlContent.replace(fullMatch, highlighted)
    } catch {
      // Keep original code block on highlight failure
    }
  }

  const plainText = content.replace(/[#*`[\]()]/g, "").trim()
  const excerpt = plainText.length > 200 ? `${plainText.substring(0, 200)}...` : plainText

  return { frontmatter: data, content, htmlContent, excerpt }
}

/**
 * Rewrite @assets/images/ paths to the portfolio Supabase Storage URL prefix.
 * Pass the full public URL base, e.g. "https://xyz.supabase.co/storage/v1/object/public/blog-images/"
 */
export function processImagePaths(htmlContent: string, storageBase?: string): string {
  const base = storageBase ?? "/images/blog/"
  return htmlContent.replace(/@assets\/images\//g, base)
}

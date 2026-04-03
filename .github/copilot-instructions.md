# Blog Automation App — Copilot Instructions

## Project Context

Personal full-stack blog automation tool. Watches RSS feeds, generates AI blog posts (2–3 versions), edits in a rich editor, and publishes directly to **ajaymandal.com** via Supabase upsert.

**Owner:** Ajay Mandal
**Portfolio:** Next.js 15 + Supabase PostgreSQL at `ajaymandal.com`

---

## Tech Stack

| Layer           | Choice                                                             |
| --------------- | ------------------------------------------------------------------ |
| Framework       | Next.js 15 App Router (TypeScript, strict mode)                    |
| Styling         | Tailwind CSS v4 + shadcn/ui (Radix primitives)                     |
| Database (app)  | Supabase PostgreSQL via Prisma ORM                                 |
| Auth            | Single-user password gate — httpOnly cookie + Next.js middleware   |
| AI generation   | Vercel AI SDK (`ai` package) — OpenAI, Anthropic, Google providers |
| Rich editor     | TipTap (React)                                                     |
| RSS parsing     | `rss-parser`                                                       |
| Image AI        | OpenAI DALL-E 3 (`1792x1024`)                                      |
| Image web fetch | Unsplash API, Pexels API (server-side proxied)                     |
| Forms           | React Hook Form + Zod                                              |
| Tables          | TanStack Table v8                                                  |
| Toasts          | `sonner`                                                           |
| Icons           | `lucide-react`                                                     |
| Markdown→HTML   | `marked` + `shiki` (replicating portfolio pipeline)                |

---

## Project Structure

```
src/
  app/
    (auth)/login/           # Login page
    (dashboard)/            # Protected layout + pages
      page.tsx              # Dashboard home
      sources/              # RSS source management
      feed/                 # Article browser
      generate/[articleId]/ # AI generation + comparison
      blogs/
        page.tsx            # All drafts
        [id]/edit/          # TipTap editor
        [id]/publish/       # Publish confirmation
      settings/             # API keys + portfolio config
    api/
      sources/              # CRUD + fetch endpoints
      articles/             # Article management
      generate/             # AI streaming generation
      images/               # generate | search | upload
      publish/              # Portfolio upsert
      rewrite/              # In-editor AI rewrite
  components/
    ui/                     # shadcn/ui primitives only
    editor/                 # TipTap editor components
    sources/                # Source-specific components
    feed/                   # Feed-specific components
    generator/              # Generation page components
    publisher/              # Publish flow components
  lib/
    supabase.ts             # App Supabase client (Prisma handles schema)
    portfolio-supabase.ts   # Portfolio Supabase client (reads PORTFOLIO_SUPABASE_* env vars)
    markdown.ts             # marked + shiki pipeline (mirrors portfolio)
    ai-models.ts            # Model registry for all providers
  prisma/
    schema.prisma
    migrations/
```

---

## Code Standards

### TypeScript

- **Strict mode always.** No `any`, no `as unknown as X` without a comment explaining why.
- Prefer `type` over `interface` for object shapes; use `interface` only for extensible contracts.
- All server action return types must be typed — never infer `Promise<any>`.
- Use `satisfies` operator for config objects to get type-checking without widening.
- Zod schemas are the source of truth for all external input shapes (API routes, forms, env vars).

```typescript
// Good
const result = (await action()) satisfies { success: boolean; error?: string }

// Bad
const result: any = await action()
```

### React / Next.js

- **Server Components by default.** Only add `'use client'` when you need hooks, event handlers, or browser APIs. Document why at the top of the file.
- Data fetching happens in Server Components or Route Handlers — never `useEffect` + `fetch`.
- Use Next.js `cache()` for repeated Supabase reads within a request.
- All mutations are **Server Actions** (not client-side fetch to API routes) unless streaming is required.
- `loading.tsx` and `error.tsx` required for every route segment that fetches data.

### API Routes

- Route handlers live in `app/api/`. Each handler exports only the HTTP methods it supports.
- Always validate request body with Zod before any logic. Return 400 with field-level errors on validation failure.
- Never return internal error messages to the client. Log with `console.error`, return a generic message.
- Streaming AI responses use Vercel AI SDK `streamText` → `toDataStreamResponse()`.

```typescript
// Route handler pattern
export async function POST(req: Request) {
  const body = await req.json()
  const parsed = GenerateSchema.safeParse(body)
  if (!parsed.success) {
    return Response.json({ error: parsed.error.flatten() }, { status: 400 })
  }
  // ...
}
```

### Database (Prisma)

- All schema changes go through Prisma migrations — never raw SQL edits to the schema.
- Use `prisma.$transaction` for multi-table writes (e.g., marking article + blog as published).
- Never expose raw Prisma errors to the client.
- Soft deletes are fine for `articles` (set `status = 'ignored'`); hard deletes only for sources.

### Security (non-negotiable)

- **All API keys** (OpenAI, Anthropic, Google, Unsplash, Pexels, portfolio Supabase) are stored as environment variables in `.env.local` only — never in the database, never returned in API responses, never accessed from client components.
- All image proxy endpoints (`/api/images/search`) must never echo the third-party API key in the response.
- `DOMPurify` on any HTML before rendering in a client component or storing in DB.
- The password auth middleware must run on all routes under `/(dashboard)/`. Never trust client-side auth state for protection.
- Input validation happens at the API boundary, not just in the form.

### Styling

- Tailwind utility classes only. No inline `style={{}}` except for truly dynamic values (e.g., CSS custom properties for editor themes).
- shadcn/ui components are the baseline — extend via `className`, never modify files in `components/ui/` directly.
- Dark mode via Tailwind `dark:` variant. The portfolio has three themes (light/navy/sepia) — the editor preview should match those.
- Responsive breakpoints: design mobile-first. This is a personal tool so tablet+ is the primary target, but it must not break on mobile.

### AI Generation

- Model calls are always server-side. Never expose API keys to the client.
- Use Vercel AI SDK's unified interface — `generateText` for non-streaming, `streamText` for editor streaming.
- Always include a system prompt. Prompts are colocated with their route handler, not scattered in components.
- Generation is non-destructive: always creates a new row in `generated_blogs`; never overwrites.
- The markdown→HTML pipeline for publishing must exactly replicate what `ajaymandal.com/lib/markdown.js` does: `gray-matter` → `marked` → `shiki` (themes: `github-light`, `github-dark`, `min-light`) → `@assets/images/` path rewrite.

### Portfolio Publishing

The `posts` table on the portfolio Supabase project has this exact schema — do not deviate:

```
id, title, slug, excerpt, content (HTML), cover_image (URL string),
category ('project' | 'findings'), tags (text[]), published (bool),
published_at (timestamptz), created_at, updated_at
```

- Category must be exactly `'project'` or `'findings'` — DB check constraint enforces this.
- `content` must be the full rendered HTML (not Markdown).
- `cover_image` is a plain URL string — either a Supabase Storage public URL or an external URL.
- Use **service role key** for writes (bypasses RLS, consistent with existing `upload-blogs.js` script).

---

## Naming Conventions

| Thing          | Convention                                    |
| -------------- | --------------------------------------------- |
| Files/folders  | `kebab-case`                                  |
| Components     | `PascalCase`                                  |
| Hooks          | `useXxx` in `hooks/`                          |
| Server actions | `verbNounAction` e.g. `publishBlogAction`     |
| Zod schemas    | `XxxSchema`                                   |
| Types          | `PascalCase`, co-located with usage           |
| Env vars       | `SCREAMING_SNAKE_CASE`                        |
| DB columns     | `snake_case` (Prisma maps to camelCase in TS) |

---

## Error Handling

- Use a `Result<T, E>` pattern for server actions — return `{ success: true, data }` or `{ success: false, error: string }`. Never throw from a server action.
- Route handlers return typed JSON error objects: `{ error: string, details?: unknown }`.
- Client components display errors via `sonner` toast — never raw error messages from the server.
- Critical errors (publish failure, DB write failure) are logged server-side with enough context to debug.

---

## Git

- **Never auto-commit.** Do not run `git add` or `git commit` unless the user explicitly asks to commit.

---

## What NOT to Do

- Do not use `useEffect` for data fetching — use Server Components.
- Do not add `console.log` in production code paths — use `console.error` for actual errors only.
- Do not hardcode the portfolio Supabase URL or keys — they come from `PORTFOLIO_SUPABASE_URL` and `PORTFOLIO_SUPABASE_SERVICE_ROLE_KEY` env vars.
- Do not use `any` type — if you're reaching for `any`, stop and define the type.
- Do not modify `components/ui/` files — they are shadcn/ui managed files.
- Do not generate multiple parallel AI calls without rate-limit awareness — max 3 concurrent generation requests.
- Do not skip Zod validation on API route inputs, even for "internal" routes.
- Do not add features not in the plan without a comment noting it's an addition and why.

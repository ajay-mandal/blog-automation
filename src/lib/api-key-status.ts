import type { ModelId } from "./ai-models"

export type ProviderId = "openrouter" | "openai" | "unsplash" | "pexels" | "portfolio"

export type ProviderStatus = {
  id: ProviderId
  label: string
  envVar: string
  configured: boolean
  /** What this key enables in the app */
  usedFor: string
  /** AI models that become available when this key is set */
  models?: { id: ModelId; label: string }[]
}

/** Checked server-side only — never call from client components. */
export function getApiKeyStatus(): ProviderStatus[] {
  return [
    {
      id: "openrouter",
      label: "OpenRouter",
      envVar: "OPENROUTER_API_KEY",
      configured: Boolean(process.env.OPENROUTER_API_KEY),
      usedFor: "All AI generation and chat — routes to Anthropic, OpenAI, Google, Meta & more",
      models: [{ id: "qwen/qwen3.6-plus:free", label: "Qwen3 6B Plus (free)" }],
    },
    {
      id: "openai",
      label: "OpenAI (images only)",
      envVar: "OPENAI_API_KEY",
      configured: Boolean(process.env.OPENAI_API_KEY),
      usedFor: "DALL-E 3 cover image generation",
    },
    {
      id: "unsplash",
      label: "Unsplash",
      envVar: "UNSPLASH_ACCESS_KEY",
      configured: Boolean(process.env.UNSPLASH_ACCESS_KEY),
      usedFor: "Stock photo search for blog cover images",
    },
    {
      id: "pexels",
      label: "Pexels",
      envVar: "PEXELS_API_KEY",
      configured: Boolean(process.env.PEXELS_API_KEY),
      usedFor: "Alternative stock photo source for blog cover images",
    },
    {
      id: "portfolio",
      label: "Portfolio Supabase",
      envVar: "PORTFOLIO_SUPABASE_URL + PORTFOLIO_SUPABASE_SERVICE_ROLE_KEY",
      configured:
        Boolean(process.env.PORTFOLIO_SUPABASE_URL) &&
        Boolean(process.env.PORTFOLIO_SUPABASE_SERVICE_ROLE_KEY),
      usedFor: "Publishing blogs directly to ajaymandal.com",
    },
  ]
}

export function getConfiguredModelIds(statuses: ProviderStatus[]): ModelId[] {
  return statuses.flatMap((s) => (s.configured && s.models ? s.models.map((m) => m.id) : []))
}

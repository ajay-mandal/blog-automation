import { createOpenRouter } from "@openrouter/ai-sdk-provider"
import type { LanguageModel } from "ai"

// OpenRouter routes all providers through a single API key.
// Set OPENROUTER_API_KEY in .env.local — get one at https://openrouter.ai/keys
const openrouter = createOpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY ?? "",
})

// ModelId strings match OpenRouter's model identifiers exactly —
// see full list at https://openrouter.ai/models
export type ModelId = "qwen/qwen3.6-plus:free"

export const AI_MODELS: Record<ModelId, { label: string; provider: string }> = {
  "qwen/qwen3.6-plus:free": { label: "Qwen3 6B Plus", provider: "Qwen" },
}

export const DEFAULT_MODEL: ModelId = "qwen/qwen3.6-plus:free"

/**
 * Resolve a ModelId to a Vercel AI SDK LanguageModel via OpenRouter.
 * All models share the single OPENROUTER_API_KEY — no per-provider keys needed.
 */
export function resolveModel(id: ModelId): LanguageModel {
  if (!process.env.OPENROUTER_API_KEY) {
    throw new Error("OPENROUTER_API_KEY is not set")
  }
  // OpenRouter model IDs are the same strings as our ModelId type
  return openrouter.chat(id)
}

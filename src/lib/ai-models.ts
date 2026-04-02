import { openai } from "@ai-sdk/openai";
import { anthropic } from "@ai-sdk/anthropic";
import { google } from "@ai-sdk/google";
import type { LanguageModel } from "ai";

export type ModelId =
  | "openai/gpt-4o"
  | "openai/gpt-4.1"
  | "anthropic/claude-3-7-sonnet"
  | "anthropic/claude-4-opus"
  | "google/gemini-2.0-flash"
  | "google/gemini-1.5-pro";

export const AI_MODELS: Record<ModelId, { label: string; provider: string }> = {
  "openai/gpt-4o": { label: "GPT-4o", provider: "openai" },
  "openai/gpt-4.1": { label: "GPT-4.1", provider: "openai" },
  "anthropic/claude-3-7-sonnet": { label: "Claude 3.7 Sonnet", provider: "anthropic" },
  "anthropic/claude-4-opus": { label: "Claude 4 Opus", provider: "anthropic" },
  "google/gemini-2.0-flash": { label: "Gemini 2.0 Flash", provider: "google" },
  "google/gemini-1.5-pro": { label: "Gemini 1.5 Pro", provider: "google" },
};

export const DEFAULT_MODEL: ModelId = "anthropic/claude-3-7-sonnet";

/**
 * Resolve a ModelId to a Vercel AI SDK LanguageModelV1 instance.
 * Throws if the required API key env var is missing.
 */
export function resolveModel(id: ModelId): LanguageModel {
  switch (id) {
    case "openai/gpt-4o":
      return openai("gpt-4o");
    case "openai/gpt-4.1":
      return openai("gpt-4.1");
    case "anthropic/claude-3-7-sonnet":
      return anthropic("claude-3-7-sonnet-20250219");
    case "anthropic/claude-4-opus":
      return anthropic("claude-opus-4-5");
    case "google/gemini-2.0-flash":
      return google("gemini-2.0-flash");
    case "google/gemini-1.5-pro":
      return google("gemini-1.5-pro");
    default: {
      const _exhaustive: never = id;
      throw new Error(`Unknown model: ${_exhaustive}`);
    }
  }
}

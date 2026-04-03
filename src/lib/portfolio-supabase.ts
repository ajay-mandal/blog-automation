import { createClient, type SupabaseClient } from "@supabase/supabase-js"

let _client: SupabaseClient | null = null

/**
 * Portfolio Supabase client using credentials from env vars.
 * Uses the service role key to bypass RLS — writes posts directly,
 * same as the portfolio's upload-blogs.js script.
 *
 * Call only from server-side code (Route Handlers, Server Actions).
 */
export function getPortfolioSupabase(): SupabaseClient {
  if (_client) return _client

  const url = process.env.PORTFOLIO_SUPABASE_URL
  const serviceKey = process.env.PORTFOLIO_SUPABASE_SERVICE_ROLE_KEY

  if (!url || !serviceKey) {
    throw new Error(
      "PORTFOLIO_SUPABASE_URL or PORTFOLIO_SUPABASE_SERVICE_ROLE_KEY env vars are not set."
    )
  }

  _client = createClient(url, serviceKey, {
    auth: { persistSession: false },
  })

  return _client
}

/** Reset cached client — call after updating env vars (tests only). */
export function resetPortfolioClient() {
  _client = null
}

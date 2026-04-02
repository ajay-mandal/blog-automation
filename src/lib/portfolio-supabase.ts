import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { prisma } from "./prisma";
import { decrypt } from "./crypto";

let _client: SupabaseClient | null = null;

/**
 * Portfolio Supabase client using the service role key stored (encrypted)
 * in the settings table. Bypasses RLS — writes posts directly, same as
 * the portfolio's upload-blogs.js script.
 *
 * Call only from server-side code (Route Handlers, Server Actions).
 */
export async function getPortfolioSupabase(): Promise<SupabaseClient> {
  if (_client) return _client;

  const [urlRow, keyRow] = await Promise.all([
    prisma.setting.findUnique({ where: { key: "portfolio_supabase_url" } }),
    prisma.setting.findUnique({ where: { key: "portfolio_supabase_service_key" } }),
  ]);

  if (!urlRow?.value || !keyRow?.value) {
    throw new Error(
      "Portfolio Supabase credentials not configured. Visit /settings to add them."
    );
  }

  const serviceKey = decrypt(keyRow.value);

  _client = createClient(urlRow.value, serviceKey, {
    auth: { persistSession: false },
  });

  return _client;
}

/** Reset cached client — call after updating settings. */
export function resetPortfolioClient() {
  _client = null;
}

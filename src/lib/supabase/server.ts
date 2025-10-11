import { createClient, SupabaseClient } from "@supabase/supabase-js";

// Server-side Supabase admin client using service role for privileged reads/writes
// Ensure SUPABASE_SERVICE_ROLE is only used on the server.
let client: SupabaseClient | null = null;

export function supabaseAdmin(): SupabaseClient {
  if (client) return client;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE;

  if (!url || !serviceRole) {
    throw new Error("Supabase env vars missing: NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE");
  }

  client = createClient(url, serviceRole, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  return client;
}
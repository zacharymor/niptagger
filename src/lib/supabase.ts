import { createClient, type SupabaseClient } from "@supabase/supabase-js";

function readEnv(...keys: string[]) {
  for (const key of keys) {
    const value = process.env[key];
    if (value) {
      return value;
    }
  }
  return undefined;
}

export function supabaseUrl() {
  return readEnv("NEXT_PUBLIC_SUPABASE_URL", "SUPABASE_URL");
}

export function supabaseAnon() {
  return createPublic();
}

function createPublic() {
  const url = supabaseUrl();
  const key = readEnv(
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
    "SUPABASE_ANON_KEY",
  );
  if (!url || !key) {
    return null;
  }
  return createClient(url, key);
}

export function supabaseAdmin(): SupabaseClient | null {
  const url = supabaseUrl();
  const key = readEnv("SUPABASE_SERVICE_ROLE_KEY", "SUPABASE_SECRET_KEY");
  if (!url || !key) {
    return null;
  }
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

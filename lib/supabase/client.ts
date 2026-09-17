// Browser-side Supabase client. Only ever uses the public anon key.
import { createBrowserClient } from "@supabase/ssr";
import { requireEnv } from "@/lib/env";

export function createClient() {
  return createBrowserClient(
    requireEnv("NEXT_PUBLIC_SUPABASE_URL"),
    requireEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY")
  );
}

// Server-side Supabase client (Server Components, Route Handlers, Server Actions).
// Uses the request's cookies so RLS is enforced as the signed-in user.
// Next.js 15's cookies() is async, so this factory is async too.
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // Called from a Server Component with no request context to mutate;
            // middleware already refreshes the session cookie in that case.
          }
        },
      },
    }
  );
}

// Service-role client for trusted server-only operations that must bypass RLS:
// admin writes, and re-checking purchase status when returning gated content.
// NEVER import this from a Client Component or expose the key to the browser.
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

export function createServiceRoleClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

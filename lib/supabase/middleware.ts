// Refreshes the Supabase auth session on every request so Server Components
// always see a valid (non-expired) session, and exposes the response so
// middleware.ts can layer route-protection logic on top.
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { requireEnv, isSupabaseConfigured } from "@/lib/env";

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({
    request: { headers: request.headers },
  });

  // /mypage, /content, /admin still redirect to /login below (middleware.ts
  // treats a null user as unauthenticated) — this just stops the redirect
  // itself from crashing when Supabase isn't set up yet.
  if (!isSupabaseConfigured()) {
    return { response, user: null };
  }

  const supabase = createServerClient(
    requireEnv("NEXT_PUBLIC_SUPABASE_URL"),
    requireEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request: { headers: request.headers } });
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  // Same reasoning as isSupabaseConfigured() above, one level deeper: a
  // reachable-but-wrong URL, a paused project, or a network blip must not
  // turn every gated route into a 500 — fail closed to "not signed in" and
  // let the redirect below handle it.
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    return { response, user };
  } catch (err) {
    console.error("updateSession failed:", err);
    return { response, user: null };
  }
}

// Exchanges the Kakao OAuth code for a Supabase session, then upserts the
// user's profile row into public.users (kept in sync with Supabase auth.users).
import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/env";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";

  if (code && isSupabaseConfigured()) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.user) {
      const identity = data.user.identities?.find((i) => i.provider === "kakao");
      const kakaoId = identity?.id ?? data.user.user_metadata?.provider_id ?? null;
      const name =
        data.user.user_metadata?.name ??
        data.user.user_metadata?.full_name ??
        data.user.user_metadata?.nickname ??
        null;

      await supabase.from("users").upsert(
        {
          id: data.user.id,
          kakao_id: kakaoId,
          name,
          email: data.user.email ?? null,
        },
        { onConflict: "id" }
      );

      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_failed`);
}

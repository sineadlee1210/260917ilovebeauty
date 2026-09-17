"use client";

import { createClient } from "@/lib/supabase/client";

// Starts the Supabase Kakao OAuth flow. Supabase redirects the user to Kakao,
// then back to /auth/callback which exchanges the code for a session.
export default function LoginButton({ next = "/" }: { next?: string }) {
  const handleLogin = async () => {
    const supabase = createClient();
    const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(
      next
    )}`;
    await supabase.auth.signInWithOAuth({
      provider: "kakao",
      options: { redirectTo },
    });
  };

  return (
    <button
      onClick={handleLogin}
      className="w-full rounded-lg bg-[#FEE500] px-4 py-3 text-sm font-semibold text-[#191600] transition hover:brightness-95"
    >
      카카오로 로그인
    </button>
  );
}

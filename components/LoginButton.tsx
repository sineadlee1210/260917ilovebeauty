"use client";

import { createClient } from "@/lib/supabase/client";

// NEXT_PUBLIC_* vars are inlined at build time, so this is safe to read
// directly in a client component — no request round-trip needed.
const SUPABASE_CONFIGURED = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

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

  if (!SUPABASE_CONFIGURED) {
    return (
      <div className="w-full rounded-lg bg-gray-100 px-4 py-3 text-center text-sm text-gray-400">
        로그인 기능은 준비 중이에요
      </div>
    );
  }

  return (
    <button
      onClick={handleLogin}
      className="w-full rounded-lg bg-[#FEE500] px-4 py-3 text-sm font-semibold text-[#191600] transition hover:brightness-95"
    >
      카카오로 로그인
    </button>
  );
}

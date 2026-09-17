// `process.env.X!` only tells TypeScript to assume X exists — it does nothing
// at runtime. If a required var is missing on the deploy platform (wrong name,
// wrong scope/context, forgot to set it), that assertion silently passes
// undefined into the Supabase client, which then throws deep inside its own
// internals. That surfaces to users as a bare "server-side exception" digest
// with no indication of the actual cause. This throws immediately, by name,
// so the real problem is visible in the server/function logs.
export function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `Missing required environment variable: ${name}. Set it in your deploy platform's environment variables (see .env.local.example).`
    );
  }
  return value;
}

// Lets pages/layouts that run on every request (the root layout's <Header>,
// middleware) check config up front and degrade gracefully — render as
// "logged out" / "no products yet" — instead of every visitor hitting a
// 500 because Supabase isn't set up yet. Features that genuinely need
// Supabase (login, checkout, gated content, admin) still end up gated
// behind "not logged in", which is the correct default anyway.
export function isSupabaseConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}

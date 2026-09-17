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

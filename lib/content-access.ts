// Central server-side gate for "does this user own this product?".
// Every place that serves gated content (PDF URLs, YouTube URLs) must go
// through this check — never infer access from client state or query params.
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/env";

// Called from the root layout's <Header> on every single page, so this must
// never throw: neither "not configured yet" nor a transient Supabase outage
// should take the whole site down. Both fall back to "logged out", which is
// the correct safe default either way.
export async function getCurrentUser() {
  if (!isSupabaseConfigured()) return null;

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    return user;
  } catch (err) {
    console.error("getCurrentUser failed:", err);
    return null;
  }
}

// Returns true only if there is a signed-in user with a `paid` order for
// this exact product. Runs with the caller's session (RLS-scoped), so a user
// can never query another user's orders through this path. Any failure —
// configuration, network, or query error — fails closed to "not purchased",
// which is also the correct behavior for a gate like this.
export async function hasUserPurchased(productId: string): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return false;

    const { data, error } = await supabase
      .from("orders")
      .select("id")
      .eq("user_id", user.id)
      .eq("product_id", productId)
      .eq("status", "paid")
      .limit(1)
      .maybeSingle();

    if (error) throw error;
    return Boolean(data);
  } catch (err) {
    console.error("hasUserPurchased failed:", err);
    return false;
  }
}

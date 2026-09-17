// Central server-side gate for "does this user own this product?".
// Every place that serves gated content (PDF URLs, YouTube URLs) must go
// through this check — never infer access from client state or query params.
import { createClient } from "@/lib/supabase/server";

export async function getCurrentUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

// Returns true only if there is a signed-in user with a `paid` order for
// this exact product. Runs with the caller's session (RLS-scoped), so a user
// can never query another user's orders through this path.
export async function hasUserPurchased(productId: string): Promise<boolean> {
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

  if (error) return false;
  return Boolean(data);
}

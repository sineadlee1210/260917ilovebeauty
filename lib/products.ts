// Public product catalog reads. Only touches the `products` table, which is
// safe to expose to anon/authenticated clients per its RLS policy
// (published products only, no pricing/content secrets beyond what's shown
// on the storefront).
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/env";
import type { Product } from "@/types";

// The homepage renders this on every visit, so it must never take the page
// down: neither "not configured yet" nor a transient Supabase outage /
// misconfigured URL should turn into a 500 here. Any failure falls back to
// the existing "콘텐츠 준비 중" empty state; the real error still goes to
// the server/function logs for diagnosis.
export async function listPublishedProducts(): Promise<Product[]> {
  if (!isSupabaseConfigured()) return [];

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("is_published", true)
      .order("created_at", { ascending: true });

    if (error) throw error;
    return data ?? [];
  } catch (err) {
    console.error("listPublishedProducts failed:", err);
    return [];
  }
}

export async function getPublishedProduct(id: string): Promise<Product | null> {
  if (!isSupabaseConfigured()) return null;

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("id", id)
      .eq("is_published", true)
      .maybeSingle();

    if (error) throw error;
    return data;
  } catch (err) {
    console.error("getPublishedProduct failed:", err);
    return null;
  }
}

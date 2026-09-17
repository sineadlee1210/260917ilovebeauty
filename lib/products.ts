// Public product catalog reads. Only touches the `products` table, which is
// safe to expose to anon/authenticated clients per its RLS policy
// (published products only, no pricing/content secrets beyond what's shown
// on the storefront).
import { createClient } from "@/lib/supabase/server";
import type { Product } from "@/types";

export async function listPublishedProducts(): Promise<Product[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("is_published", true)
    .order("created_at", { ascending: true });

  if (error) throw error;
  return data ?? [];
}

export async function getPublishedProduct(id: string): Promise<Product | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("id", id)
    .eq("is_published", true)
    .maybeSingle();

  if (error) throw error;
  return data;
}

import { redirect, notFound } from "next/navigation";
import { getCurrentUser, hasUserPurchased } from "@/lib/content-access";
import { createServiceRoleClient } from "@/lib/supabase/server";
import EbookViewer from "@/components/EbookViewer";

// Requirement 16: an unauthenticated or non-purchasing visitor hitting this
// URL directly must be redirected to checkout, never shown a "not found" or
// blank page that hints the content exists but is merely hidden.
export default async function EbookContentPage({
  params,
}: {
  params: Promise<{ productId: string }>;
}) {
  const { productId } = await params;

  const user = await getCurrentUser();
  if (!user) {
    redirect(`/login?next=${encodeURIComponent(`/content/ebook/${productId}`)}`);
  }

  const purchased = await hasUserPurchased(productId);
  if (!purchased) {
    redirect(`/checkout/${productId}`);
  }

  const service = createServiceRoleClient();
  const { data: product } = await service
    .from("products")
    .select("title")
    .eq("id", productId)
    .maybeSingle();
  if (!product) notFound();

  return (
    <div className="space-y-6">
      <h1 className="text-lg font-bold">{product.title}</h1>
      <EbookViewer productId={productId} />
    </div>
  );
}

import { redirect, notFound } from "next/navigation";
import { getCurrentUser, hasUserPurchased } from "@/lib/content-access";
import { createServiceRoleClient } from "@/lib/supabase/server";
import VideoCourseViewer from "@/components/VideoCourseViewer";

export default async function VideoCourseContentPage({
  params,
}: {
  params: Promise<{ productId: string }>;
}) {
  const { productId } = await params;

  const user = await getCurrentUser();
  if (!user) {
    redirect(`/login?next=${encodeURIComponent(`/content/video/${productId}`)}`);
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
      <VideoCourseViewer productId={productId} />
    </div>
  );
}

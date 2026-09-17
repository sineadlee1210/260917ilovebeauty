import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getPublishedProduct } from "@/lib/products";
import { getCurrentUser, hasUserPurchased } from "@/lib/content-access";
import CheckoutClient from "@/components/CheckoutClient";

export default async function CheckoutPage({
  params,
}: {
  params: Promise<{ productId: string }>;
}) {
  const { productId } = await params;

  const user = await getCurrentUser();
  if (!user) {
    redirect(`/login?next=${encodeURIComponent(`/checkout/${productId}`)}`);
  }

  const product = await getPublishedProduct(productId);
  if (!product) notFound();

  const alreadyPurchased = await hasUserPurchased(product.id);
  if (alreadyPurchased) {
    redirect(
      product.type === "ebook" ? `/content/ebook/${product.id}` : `/content/video/${product.id}`
    );
  }

  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("users")
    .select("name, email")
    .eq("id", user.id)
    .maybeSingle();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-bold">주문/결제</h1>
        <p className="mt-1 text-sm text-gray-500">{product.title}</p>
      </div>
      <CheckoutClient
        productId={product.id}
        customerEmail={profile?.email}
        customerName={profile?.name}
      />
    </div>
  );
}

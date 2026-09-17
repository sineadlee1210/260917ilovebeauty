import { notFound } from "next/navigation";
import { createServiceRoleClient } from "@/lib/supabase/server";
import ProductForm, { type ProductFormValues } from "@/components/admin/ProductForm";

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const supabase = createServiceRoleClient();
  const { data: product } = await supabase
    .from("products")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (!product) notFound();

  let pdfUrl = "";
  let contentBody = "";
  let lessonsText = "";

  if (product.type === "ebook") {
    const { data: ebook } = await supabase
      .from("ebooks")
      .select("pdf_url, content_body")
      .eq("product_id", id)
      .maybeSingle();
    pdfUrl = ebook?.pdf_url ?? "";
    contentBody = ebook?.content_body ?? "";
  } else {
    const { data: lessons } = await supabase
      .from("video_lessons")
      .select("title, youtube_url")
      .eq("course_id", id)
      .order("order_index", { ascending: true });
    lessonsText = (lessons ?? []).map((l) => `${l.title}|${l.youtube_url}`).join("\n");
  }

  const initial: ProductFormValues = {
    id: product.id,
    type: product.type,
    title: product.title,
    description: product.description ?? "",
    price: product.price,
    thumbnailUrl: product.thumbnail_url ?? "",
    isPublished: product.is_published,
    pdfUrl,
    contentBody,
    lessonsText,
  };

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-bold">상품 수정</h1>
      <ProductForm initial={initial} />
    </div>
  );
}

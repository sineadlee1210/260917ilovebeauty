import Link from "next/link";
import { createServiceRoleClient } from "@/lib/supabase/server";
import type { Product } from "@/types";

export default async function AdminProductsPage() {
  const supabase = createServiceRoleClient();
  const { data: products } = await supabase
    .from("products")
    .select("*")
    .order("created_at", { ascending: false })
    .returns<Product[]>();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold">상품 관리</h1>
        <Link
          href="/admin/products/new"
          className="rounded-lg bg-brand px-4 py-2 text-xs font-semibold text-white"
        >
          + 새 상품
        </Link>
      </div>

      <ul className="space-y-2">
        {(products ?? []).map((product) => (
          <li
            key={product.id}
            className="flex items-center justify-between rounded-xl border border-gray-100 p-4"
          >
            <div>
              <p className="text-xs text-gray-400">
                {product.type === "ebook" ? "전자책" : "온라인 운영반"} ·{" "}
                {product.is_published ? "공개" : "비공개"}
              </p>
              <p className="text-sm font-semibold">{product.title}</p>
              <p className="text-xs text-gray-400">{product.price.toLocaleString()}원</p>
            </div>
            <Link
              href={`/admin/products/${product.id}/edit`}
              className="text-xs font-semibold text-brand underline"
            >
              수정
            </Link>
          </li>
        ))}
      </ul>
      {(!products || products.length === 0) && (
        <p className="py-8 text-center text-sm text-gray-400">등록된 상품이 없습니다.</p>
      )}
    </div>
  );
}

import Link from "next/link";
import type { Product } from "@/types";

const TYPE_LABEL: Record<Product["type"], string> = {
  ebook: "전자책",
  video_course: "온라인 운영반",
};

export default function ProductCard({ product }: { product: Product }) {
  return (
    <Link
      href={`/products/${product.id}`}
      className="flex gap-4 rounded-xl border border-gray-100 p-4 shadow-sm transition hover:shadow-md"
    >
      <div className="flex h-20 w-20 flex-none items-center justify-center overflow-hidden rounded-lg bg-brand-light text-2xl">
        {product.thumbnail_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={product.thumbnail_url}
            alt={product.title}
            className="h-full w-full object-cover"
          />
        ) : (
          "💄"
        )}
      </div>
      <div className="min-w-0 flex-1">
        <span className="text-xs font-semibold text-brand">
          {TYPE_LABEL[product.type]}
        </span>
        <h3 className="mt-1 truncate text-base font-bold">{product.title}</h3>
        <p className="mt-1 line-clamp-2 text-sm text-gray-500">
          {product.description}
        </p>
        <p className="mt-2 text-sm font-bold">
          {product.price > 0 ? `${product.price.toLocaleString()}원` : "가격 문의"}
        </p>
      </div>
    </Link>
  );
}

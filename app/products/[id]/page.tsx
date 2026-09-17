import Link from "next/link";
import { notFound } from "next/navigation";
import { getPublishedProduct } from "@/lib/products";
import { getCurrentUser, hasUserPurchased } from "@/lib/content-access";

const TYPE_LABEL: Record<string, string> = {
  ebook: "전자책",
  video_course: "온라인 운영반",
};

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const product = await getPublishedProduct(id);
  if (!product) notFound();

  const user = await getCurrentUser();
  const purchased = user ? await hasUserPurchased(product.id) : false;
  const contentHref =
    product.type === "ebook" ? `/content/ebook/${product.id}` : `/content/video/${product.id}`;

  return (
    <article className="space-y-6">
      <div className="overflow-hidden rounded-2xl bg-brand-light">
        {product.thumbnail_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={product.thumbnail_url}
            alt={product.title}
            className="aspect-video w-full object-cover"
          />
        ) : (
          <div className="flex aspect-video w-full items-center justify-center text-4xl">
            💄
          </div>
        )}
      </div>

      <div>
        <span className="text-xs font-semibold text-brand">
          {TYPE_LABEL[product.type]}
        </span>
        <h1 className="mt-1 text-xl font-bold">{product.title}</h1>
        <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-gray-600">
          {product.description}
        </p>
      </div>

      <div className="fixed inset-x-0 bottom-0 border-t border-gray-100 bg-white p-4">
        <div className="mx-auto flex max-w-2xl items-center gap-4">
          <span className="flex-1 text-lg font-bold">
            {product.price > 0 ? `${product.price.toLocaleString()}원` : "가격 문의"}
          </span>

          {purchased ? (
            <Link
              href={contentHref}
              className="rounded-lg bg-brand px-6 py-3 text-sm font-semibold text-white"
            >
              바로 보기
            </Link>
          ) : user ? (
            <Link
              href={`/checkout/${product.id}`}
              className="rounded-lg bg-brand px-6 py-3 text-sm font-semibold text-white"
            >
              구매하기
            </Link>
          ) : (
            <Link
              href={`/login?next=${encodeURIComponent(`/products/${product.id}`)}`}
              className="rounded-lg bg-brand px-6 py-3 text-sm font-semibold text-white"
            >
              로그인하고 구매하기
            </Link>
          )}
        </div>
      </div>
    </article>
  );
}

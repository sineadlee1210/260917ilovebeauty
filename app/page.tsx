import { listPublishedProducts } from "@/lib/products";
import ProductCard from "@/components/ProductCard";

export default async function HomePage() {
  const products = await listPublishedProducts();

  return (
    <div className="space-y-8">
      <section className="rounded-2xl bg-brand-light p-6">
        <p className="text-sm font-semibold text-brand">아이러브뷰티</p>
        <h1 className="mt-1 text-xl font-bold leading-snug">
          상담부터 매출, 운영까지.
          <br />
          살롱 원장을 위한 실전 콘텐츠
        </h1>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-bold text-gray-400">전자책 &amp; 온라인 운영반</h2>
        {products.length === 0 ? (
          <p className="py-8 text-center text-sm text-gray-400">
            준비 중인 콘텐츠가 곧 공개될 예정이에요.
          </p>
        ) : (
          <div className="space-y-3">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

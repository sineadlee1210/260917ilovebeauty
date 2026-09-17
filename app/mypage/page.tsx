import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/content-access";
import type { Product } from "@/types";

interface PurchasedOrder {
  id: string;
  created_at: string;
  amount: number;
  products: Product;
}

export default async function MyPage() {
  // middleware.ts already redirects unauthenticated visitors away from
  // /mypage/*, but we still resolve the user directly here to scope the query.
  const user = await getCurrentUser();
  const supabase = await createClient();

  const { data: orders } = await supabase
    .from("orders")
    .select("id, created_at, amount, products(*)")
    .eq("user_id", user!.id)
    .eq("status", "paid")
    .order("created_at", { ascending: false })
    .returns<PurchasedOrder[]>();

  return (
    <div className="space-y-6">
      <h1 className="text-lg font-bold">마이페이지</h1>

      <section className="space-y-3">
        <h2 className="text-sm font-bold text-gray-400">구매한 콘텐츠</h2>
        {!orders || orders.length === 0 ? (
          <p className="py-8 text-center text-sm text-gray-400">
            아직 구매한 콘텐츠가 없어요.
          </p>
        ) : (
          <ul className="space-y-3">
            {orders.map((order) => (
              <li
                key={order.id}
                className="flex items-center justify-between rounded-xl border border-gray-100 p-4"
              >
                <div>
                  <p className="text-sm font-semibold">{order.products.title}</p>
                  <p className="mt-1 text-xs text-gray-400">
                    {new Date(order.created_at).toLocaleDateString("ko-KR")} 구매
                  </p>
                </div>
                <Link
                  href={
                    order.products.type === "ebook"
                      ? `/content/ebook/${order.products.id}`
                      : `/content/video/${order.products.id}`
                  }
                  className="rounded-lg bg-brand px-4 py-2 text-xs font-semibold text-white"
                >
                  이어보기
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

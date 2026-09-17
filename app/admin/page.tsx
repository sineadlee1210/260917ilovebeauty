import { createServiceRoleClient } from "@/lib/supabase/server";

interface OrderRow {
  id: string;
  created_at: string;
  status: string;
  amount: number;
  toss_order_id: string;
  products: { title: string } | null;
  users: { name: string | null; email: string | null } | null;
}

const STATUS_LABEL: Record<string, string> = {
  pending: "결제 대기",
  paid: "결제 완료",
  failed: "결제 실패",
  canceled: "취소",
};

export default async function AdminOrdersPage() {
  const supabase = createServiceRoleClient();
  const { data: orders } = await supabase
    .from("orders")
    .select("id, created_at, status, amount, toss_order_id, products(title), users(name, email)")
    .order("created_at", { ascending: false })
    .limit(200)
    .returns<OrderRow[]>();

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-bold">주문 목록</h1>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[600px] text-left text-sm">
          <thead className="text-xs text-gray-400">
            <tr>
              <th className="py-2">주문일</th>
              <th className="py-2">구매자</th>
              <th className="py-2">상품</th>
              <th className="py-2">금액</th>
              <th className="py-2">상태</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {(orders ?? []).map((order) => (
              <tr key={order.id}>
                <td className="py-2">
                  {new Date(order.created_at).toLocaleString("ko-KR")}
                </td>
                <td className="py-2">{order.users?.name ?? order.users?.email ?? "-"}</td>
                <td className="py-2">{order.products?.title ?? "-"}</td>
                <td className="py-2">{order.amount.toLocaleString()}원</td>
                <td className="py-2">{STATUS_LABEL[order.status] ?? order.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {(!orders || orders.length === 0) && (
          <p className="py-8 text-center text-sm text-gray-400">주문이 없습니다.</p>
        )}
      </div>
    </div>
  );
}

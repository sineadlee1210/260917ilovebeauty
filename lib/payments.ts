// Order finalization logic shared by the confirm API (initial approval flow)
// and the webhook handler (backup / async status sync). Both paths always
// re-verify against TossPayments' own servers and never trust a client- or
// webhook-supplied status field on its own.
import { createServiceRoleClient } from "@/lib/supabase/server";
import { confirmTossPayment, fetchTossPayment } from "@/lib/toss";
import type { Order } from "@/types";

interface FinalizeResult {
  ok: boolean;
  order?: Order;
  message?: string;
}

async function loadOrderByTossOrderId(tossOrderId: string) {
  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from("orders")
    .select("*")
    .eq("toss_order_id", tossOrderId)
    .maybeSingle<Order>();
  if (error) throw error;
  return data;
}

async function markOrder(
  orderId: string,
  status: "paid" | "failed",
  paymentKey: string | null
) {
  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from("orders")
    .update({ status, toss_payment_key: paymentKey })
    .eq("id", orderId)
    .select("*")
    .single<Order>();
  if (error) throw error;
  return data;
}

// Called right after the Payment Widget redirects the browser back with
// paymentKey/orderId/amount. This is the step that actually approves the
// charge with Toss — the order only becomes 'paid' once Toss confirms it,
// never from the client redirect alone.
export async function finalizeOrderFromClientConfirm(params: {
  paymentKey: string;
  tossOrderId: string;
  amount: number;
  userId: string;
}): Promise<FinalizeResult> {
  const order = await loadOrderByTossOrderId(params.tossOrderId);
  if (!order) return { ok: false, message: "주문을 찾을 수 없습니다." };
  if (order.user_id !== params.userId) {
    return { ok: false, message: "본인의 주문만 승인할 수 있습니다." };
  }

  // Idempotent: a page refresh or duplicate callback should not double-charge
  // or error out once the order is already settled.
  if (order.status === "paid") return { ok: true, order };

  if (order.amount !== params.amount) {
    await markOrder(order.id, "failed", params.paymentKey);
    return { ok: false, message: "결제 금액이 일치하지 않습니다." };
  }

  try {
    const payment = await confirmTossPayment({
      paymentKey: params.paymentKey,
      orderId: params.tossOrderId,
      amount: params.amount,
    });

    if (payment.status !== "DONE") {
      const updated = await markOrder(order.id, "failed", params.paymentKey);
      return { ok: false, order: updated, message: "결제가 완료되지 않았습니다." };
    }

    const updated = await markOrder(order.id, "paid", params.paymentKey);
    return { ok: true, order: updated };
  } catch (err) {
    await markOrder(order.id, "failed", params.paymentKey);
    return { ok: false, message: err instanceof Error ? err.message : "결제 승인 실패" };
  }
}

// Called from the Toss webhook. Re-fetches the payment directly from Toss
// by paymentKey rather than trusting the webhook body's status field, so a
// forged webhook payload cannot flip an order to 'paid'.
export async function finalizeOrderFromWebhook(params: {
  paymentKey: string;
  tossOrderId: string;
}): Promise<FinalizeResult> {
  const order = await loadOrderByTossOrderId(params.tossOrderId);
  if (!order) return { ok: false, message: "주문을 찾을 수 없습니다." };
  if (order.status === "paid") return { ok: true, order };

  const payment = await fetchTossPayment(params.paymentKey);

  if (payment.orderId !== params.tossOrderId || payment.totalAmount !== order.amount) {
    return { ok: false, message: "결제 정보가 주문과 일치하지 않습니다." };
  }

  if (payment.status === "DONE") {
    const updated = await markOrder(order.id, "paid", params.paymentKey);
    return { ok: true, order: updated };
  }

  if (["CANCELED", "ABORTED", "EXPIRED"].includes(payment.status)) {
    const updated = await markOrder(order.id, "failed", params.paymentKey);
    return { ok: true, order: updated };
  }

  // Still in progress (e.g. virtual account awaiting deposit) — leave as pending.
  return { ok: true, order };
}

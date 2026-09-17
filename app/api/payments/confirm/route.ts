// Server-side payment approval step. Called by the client right after the
// Payment Widget redirects back with paymentKey/orderId/amount. This is the
// only place a payment actually gets approved with Toss — the redirect
// itself proves nothing on its own.
import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { finalizeOrderFromClientConfirm } from "@/lib/payments";
import { isSupabaseConfigured } from "@/lib/env";

export async function POST(request: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { message: "결제 기능이 아직 설정되지 않았습니다." },
      { status: 503 }
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ message: "로그인이 필요합니다." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const paymentKey = body?.paymentKey as string | undefined;
  const orderId = body?.orderId as string | undefined; // this is Toss's orderId (= our toss_order_id)
  const amount = Number(body?.amount);

  if (!paymentKey || !orderId || !Number.isFinite(amount)) {
    return NextResponse.json({ message: "잘못된 요청입니다." }, { status: 400 });
  }

  const result = await finalizeOrderFromClientConfirm({
    paymentKey,
    tossOrderId: orderId,
    amount,
    userId: user.id,
  });

  if (!result.ok) {
    return NextResponse.json({ message: result.message ?? "결제 승인 실패" }, { status: 400 });
  }

  return NextResponse.json({ status: result.order?.status ?? "paid" });
}

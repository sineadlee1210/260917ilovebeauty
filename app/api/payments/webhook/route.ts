// Toss Payments webhook receiver. Verifies the request signature before
// touching anything, then re-fetches the payment from Toss's servers rather
// than trusting the webhook payload's status field.
import { NextResponse, type NextRequest } from "next/server";
import { verifyTossWebhookSignature } from "@/lib/toss";
import { finalizeOrderFromWebhook } from "@/lib/payments";

export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  const signature = request.headers.get("tosspayments-signature");

  if (!verifyTossWebhookSignature(rawBody, signature)) {
    return NextResponse.json({ message: "서명 검증에 실패했습니다." }, { status: 401 });
  }

  let payload: { data?: { paymentKey?: string; orderId?: string } };
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ message: "잘못된 요청 본문입니다." }, { status: 400 });
  }

  const paymentKey = payload.data?.paymentKey;
  const tossOrderId = payload.data?.orderId;

  if (!paymentKey || !tossOrderId) {
    return NextResponse.json({ message: "필수 필드가 없습니다." }, { status: 400 });
  }

  try {
    const result = await finalizeOrderFromWebhook({ paymentKey, tossOrderId });
    if (!result.ok) {
      return NextResponse.json({ message: result.message }, { status: 400 });
    }
    return NextResponse.json({ received: true });
  } catch {
    return NextResponse.json({ message: "웹훅 처리 중 오류가 발생했습니다." }, { status: 500 });
  }
}

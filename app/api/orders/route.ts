// Creates a pending order for the signed-in user. The charged amount always
// comes from the products table on the server — never from the request body —
// so a tampered client can't set an arbitrary price.
import { NextResponse, type NextRequest } from "next/server";
import { randomUUID } from "crypto";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ message: "로그인이 필요합니다." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const productId = body?.productId as string | undefined;
  if (!productId) {
    return NextResponse.json({ message: "productId가 필요합니다." }, { status: 400 });
  }

  const { data: product, error: productError } = await supabase
    .from("products")
    .select("id, title, price")
    .eq("id", productId)
    .eq("is_published", true)
    .maybeSingle();

  if (productError || !product) {
    return NextResponse.json({ message: "상품을 찾을 수 없습니다." }, { status: 404 });
  }

  const { data: existingPaid } = await supabase
    .from("orders")
    .select("id")
    .eq("user_id", user.id)
    .eq("product_id", productId)
    .eq("status", "paid")
    .maybeSingle();

  if (existingPaid) {
    return NextResponse.json({ message: "이미 구매한 상품입니다." }, { status: 409 });
  }

  const tossOrderId = `ilb_${randomUUID()}`;

  const { data: order, error: insertError } = await supabase
    .from("orders")
    .insert({
      user_id: user.id,
      product_id: product.id,
      status: "pending",
      toss_order_id: tossOrderId,
      amount: product.price,
    })
    .select("id, toss_order_id, amount")
    .single();

  if (insertError || !order) {
    return NextResponse.json({ message: "주문 생성에 실패했습니다." }, { status: 500 });
  }

  return NextResponse.json({
    orderId: order.id,
    tossOrderId: order.toss_order_id,
    amount: order.amount,
    orderName: product.title,
  });
}

"use client";

import { useEffect, useState } from "react";
import PaymentWidget from "@/components/PaymentWidget";

interface Props {
  productId: string;
  customerEmail?: string | null;
  customerName?: string | null;
}

interface PendingOrder {
  tossOrderId: string;
  amount: number;
  orderName: string;
}

export default function CheckoutClient({ productId, customerEmail, customerName }: Props) {
  const [order, setOrder] = useState<PendingOrder | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function createOrder() {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId }),
      });
      const data = await res.json();
      if (cancelled) return;

      if (!res.ok) {
        setError(data.message ?? "주문 생성에 실패했습니다.");
        return;
      }
      setOrder(data);
    }

    createOrder();
    return () => {
      cancelled = true;
    };
  }, [productId]);

  if (error) {
    return <p className="rounded-lg bg-red-50 p-4 text-sm text-red-600">{error}</p>;
  }

  if (!order) {
    return <p className="p-4 text-center text-sm text-gray-400">결제창을 불러오는 중이에요…</p>;
  }

  return (
    <PaymentWidget
      tossOrderId={order.tossOrderId}
      orderName={order.orderName}
      amount={order.amount}
      customerEmail={customerEmail}
      customerName={customerName}
    />
  );
}

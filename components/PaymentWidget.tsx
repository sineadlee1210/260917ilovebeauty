"use client";

import { useEffect, useRef, useState } from "react";
import { loadPaymentWidget, type PaymentWidgetInstance } from "@tosspayments/payment-widget-sdk";

interface Props {
  tossOrderId: string;
  orderName: string;
  amount: number;
  customerEmail?: string | null;
  customerName?: string | null;
}

// Renders TossPayments' hosted Payment Widget (method selection + agreement)
// and triggers the redirect-based checkout. The widget never sees or needs
// our TOSS_SECRET_KEY — only the public client key.
export default function PaymentWidget({
  tossOrderId,
  orderName,
  amount,
  customerEmail,
  customerName,
}: Props) {
  const widgetRef = useRef<PaymentWidgetInstance | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function init() {
      const clientKey = process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY!;
      // A per-user, non-guessable customer key. Using the order id keeps it
      // unique per checkout without leaking the real user id to Toss.
      const customerKey = `customer_${tossOrderId}`;
      const widget = await loadPaymentWidget(clientKey, customerKey);
      if (cancelled) return;

      widget.renderPaymentMethods("#payment-widget", { value: amount });
      widget.renderAgreement("#agreement-widget");
      widgetRef.current = widget;
      setReady(true);
    }

    init();
    return () => {
      cancelled = true;
    };
  }, [amount, tossOrderId]);

  const handlePay = async () => {
    if (!widgetRef.current) return;
    await widgetRef.current.requestPayment({
      orderId: tossOrderId,
      orderName,
      customerEmail: customerEmail ?? undefined,
      customerName: customerName ?? undefined,
      successUrl: `${window.location.origin}/payments/success`,
      failUrl: `${window.location.origin}/payments/fail`,
    });
  };

  return (
    <div className="space-y-4">
      <div id="payment-widget" />
      <div id="agreement-widget" />
      <button
        onClick={handlePay}
        disabled={!ready}
        className="w-full rounded-lg bg-brand px-4 py-3 text-sm font-semibold text-white disabled:opacity-50"
      >
        {amount.toLocaleString()}원 결제하기
      </button>
    </div>
  );
}

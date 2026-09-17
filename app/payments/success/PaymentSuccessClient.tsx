"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

type Status = "confirming" | "done" | "error";

// Reads the paymentKey/orderId/amount Toss appended to the redirect and
// asks our server to approve the payment. Nothing here is trusted as proof
// of payment by itself — /api/payments/confirm re-verifies with Toss.
export default function PaymentSuccessClient() {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<Status>("confirming");
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const paymentKey = searchParams.get("paymentKey");
    const orderId = searchParams.get("orderId");
    const amount = searchParams.get("amount");

    if (!paymentKey || !orderId || !amount) {
      setStatus("error");
      setMessage("결제 정보가 올바르지 않습니다.");
      return;
    }

    fetch("/api/payments/confirm", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ paymentKey, orderId, amount: Number(amount) }),
    })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.message ?? "결제 승인에 실패했습니다.");
        setStatus("done");
      })
      .catch((err) => {
        setStatus("error");
        setMessage(err.message);
      });
  }, [searchParams]);

  if (status === "confirming") {
    return <p className="mt-16 text-center text-sm text-gray-400">결제를 확인하고 있어요…</p>;
  }

  if (status === "error") {
    return (
      <div className="mt-16 space-y-4 text-center">
        <p className="text-lg font-bold text-red-500">결제 승인에 실패했어요</p>
        <p className="text-sm text-gray-500">{message}</p>
        <Link href="/" className="inline-block text-sm text-brand underline">
          홈으로 돌아가기
        </Link>
      </div>
    );
  }

  return (
    <div className="mt-16 space-y-4 text-center">
      <p className="text-lg font-bold text-brand">결제가 완료되었어요 🎉</p>
      <Link href="/mypage" className="inline-block rounded-lg bg-brand px-6 py-3 text-sm font-semibold text-white">
        마이페이지에서 확인하기
      </Link>
    </div>
  );
}

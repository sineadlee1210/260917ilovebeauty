import { Suspense } from "react";
import PaymentSuccessClient from "./PaymentSuccessClient";

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={<p className="mt-16 text-center text-sm text-gray-400">불러오는 중…</p>}>
      <PaymentSuccessClient />
    </Suspense>
  );
}

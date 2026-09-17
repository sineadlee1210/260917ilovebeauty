import Link from "next/link";

// Toss redirects here when the user cancels or the payment fails before
// ever reaching our confirm API — no order can have been marked 'paid'.
export default async function PaymentFailPage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string; code?: string }>;
}) {
  const { message } = await searchParams;

  return (
    <div className="mt-16 space-y-4 text-center">
      <p className="text-lg font-bold text-gray-700">결제가 취소되었어요</p>
      <p className="text-sm text-gray-500">
        {message ?? "결제가 완료되지 않았습니다. 다시 시도해 주세요."}
      </p>
      <Link href="/" className="inline-block text-sm text-brand underline">
        홈으로 돌아가기
      </Link>
    </div>
  );
}

import LoginButton from "@/components/LoginButton";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;

  return (
    <div className="mx-auto mt-16 max-w-sm text-center">
      <h1 className="text-xl font-bold">로그인</h1>
      <p className="mt-2 text-sm text-gray-500">
        전자책 구매와 강의 시청을 위해 로그인이 필요해요.
      </p>
      <div className="mt-8">
        <LoginButton next={next ?? "/"} />
      </div>
    </div>
  );
}

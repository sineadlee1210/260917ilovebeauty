import Link from "next/link";
import { getCurrentUser } from "@/lib/content-access";
import LogoutButton from "@/components/LogoutButton";

export default async function Header() {
  const user = await getCurrentUser();

  return (
    <header className="sticky top-0 z-10 border-b border-gray-100 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-3">
        <Link href="/" className="text-lg font-bold text-brand">
          ILB
        </Link>
        <nav className="flex items-center gap-4">
          {user ? (
            <>
              <Link href="/mypage" className="text-sm text-gray-600 hover:text-gray-900">
                마이페이지
              </Link>
              <LogoutButton />
            </>
          ) : (
            <Link href="/login" className="text-sm text-gray-600 hover:text-gray-900">
              로그인
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}

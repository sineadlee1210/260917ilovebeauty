import { notFound } from "next/navigation";
import Link from "next/link";
import { getAdminUser } from "@/lib/admin";

// Second layer of defense beyond middleware.ts: even a signed-in, non-admin
// user gets a plain 404 rather than any hint that /admin exists.
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const admin = await getAdminUser();
  if (!admin) notFound();

  return (
    <div className="space-y-6">
      <nav className="flex gap-4 border-b border-gray-100 pb-3 text-sm">
        <Link href="/admin" className="font-semibold text-brand">
          주문 관리
        </Link>
        <Link href="/admin/products" className="font-semibold text-brand">
          상품 관리
        </Link>
      </nav>
      {children}
    </div>
  );
}

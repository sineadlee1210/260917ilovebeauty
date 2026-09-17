// Returns the ebook's real content (PDF URL / rich-text body) only after
// independently re-verifying the caller is signed in AND holds a 'paid'
// order for this product. This check happens again here even though the
// page and middleware already gate this route, since this is the endpoint
// that actually hands out the sensitive URL.
import { NextResponse, type NextRequest } from "next/server";
import { hasUserPurchased, getCurrentUser } from "@/lib/content-access";
import { createServiceRoleClient } from "@/lib/supabase/server";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ productId: string }> }
) {
  const { productId } = await params;

  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ message: "로그인이 필요합니다." }, { status: 401 });
  }

  const purchased = await hasUserPurchased(productId);
  if (!purchased) {
    return NextResponse.json({ message: "구매 후 이용할 수 있습니다." }, { status: 403 });
  }

  const supabase = createServiceRoleClient();
  const { data: ebook, error } = await supabase
    .from("ebooks")
    .select("pdf_url, content_body")
    .eq("product_id", productId)
    .maybeSingle();

  if (error || !ebook) {
    return NextResponse.json({ message: "콘텐츠를 찾을 수 없습니다." }, { status: 404 });
  }

  return NextResponse.json({ pdfUrl: ebook.pdf_url, contentBody: ebook.content_body });
}

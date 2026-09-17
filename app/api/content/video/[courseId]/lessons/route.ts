// Lists a purchased course's lessons (titles + order only — never the
// youtube_url itself; that requires a separate per-lesson request so the
// URL is only ever handed out one verified request at a time).
import { NextResponse, type NextRequest } from "next/server";
import { hasUserPurchased, getCurrentUser } from "@/lib/content-access";
import { createServiceRoleClient } from "@/lib/supabase/server";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
) {
  const { courseId } = await params;

  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ message: "로그인이 필요합니다." }, { status: 401 });
  }

  const purchased = await hasUserPurchased(courseId);
  if (!purchased) {
    return NextResponse.json({ message: "구매 후 이용할 수 있습니다." }, { status: 403 });
  }

  const supabase = createServiceRoleClient();
  const { data: lessons, error } = await supabase
    .from("video_lessons")
    .select("id, title, order_index")
    .eq("course_id", courseId)
    .order("order_index", { ascending: true });

  if (error) {
    return NextResponse.json({ message: "강의 목록을 불러오지 못했습니다." }, { status: 500 });
  }

  return NextResponse.json({ lessons: lessons ?? [] });
}

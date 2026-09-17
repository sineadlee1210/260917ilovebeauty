// Returns a single lesson's youtube_url — only after resolving which course
// (product) the lesson belongs to and verifying the caller purchased that
// course. The unlisted YouTube link is never sent to the client any other way.
import { NextResponse, type NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/content-access";
import { createClient, createServiceRoleClient } from "@/lib/supabase/server";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ lessonId: string }> }
) {
  const { lessonId } = await params;

  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ message: "로그인이 필요합니다." }, { status: 401 });
  }

  const service = createServiceRoleClient();
  const { data: lesson, error: lessonError } = await service
    .from("video_lessons")
    .select("id, title, youtube_url, course_id")
    .eq("id", lessonId)
    .maybeSingle();

  if (lessonError || !lesson) {
    return NextResponse.json({ message: "강의를 찾을 수 없습니다." }, { status: 404 });
  }

  const supabase = await createClient();
  const { data: order } = await supabase
    .from("orders")
    .select("id")
    .eq("user_id", user.id)
    .eq("product_id", lesson.course_id)
    .eq("status", "paid")
    .limit(1)
    .maybeSingle();

  if (!order) {
    return NextResponse.json({ message: "구매 후 이용할 수 있습니다." }, { status: 403 });
  }

  return NextResponse.json({ title: lesson.title, youtubeUrl: lesson.youtube_url });
}

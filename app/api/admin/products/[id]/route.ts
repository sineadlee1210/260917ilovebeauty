import { NextResponse, type NextRequest } from "next/server";
import { getAdminUser } from "@/lib/admin";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { parseLessonLines } from "@/lib/admin-product-form";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const admin = await getAdminUser();
  if (!admin) {
    return NextResponse.json({ message: "관리자만 접근할 수 있습니다." }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  if (!body?.title || !body?.type || body.price === undefined) {
    return NextResponse.json({ message: "필수 항목이 누락되었습니다." }, { status: 400 });
  }

  const supabase = createServiceRoleClient();
  const { error } = await supabase
    .from("products")
    .update({
      title: body.title,
      description: body.description ?? null,
      price: Number(body.price) || 0,
      thumbnail_url: body.thumbnailUrl ?? null,
      is_published: Boolean(body.isPublished ?? true),
    })
    .eq("id", id);

  if (error) {
    return NextResponse.json({ message: "상품 수정에 실패했습니다." }, { status: 500 });
  }

  if (body.type === "ebook") {
    await supabase.from("ebooks").upsert({
      product_id: id,
      pdf_url: body.pdfUrl ?? null,
      content_body: body.contentBody ?? null,
    });
  } else if (body.type === "video_course") {
    const lessons = parseLessonLines(body.lessonsText ?? "");
    // Simplest consistent strategy for an owner-only admin tool: replace the
    // full lesson list on every save rather than diffing individual rows.
    await supabase.from("video_lessons").delete().eq("course_id", id);
    if (lessons.length > 0) {
      await supabase.from("video_lessons").insert(
        lessons.map((lesson, index) => ({
          course_id: id,
          title: lesson.title,
          youtube_url: lesson.youtubeUrl,
          order_index: index,
        }))
      );
    }
  }

  return NextResponse.json({ ok: true });
}

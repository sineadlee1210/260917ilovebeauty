// Admin product creation. Every write here requires the caller's email to be
// on ADMIN_EMAILS (see lib/admin.ts) — checked fresh on every request, not
// just at the page level, since this is the endpoint that actually mutates data.
import { NextResponse, type NextRequest } from "next/server";
import { getAdminUser } from "@/lib/admin";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { parseLessonLines } from "@/lib/admin-product-form";

export async function POST(request: NextRequest) {
  const admin = await getAdminUser();
  if (!admin) {
    return NextResponse.json({ message: "관리자만 접근할 수 있습니다." }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  if (!body?.title || !body?.type || body.price === undefined) {
    return NextResponse.json({ message: "필수 항목이 누락되었습니다." }, { status: 400 });
  }

  const supabase = createServiceRoleClient();
  const { data: product, error } = await supabase
    .from("products")
    .insert({
      type: body.type,
      title: body.title,
      description: body.description ?? null,
      price: Number(body.price) || 0,
      thumbnail_url: body.thumbnailUrl ?? null,
      is_published: Boolean(body.isPublished ?? true),
    })
    .select("id")
    .single();

  if (error || !product) {
    return NextResponse.json({ message: "상품 생성에 실패했습니다." }, { status: 500 });
  }

  if (body.type === "ebook") {
    await supabase.from("ebooks").insert({
      product_id: product.id,
      pdf_url: body.pdfUrl ?? null,
      content_body: body.contentBody ?? null,
    });
  } else if (body.type === "video_course") {
    await supabase.from("video_courses").insert({ product_id: product.id });
    const lessons = parseLessonLines(body.lessonsText ?? "");
    if (lessons.length > 0) {
      await supabase.from("video_lessons").insert(
        lessons.map((lesson, index) => ({
          course_id: product.id,
          title: lesson.title,
          youtube_url: lesson.youtubeUrl,
          order_index: index,
        }))
      );
    }
  }

  return NextResponse.json({ id: product.id });
}

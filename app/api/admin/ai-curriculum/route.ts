// Drafts an online-course curriculum outline with Gemini for the admin to
// review and refine. Admin-gated. The caller's own Gemini API key is used
// for this single call only — never persisted, never logged.
import { NextResponse, type NextRequest } from "next/server";
import { getAdminUser } from "@/lib/admin";
import { generateWithGemini } from "@/lib/gemini";

function buildPrompt(topic: string, sessionCount: number, notes: string) {
  return `너는 속눈썹 연장(래시) 전문 뷰티 교육 브랜드 "아이러브뷰티(ILB)"의 커리큘럼 기획자야.
ILB는 살롱 원장을 대상으로, 시술 기술뿐 아니라 상담/가격 책정/컴플레인 대응/매출/마케팅/운영까지
가르치는 것이 차별점이야.

지금 기획할 것은 "온라인 운영반" 영상 강의 커리큘럼이야. 이 과정은 ILB 전자책(상담 스크립트,
가격 책정, 컴플레인 대응 등 실전 템플릿)의 내용을 원장이 자기 샵에 실제로 적용하도록 돕는 과정이야.

요청 주제/포커스: ${topic}
회차 수: ${sessionCount}회
추가 요청사항: ${notes || "없음"}

다음 형식으로 출력해줘:

## 커리큘럼 개요
(2~3문장 요약)

## 회차별 구성
각 회차마다:
- N강. 제목
  - 학습 목표: ...
  - 주요 내용: (bullet 3~5개)

## 강의 목록 (관리자 등록용)
마지막에 아래처럼 "제목|https://youtu.be/REPLACE_ME" 형식으로 ${sessionCount}줄을 출력해줘.
실제 유튜브 링크는 아직 없으니 URL 자리에는 반드시 "https://youtu.be/REPLACE_ME"를 그대로 써줘
(관리자가 나중에 실제 비공개 영상 링크로 교체할 자리표시자야):

1강 제목|https://youtu.be/REPLACE_ME
2강 제목|https://youtu.be/REPLACE_ME
...`;
}

export async function POST(request: NextRequest) {
  const admin = await getAdminUser();
  if (!admin) {
    return NextResponse.json({ message: "관리자만 접근할 수 있습니다." }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const apiKey = body?.apiKey as string | undefined;
  const topic = (body?.topic as string | undefined)?.trim();
  const sessionCount = Number(body?.sessionCount);
  const notes = (body?.notes as string | undefined)?.trim() ?? "";

  if (!apiKey) {
    return NextResponse.json({ message: "Gemini API 키를 입력해주세요." }, { status: 400 });
  }
  if (!topic) {
    return NextResponse.json({ message: "커리큘럼 주제를 입력해주세요." }, { status: 400 });
  }
  if (!Number.isFinite(sessionCount) || sessionCount < 1 || sessionCount > 30) {
    return NextResponse.json({ message: "회차 수는 1~30 사이로 입력해주세요." }, { status: 400 });
  }

  try {
    const result = await generateWithGemini(apiKey, buildPrompt(topic, sessionCount, notes));
    return NextResponse.json({ result });
  } catch (err) {
    const message = err instanceof Error ? err.message : "커리큘럼 생성에 실패했습니다.";
    return NextResponse.json({ message }, { status: 502 });
  }
}

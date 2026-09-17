import AiCurriculumForm from "@/components/admin/AiCurriculumForm";

export default function AiCurriculumPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-bold">AI 커리큘럼 제작</h1>
        <p className="mt-1 text-sm text-gray-500">
          Gemini로 온라인 운영반 커리큘럼 초안을 생성합니다. 실제 촬영/등록 전
          기획용 초안이며, 최종 검수는 직접 해주세요.
        </p>
      </div>
      <AiCurriculumForm />
    </div>
  );
}

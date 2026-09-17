"use client";

import { useState } from "react";

// The API key only ever lives in this component's state — never persisted
// to localStorage/cookies, only sent once per "생성하기" click.
export default function AiCurriculumForm() {
  const [apiKey, setApiKey] = useState("");
  const [topic, setTopic] = useState("");
  const [sessionCount, setSessionCount] = useState(4);
  const [notes, setNotes] = useState("");
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    const res = await fetch("/api/admin/ai-curriculum", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ apiKey, topic, sessionCount, notes }),
    });
    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.message ?? "커리큘럼 생성에 실패했습니다.");
      return;
    }
    setResult(data.result);
  };

  const handleCopy = async () => {
    if (!result) return;
    await navigator.clipboard.writeText(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="text-xs font-semibold text-gray-500">Gemini API 키</label>
          <input
            type="password"
            required
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="AIza..."
            autoComplete="off"
            className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
          />
          <p className="mt-1 text-xs text-gray-400">
            이 키는 저장되지 않고 이번 요청에만 사용됩니다. 발급은{" "}
            <a
              href="https://aistudio.google.com/apikey"
              target="_blank"
              rel="noopener noreferrer"
              className="underline"
            >
              Google AI Studio
            </a>
            에서 할 수 있어요.
          </p>
        </div>

        <div>
          <label className="text-xs font-semibold text-gray-500">커리큘럼 주제/포커스</label>
          <input
            required
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="예: 상담 스크립트를 내 샵 상황에 맞게 커스터마이징하기"
            className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="text-xs font-semibold text-gray-500">회차 수</label>
          <input
            type="number"
            min={1}
            max={30}
            required
            value={sessionCount}
            onChange={(e) => setSessionCount(Number(e.target.value))}
            className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="text-xs font-semibold text-gray-500">추가 요청사항 (선택)</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            placeholder="예: 신규 오픈 원장 위주, 실습 과제 포함"
            className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
          />
        </div>

        {error && <p className="text-sm text-red-500">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-brand px-4 py-3 text-sm font-semibold text-white disabled:opacity-50"
        >
          {loading ? "생성 중…" : "커리큘럼 생성하기"}
        </button>
      </form>

      {result && (
        <div className="space-y-2 rounded-xl border border-gray-100 p-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold">생성 결과</h3>
            <button
              onClick={handleCopy}
              className="text-xs font-semibold text-brand underline"
            >
              {copied ? "복사됨!" : "전체 복사"}
            </button>
          </div>
          <pre className="whitespace-pre-wrap break-words text-sm text-gray-700">{result}</pre>
          <p className="text-xs text-gray-400">
            하단 &quot;강의 목록&quot; 블록은 &quot;상품 관리 → 새 상품&quot;의 강의 목록 입력란에
            그대로 붙여넣고, 실제 유튜브 링크로 URL만 교체하면 됩니다.
          </p>
        </div>
      )}
    </div>
  );
}

// Server-only Gemini API call. The API key is supplied by the admin on each
// request (see app/api/admin/ai-curriculum/route.ts) — it is never read from
// an env var, never written to the database, and never logged. It lives only
// for the duration of this single fetch call.
const GEMINI_MODEL = "gemini-3.5-flash-lite";
const GEMINI_API_BASE = "https://generativelanguage.googleapis.com/v1beta";

export async function generateWithGemini(apiKey: string, prompt: string): Promise<string> {
  const res = await fetch(`${GEMINI_API_BASE}/models/${GEMINI_MODEL}:generateContent`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-goog-api-key": apiKey,
    },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
    }),
  });

  const data = await res.json();

  if (!res.ok) {
    // Gemini's error body may echo the request, but never the key itself
    // (the key travels as a header, not in the body) — safe to surface.
    const message = data?.error?.message ?? "Gemini API 호출에 실패했습니다.";
    throw new Error(message);
  }

  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    throw new Error("Gemini가 빈 응답을 반환했습니다.");
  }

  return text;
}

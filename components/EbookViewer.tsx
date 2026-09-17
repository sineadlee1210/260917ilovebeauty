"use client";

import { useEffect, useState } from "react";

interface EbookContent {
  pdfUrl: string | null;
  contentBody: string | null;
}

// Fetches the gated PDF URL client-side from the verified API route, instead
// of having it embedded in the server-rendered HTML.
export default function EbookViewer({ productId }: { productId: string }) {
  const [content, setContent] = useState<EbookContent | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/content/ebook/${productId}`)
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.message ?? "콘텐츠를 불러오지 못했습니다.");
        if (!cancelled) setContent(data);
      })
      .catch((err) => !cancelled && setError(err.message));
    return () => {
      cancelled = true;
    };
  }, [productId]);

  if (error) return <p className="text-sm text-red-500">{error}</p>;
  if (!content) return <p className="text-sm text-gray-400">불러오는 중…</p>;

  return (
    <div className="space-y-4">
      {content.pdfUrl && (
        <a
          href={content.pdfUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="block rounded-lg bg-brand px-4 py-3 text-center text-sm font-semibold text-white"
        >
          PDF 열기
        </a>
      )}
      {content.contentBody && (
        <div
          className="prose prose-sm max-w-none"
          dangerouslySetInnerHTML={{ __html: content.contentBody }}
        />
      )}
    </div>
  );
}

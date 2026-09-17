"use client";

import { useEffect, useState } from "react";

interface LessonMeta {
  id: string;
  title: string;
  order_index: number;
}

function toEmbedUrl(youtubeUrl: string): string {
  try {
    const url = new URL(youtubeUrl);
    const videoId = url.hostname.includes("youtu.be")
      ? url.pathname.slice(1)
      : url.searchParams.get("v");
    return videoId ? `https://www.youtube.com/embed/${videoId}` : youtubeUrl;
  } catch {
    return youtubeUrl;
  }
}

// Loads the lesson list (titles only) then, per lesson click, fetches the
// actual youtube_url from the verified single-lesson API — the link is
// never present in the initial page payload.
export default function VideoCourseViewer({ productId }: { productId: string }) {
  const [lessons, setLessons] = useState<LessonMeta[] | null>(null);
  const [activeLessonId, setActiveLessonId] = useState<string | null>(null);
  const [activeUrl, setActiveUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/content/video/${productId}/lessons`)
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.message ?? "강의 목록을 불러오지 못했습니다.");
        setLessons(data.lessons);
      })
      .catch((err) => setError(err.message));
  }, [productId]);

  const selectLesson = async (lessonId: string) => {
    setActiveLessonId(lessonId);
    setActiveUrl(null);
    const res = await fetch(`/api/content/video/lesson/${lessonId}`);
    const data = await res.json();
    if (res.ok) setActiveUrl(data.youtubeUrl);
  };

  if (error) return <p className="text-sm text-red-500">{error}</p>;
  if (!lessons) return <p className="text-sm text-gray-400">불러오는 중…</p>;

  return (
    <div className="space-y-4">
      {activeUrl && (
        <div className="aspect-video overflow-hidden rounded-lg bg-black">
          <iframe
            src={toEmbedUrl(activeUrl)}
            className="h-full w-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      )}
      <ul className="divide-y divide-gray-100 rounded-lg border border-gray-100">
        {lessons.map((lesson) => (
          <li key={lesson.id}>
            <button
              onClick={() => selectLesson(lesson.id)}
              className={`w-full px-4 py-3 text-left text-sm ${
                activeLessonId === lesson.id ? "bg-brand-light font-semibold" : ""
              }`}
            >
              {lesson.order_index + 1}. {lesson.title}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

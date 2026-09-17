"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { ProductType } from "@/types";

export interface ProductFormValues {
  id?: string;
  type: ProductType;
  title: string;
  description: string;
  price: number;
  thumbnailUrl: string;
  isPublished: boolean;
  pdfUrl: string;
  contentBody: string;
  lessonsText: string;
}

const EMPTY: ProductFormValues = {
  type: "ebook",
  title: "",
  description: "",
  price: 0,
  thumbnailUrl: "",
  isPublished: true,
  pdfUrl: "",
  contentBody: "",
  lessonsText: "",
};

export default function ProductForm({
  initial,
}: {
  initial?: ProductFormValues;
}) {
  const router = useRouter();
  const [values, setValues] = useState<ProductFormValues>(initial ?? EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const update = <K extends keyof ProductFormValues>(key: K, value: ProductFormValues[K]) =>
    setValues((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const url = values.id ? `/api/admin/products/${values.id}` : "/api/admin/products";
    const method = values.id ? "PUT" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    const data = await res.json();
    setSaving(false);

    if (!res.ok) {
      setError(data.message ?? "저장에 실패했습니다.");
      return;
    }
    router.push("/admin/products");
    router.refresh();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="text-xs font-semibold text-gray-500">상품 유형</label>
        <select
          value={values.type}
          disabled={Boolean(values.id)}
          onChange={(e) => update("type", e.target.value as ProductType)}
          className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm disabled:bg-gray-50"
        >
          <option value="ebook">전자책</option>
          <option value="video_course">온라인 운영반</option>
        </select>
      </div>

      <div>
        <label className="text-xs font-semibold text-gray-500">제목</label>
        <input
          required
          value={values.title}
          onChange={(e) => update("title", e.target.value)}
          className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
        />
      </div>

      <div>
        <label className="text-xs font-semibold text-gray-500">설명</label>
        <textarea
          value={values.description}
          onChange={(e) => update("description", e.target.value)}
          rows={4}
          className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
        />
      </div>

      <div>
        <label className="text-xs font-semibold text-gray-500">가격(원)</label>
        <input
          type="number"
          min={0}
          required
          value={values.price}
          onChange={(e) => update("price", Number(e.target.value))}
          className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
        />
      </div>

      <div>
        <label className="text-xs font-semibold text-gray-500">썸네일 이미지 URL</label>
        <input
          value={values.thumbnailUrl}
          onChange={(e) => update("thumbnailUrl", e.target.value)}
          className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
        />
      </div>

      {values.type === "ebook" ? (
        <div>
          <label className="text-xs font-semibold text-gray-500">PDF URL</label>
          <input
            value={values.pdfUrl}
            onChange={(e) => update("pdfUrl", e.target.value)}
            className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
            placeholder="https://.../ebook.pdf"
          />
        </div>
      ) : (
        <div>
          <label className="text-xs font-semibold text-gray-500">
            강의 목록 (한 줄에 하나, &quot;제목|유튜브URL&quot; 형식)
          </label>
          <textarea
            value={values.lessonsText}
            onChange={(e) => update("lessonsText", e.target.value)}
            rows={6}
            placeholder={"1강 상담의 기본|https://youtu.be/xxxxxxxx\n2강 가격 책정|https://youtu.be/yyyyyyyy"}
            className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
          />
          <p className="mt-1 text-xs text-gray-400">
            저장 시 이 목록으로 강의 순서/목록이 전체 교체됩니다. 유튜브는 비공개(unlisted) 링크를 사용하세요.
          </p>
        </div>
      )}

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={values.isPublished}
          onChange={(e) => update("isPublished", e.target.checked)}
        />
        공개 (상품 목록에 노출)
      </label>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <button
        type="submit"
        disabled={saving}
        className="w-full rounded-lg bg-brand px-4 py-3 text-sm font-semibold text-white disabled:opacity-50"
      >
        {saving ? "저장 중…" : "저장"}
      </button>
    </form>
  );
}

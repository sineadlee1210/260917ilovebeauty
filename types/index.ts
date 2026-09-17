// Shared domain types mirroring the Supabase schema (see supabase/migrations/0001_init.sql).

export type ProductType = "ebook" | "video_course";
export type OrderStatus = "pending" | "paid" | "failed" | "canceled";

export interface AppUser {
  id: string;
  kakao_id: string | null;
  name: string | null;
  email: string | null;
  created_at: string;
}

export interface Product {
  id: string;
  type: ProductType;
  title: string;
  description: string | null;
  price: number;
  thumbnail_url: string | null;
  is_published: boolean;
  created_at: string;
}

export interface Ebook {
  product_id: string;
  pdf_url: string | null;
  content_body: string | null;
}

export interface VideoCourse {
  product_id: string;
}

export interface VideoLesson {
  id: string;
  course_id: string;
  title: string;
  youtube_url: string;
  order_index: number;
}

export interface Order {
  id: string;
  user_id: string;
  product_id: string;
  status: OrderStatus;
  toss_payment_key: string | null;
  toss_order_id: string;
  amount: number;
  created_at: string;
}

// Product with its purchase state for the current viewer, used on detail pages.
export interface ProductWithAccess extends Product {
  hasPurchased: boolean;
}

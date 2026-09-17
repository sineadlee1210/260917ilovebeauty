-- ILB content shop — initial schema
-- Run via `supabase db push` or paste into the Supabase SQL editor.

-- =========================================================
-- users: app-level profile mirror of auth.users, populated by
-- /app/auth/callback on first Kakao login.
-- =========================================================
create table if not exists public.users (
  id uuid primary key references auth.users (id) on delete cascade,
  kakao_id text,
  name text,
  email text,
  created_at timestamptz not null default now()
);

alter table public.users enable row level security;

create policy "users can read own profile"
  on public.users for select
  using (auth.uid() = id);

create policy "users can upsert own profile"
  on public.users for insert
  with check (auth.uid() = id);

create policy "users can update own profile"
  on public.users for update
  using (auth.uid() = id);

-- =========================================================
-- products: catalog entries shared by both content types.
-- =========================================================
create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in ('ebook', 'video_course')),
  title text not null,
  description text,
  price integer not null check (price >= 0),
  thumbnail_url text,
  is_published boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.products enable row level security;

-- Anyone (including logged-out visitors) can browse published products.
-- Admin writes go through the service-role client from /app/api/admin/*,
-- so no insert/update/delete policy is defined here for normal roles.
create policy "anyone can read published products"
  on public.products for select
  using (is_published = true);

-- =========================================================
-- ebooks: 1:1 extension of products where type = 'ebook'.
-- No SELECT policy is defined for anon/authenticated — pdf_url must only
-- ever be read using the service-role client, and only after the caller's
-- purchase has been verified server-side (see lib/content-access.ts).
-- =========================================================
create table if not exists public.ebooks (
  product_id uuid primary key references public.products (id) on delete cascade,
  pdf_url text,
  content_body text
);

alter table public.ebooks enable row level security;

-- =========================================================
-- video_courses: 1:1 extension of products where type = 'video_course'.
-- =========================================================
create table if not exists public.video_courses (
  product_id uuid primary key references public.products (id) on delete cascade
);

alter table public.video_courses enable row level security;

-- =========================================================
-- video_lessons: ordered lessons under a video course.
-- Same access rule as ebooks: youtube_url is never exposed via anon/
-- authenticated select policies, only via the verified server API.
-- =========================================================
create table if not exists public.video_lessons (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.video_courses (product_id) on delete cascade,
  title text not null,
  youtube_url text not null,
  order_index integer not null default 0
);

alter table public.video_lessons enable row level security;

-- No SELECT policy is defined for anon/authenticated on this table either —
-- lesson titles and playback URLs are both only ever returned by the
-- verified server API (/app/api/content/video/[courseId]), after checking
-- the caller purchased the course. This keeps a single access-control path
-- instead of splitting "safe" and "sensitive" columns across two policies.

-- =========================================================
-- orders: one row per purchase attempt.
-- =========================================================
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  product_id uuid not null references public.products (id),
  status text not null default 'pending' check (status in ('pending', 'paid', 'failed', 'canceled')),
  toss_payment_key text,
  toss_order_id text not null unique,
  amount integer not null check (amount >= 0),
  created_at timestamptz not null default now()
);

create index if not exists orders_user_id_idx on public.orders (user_id);
create index if not exists orders_product_id_idx on public.orders (product_id);

alter table public.orders enable row level security;

create policy "users can read own orders"
  on public.orders for select
  using (auth.uid() = user_id);

-- Users may create their own pending order (the API route sets amount from
-- the server-verified product price, never trusting client input).
create policy "users can create own pending order"
  on public.orders for insert
  with check (auth.uid() = user_id and status = 'pending');

-- No update policy for authenticated/anon: status can only move from
-- 'pending' to 'paid'/'failed' via the service-role client, from the
-- payment-confirm API route and the webhook handler after re-verifying
-- with TossPayments' own servers.

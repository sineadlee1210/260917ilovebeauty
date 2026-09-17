# ILB Content Shop (MVP)

아이러브뷰티(ILB) 전자책 / 온라인 운영반 콘텐츠 판매 웹앱.
Next.js 14+ App Router · Supabase(Auth/DB) · 카카오 로그인 · 토스페이먼츠.

## 기술 스택

- Next.js 15 (App Router, TypeScript, Tailwind CSS)
- Supabase (PostgreSQL, Auth, RLS)
- 카카오 OAuth (Supabase Auth Provider)
- 토스페이먼츠 Payment Widget SDK + 서버사이드 결제 승인 API
- 유튜브 비공개(unlisted) 링크 — DB 저장, 서버 API를 통해서만 반환

> Next.js는 14.2.x가 최신 보안 패치까지도 다수의 RCE/DoS 취약점이 남아 있어
> (15.5.24+에서 수정) 15.5.25로 올려 시작합니다. 이에 따라 `cookies()`,
> route handler/page의 `params`·`searchParams`가 모두 **비동기 API**입니다
> (이미 이 저장소 코드 전체에 반영되어 있습니다).

## 프로젝트 구조

```
/app                 App Router 라우트 (페이지 + API 라우트)
  /api/orders         주문(결제 전) 생성
  /api/payments       결제 승인(confirm) / 웹훅(webhook)
  /api/content        구매 검증 후 PDF/유튜브 링크 반환
  /api/admin          관리자 상품 CRUD
  /content/ebook, /content/video   콘텐츠 열람 페이지 (구매자 전용)
  /checkout           결제 페이지
  /mypage             마이페이지
  /admin              관리자 페이지
/components           클라이언트/서버 컴포넌트
/lib                  Supabase 클라이언트, 토스 유틸, 접근 제어 로직
/types                공용 타입
/supabase/migrations  DB 스키마
```

## 시작하기

```bash
npm install
cp .env.local.example .env.local   # 값 채우기
npm run dev
```

### 1) Supabase 설정

1. Supabase 프로젝트 생성 후 `supabase/migrations/0001_init.sql`을 SQL Editor에서 실행합니다.
2. **Authentication > Providers > Kakao**를 활성화하고, 카카오 디벨로퍼스에서 발급한
   REST API 키(Client ID)와 Client Secret을 입력합니다.
3. 카카오 디벨로퍼스 콘솔의 **Redirect URI**에 다음을 등록합니다:
   `https://<프로젝트>.supabase.co/auth/v1/callback`
4. `.env.local`에 `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
   `SUPABASE_SERVICE_ROLE_KEY`를 채웁니다.

### 2) 토스페이먼츠 설정

1. [토스페이먼츠 개발자센터](https://developers.tosspayments.com)에서 테스트 상점을 만들고
   Payment Widget용 클라이언트 키/시크릿 키를 발급받습니다.
2. 웹훅(Webhook) 메뉴에서 `POST /api/payments/webhook`을 등록하고, 서명 시크릿을
   `TOSS_WEBHOOK_SECRET`에 저장합니다.
   - ⚠️ 이 저장소의 서명 검증은 `TossPayments-Signature` 헤더 + HMAC-SHA256 방식을
     가정해 작성했습니다. 실제 연동 전 토스 최신 웹훅 문서에서 헤더 이름과 서명
     알고리즘을 반드시 재확인하세요 (`lib/toss.ts`의 `verifyTossWebhookSignature`).

### 3) 관리자 계정

`.env.local`의 `ADMIN_EMAILS`에 관리자로 허용할 이메일을 콤마로 구분해 입력합니다
(카카오 로그인 시 이메일 동의가 필요합니다). 이 목록에 없는 이메일은 `/admin` 접근 시
404로 처리됩니다.

### 4) 첫 상품 등록

1. 관리자 계정으로 카카오 로그인
2. `/admin/products/new`에서 전자책 또는 온라인 운영반 상품 등록
   - 온라인 운영반은 "제목\|유튜브URL" 형식으로 강의를 한 줄씩 입력합니다.
   - 유튜브 링크는 반드시 **비공개(unlisted)** 링크를 사용하세요.

## Netlify 배포

이 저장소는 원래 Vercel을 가정해 만들었지만 Netlify로도 배포할 수 있습니다.
루트의 `netlify.toml`이 `@netlify/plugin-nextjs`를 명시적으로 선언하고
`NODE_VERSION = "20"`을 고정합니다 (Next.js 15.5는 Node 18.18+/20+ 필요).

### "Application error: a server-side exception has occurred" + Digest 만 보일 때

브라우저에는 원래 실제 에러가 노출되지 않습니다 (Next.js가 프로덕션에서
의도적으로 숨기는 동작이라, 이건 버그가 아닙니다). **Netlify 대시보드 →
Site → Logs → Functions**에서 해당 digest를 가진 함수 로그를 확인하세요.

가장 흔한 원인 — 환경변수 누락:

- `lib/supabase/client.ts`, `lib/supabase/server.ts`, `lib/supabase/middleware.ts`는
  모두 `requireEnv()`를 통해 필수 환경변수를 읽습니다. 값이 없으면
  `Missing required environment variable: <이름>` 형태로 **함수 로그에 정확히
  어떤 변수가 빠졌는지** 나옵니다.
- 루트 레이아웃(`app/layout.tsx`)이 모든 페이지에서 `<Header />`를 렌더링하고,
  `Header`는 서버 컴포넌트에서 `getCurrentUser()` → Supabase 서버 클라이언트를
  즉시 생성합니다. 즉 `NEXT_PUBLIC_SUPABASE_URL`/`NEXT_PUBLIC_SUPABASE_ANON_KEY`가
  Netlify에 설정되어 있지 않으면 **사이트 전체 페이지**가 500으로 죽습니다.
  (`npm run build`는 이 값들이 없어도 통과합니다 — 모든 라우트가 동적이라
  빌드 시점에는 실행되지 않고, 런타임에 처음 요청이 올 때만 터지기 때문입니다.)
- Netlify는 **Site configuration → Environment variables**에 등록한 값을
  Production/Deploy Preview/Branch deploy 각 컨텍스트별로 따로 적용합니다.
  로컬 `.env.local`과 Netlify에 등록한 변수 이름·값·적용 컨텍스트가 정확히
  일치하는지 확인하세요. 최소한 아래 표의 변수 전부가 있어야 합니다
  (`NEXT_PUBLIC_` 접두사가 붙은 값은 브라우저에도 내려가므로 오타에 특히 취약합니다).
- 값을 바꾼 뒤에는 **재배포(Clear cache and deploy)**가 필요합니다. 환경변수만
  바꾸고 캐시된 빌드를 그대로 쓰면 반영되지 않습니다.

## 환경변수 (`.env.local.example` 참고)

| 변수 | 설명 |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` | 클라이언트에서 사용하는 공개 키 |
| `SUPABASE_SERVICE_ROLE_KEY` | 서버 전용. RLS 우회가 필요한 콘텐츠 검증/관리자 작업에 사용 |
| `NEXT_PUBLIC_TOSS_CLIENT_KEY` / `TOSS_SECRET_KEY` | 토스페이먼츠 클라이언트/시크릿 키 |
| `TOSS_WEBHOOK_SECRET` | 웹훅 서명 검증용 시크릿 |
| `NEXT_PUBLIC_SITE_URL` | 로컬/배포 도메인 |
| `ADMIN_EMAILS` | `/admin` 접근을 허용할 이메일(콤마 구분) |

## 단계별 구현 체크리스트

- **1단계 — 기본 구조/인증**: `middleware.ts`, `lib/supabase/*`, `app/auth/callback`,
  `components/Login|LogoutButton.tsx`, `supabase/migrations/0001_init.sql`의 `users` 테이블.
  ✅ 확인: 카카오 로그인 → `public.users`에 행이 생성되는지, 로그아웃이 되는지.
- **2단계 — 데이터 모델**: `products`, `ebooks`, `video_courses`, `video_lessons`, `orders`
  (전체 `0001_init.sql`). ✅ 확인: RLS로 `ebooks`/`video_lessons`는 anon/authenticated
  SELECT가 전혀 불가능한지 (Supabase SQL Editor에서 `set role authenticated;`로 확인).
- **3단계 — 상품 목록/상세**: `app/page.tsx`, `app/products/[id]/page.tsx`.
  ✅ 확인: 비로그인 상태에서도 목록/상세가 보이는지, 구매 버튼이 로그인 유도로
  바뀌는지.
- **4단계 — 결제 연동**: `components/PaymentWidget.tsx`, `app/checkout/[productId]`,
  `app/api/orders`, `app/api/payments/confirm`, `app/api/payments/webhook`,
  `app/payments/success|fail`. ✅ 확인: 테스트 결제 성공/취소 각각의 리다이렉트와
  주문 상태 변화.
- **5단계 — 콘텐츠 접근 제어**: `middleware.ts`, `lib/content-access.ts`,
  `app/api/content/**`, `app/content/**`. ✅ 확인: 아래 "필수 수동 테스트 시나리오".
- **6단계 — 마이페이지/관리자**: `app/mypage`, `app/admin/**`,
  `app/api/admin/products/**`. ✅ 확인: 구매 완료 후 마이페이지에서 콘텐츠로
  바로 이동되는지, 관리자 외 계정은 `/admin`이 404로 보이는지.

## 필수 수동 테스트 시나리오

1. **비로그인 유저가 콘텐츠 URL 직접 접근**
   - 브라우저 시크릿 모드로 `/content/ebook/<productId>` 또는
     `/content/video/<productId>`에 직접 접근.
   - 기대 결과: `middleware.ts`가 즉시 `/login?next=...`로 리다이렉트. 페이지
     본문이나 API 응답 어디에도 PDF/유튜브 URL이 노출되지 않아야 합니다.

2. **로그인했지만 미구매 유저가 접근**
   - 구매 이력이 없는 계정으로 로그인 후 같은 URL에 접근.
   - 기대 결과: `app/content/.../page.tsx`의 `hasUserPurchased` 체크가 false를
     반환하여 `/checkout/<productId>`로 리다이렉트. `/api/content/ebook/<id>`,
     `/api/content/video/<id>/lessons`, `/api/content/video/lesson/<id>`를
     브라우저 devtools나 curl로 직접 호출해도 403이어야 합니다.
     ```bash
     curl -i -H "Cookie: <미구매 유저 세션 쿠키>" \
       https://<도메인>/api/content/ebook/<productId>
     # => 403, body에 pdfUrl 없음
     ```

3. **결제 실패/취소 시 콘텐츠 접근이 부여되지 않는지**
   - 결제 위젯에서 테스트 카드로 결제를 취소하거나, 토스 테스트 실패 카드 사용.
   - 기대 결과: `/payments/fail`로 이동하고 `orders.status`는 `pending` 또는
     `failed`로 남아 `paid`가 되지 않음. 이후 콘텐츠 URL 접근 시 시나리오 2와 동일하게
     차단되어야 합니다.
   - 추가로: `/api/payments/confirm`에 금액을 조작한 값으로 직접 POST 요청을
     보내도 `finalizeOrderFromClientConfirm`의 금액 대조 로직에 의해 거부되는지 확인.

4. **결제 성공 후 실제로 마이페이지에서 콘텐츠 접근이 가능한지**
   - 정상 테스트 결제 완료 → `/payments/success`에서 승인 완료 메시지 확인.
   - `/mypage`에 방금 구매한 상품이 보이고 "이어보기" 클릭 시 실제 콘텐츠
     (PDF 링크 또는 강의 목록+영상)가 정상적으로 로드되는지 확인.
   - Supabase에서 `orders.status = 'paid'`, `toss_payment_key`가 채워졌는지 확인.
   - (선택) 토스 웹훅을 재전송해도 이미 `paid`인 주문이 중복 처리되지 않고
     그대로 유지되는지 확인 (`finalizeOrderFromWebhook`의 idempotency).

## 알려진 제약 / 다음 단계 후보

- 네이버 로그인, 강의 진도율, 쿠폰/할인 코드는 이번 MVP 범위 밖입니다.
- 관리자 강의 등록 UI는 "제목\|URL" 한 줄 입력 방식의 최소 구현입니다. 운영량이
  늘면 개별 입력 폼으로 교체를 권장합니다.
- `postcss@8.4.31`가 Next.js 내부 빌드 파이프라인의 전이 의존성으로 포함되어 있어
  `npm audit`에 high 등급으로 표시됩니다. 런타임에 사용자 입력 CSS를 처리하지
  않는 빌드타임 전용 의존성이라 이번 MVP에서는 허용했으나, Next.js 16으로
  올릴 때 함께 해소됩니다.

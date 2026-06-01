# signify-fe — Backend Wiring Plan

Replace the mock data / `localStorage` in the frontend with real calls to
`signify-api`. Split into small, independently reviewable PRs.

For now the API is **local**: `NEXT_PUBLIC_API_URL=http://localhost:8787`
(switch to the Railway URL once deployed).

## Conventions
- One thin fetch client (`src/lib/api.ts`) used everywhere — no extra data lib.
- JWT stored in `localStorage`, attached as `Authorization: Bearer <token>`.
- Errors surfaced via `sonner` toasts (already wired in `layout.tsx`).
- Demo login from the backend seed: **demo@signify.app / password123**.

## PR sequence

### PR#1 — API client + auth foundation ✅
- `src/lib/api.ts` — fetch wrapper (base URL from env, Bearer token, `ApiError`).
- `src/lib/auth-context.tsx` — `AuthProvider` + `useAuth` (login/register/logout/refresh,
  token persistence, loads `/api/me` on boot).
- `/login` and `/register` pages.
- Route guard in `MainLayout` (redirect to `/login` when unauthenticated).
- Landing page LOG IN / SIGN UP → `/login` / `/register`.
- Sidebar shows the real user (name + coins) and the logout button works.
- `.env.example` with `NEXT_PUBLIC_API_URL`.

### PR#2 — Profile & Settings ✅
- Profile page: `GET /api/me` + `PATCH /api/me`; show coins/streak.
- Change password: `POST /api/me/password`.
- Settings toggles + language → `GET/PUT /api/me/preferences`.

### PR#3 — Onboarding & Dashboard ✅
- Onboarding flow saves to `PUT /api/me/preferences` (drop the `localStorage`
  `hasCompletedOnboarding`; use `preferences.onboardingCompleted`).
- Dashboard reads `GET /api/dashboard` (streak, rank, daily goal, recommended,
  recent activity, daily quiz).

### PR#4 — Learning materials ✅
- List + search/filter via `GET /api/materials` (+ `categories` / `languages` facets).
- Detail via `GET /api/materials/:id` (+ `recommended`); update progress with
  `PUT /api/materials/:id/progress`.

### PR#5 — Quizzes ✅
- List/popular/filters via `GET /api/quizzes`.
- Detail + questions via `GET /api/quizzes/:id`; submit with
  `POST /api/quizzes/:id/attempts`; render the returned review payload; like/unlike.

### PR#6 — Shop & avatar ✅
- Items + owned/equipped via `GET /api/shop/items` and `GET /api/me/items`.
- Purchase via `POST /api/shop/items/:id/purchase`; equip via `PUT /api/shop/avatar`.
- Coins balance from the real user.

### PR#7 — Sign practice + Live translator + Chat ✅ (this PR)
- Sign practice: save results via `POST /api/sign-practice/sessions`; progress via
  `GET /api/sign-practice`. (Hand detection stays client-side / MediaPipe.)
- Live translator: `POST/GET /api/translator/sessions`.
- Chat widget: `POST /api/chat`; handle `503 ai_unavailable` gracefully
  (model still in development).

## Dependencies
PR#1 first (client + auth). PR#2–#7 each depend on it and can otherwise go in any
order; the sequence above mirrors the sidebar. AI features (PR#7) are wired but
show a "coming soon" state until the backend `AI_ENABLED` model exists.

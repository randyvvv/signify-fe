<p align="center">
  <img src="public/logo/logo-signify.png" alt="Signify logo" width="400" />
</p>

# Signify — Frontend

Signify is a sign-language learning platform. Learners study interactive materials,
take quizzes, practice signing with live hand tracking, and watch a 3D avatar sign
back any text — all wrapped in a gamified experience with streaks, coins, and a
shop for customizing your avatar.

This repository (`signify-fe`) is the web frontend, built with **Next.js 16** and the
**App Router**. It talks to a separate backend, `signify-api`.

**Live demo:** [ai-signify.com](https://ai-signify.com)

**Backend repo:** [github.com/randyvvv/signify-be](https://github.com/randyvvv/signify-be)

## Features

- **Learning materials** — browsable, searchable lessons with progress tracking.
- **Quizzes** — take quizzes, submit attempts, and review scored results.
- **Sign practice** — practice signs in front of your webcam; hand detection runs
  client-side via MediaPipe Tasks Vision.
- **Live translator** — type text and watch a 3D VRM avatar sign it, powered by
  SignGPT (`text → .pose`) and rendered with three.js / `@pixiv/three-vrm`.
- **Shop & avatar** — spend earned coins to buy and equip avatar items.
- **Dashboard** — streaks, daily goals, rank, recommendations, and recent activity.
- **Gamification** — coins, streaks, and daily quizzes.
- **Auth** — email/password login and registration with JWT stored in `localStorage`.

## Tech stack

- [Next.js 16](https://nextjs.org/) (App Router) + [React 19](https://react.dev/)
- [TypeScript](https://www.typescriptlang.org/)
- [Tailwind CSS v4](https://tailwindcss.com/) + [Radix UI](https://www.radix-ui.com/) primitives
- [three.js](https://threejs.org/), [@react-three/fiber](https://github.com/pmndrs/react-three-fiber) & [@pixiv/three-vrm](https://github.com/pixiv/three-vrm) for the 3D avatar
- [@mediapipe/tasks-vision](https://developers.google.com/mediapipe) for client-side hand detection
- [sonner](https://sonner.emilkowal.ski/) for toasts

## Getting started

### Prerequisites

- Node.js 20+
- A running instance of `signify-api` (defaults to `http://localhost:8787`)

### Setup

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env.local
# edit .env.local and point NEXT_PUBLIC_API_URL at your signify-api

# 3. Run the dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Demo login (from the backend seed): **demo@signify.app / password123**

## Environment variables

| Variable              | Description                                             | Default                 |
| --------------------- | ------------------------------------------------------- | ----------------------- |
| `NEXT_PUBLIC_API_URL` | Base URL of `signify-api`. Swap for the deployed URL.   | `http://localhost:8787` |

## Scripts

| Command         | Description                          |
| --------------- | ------------------------------------ |
| `npm run dev`   | Start the dev server                 |
| `npm run build` | Production build                     |
| `npm run start` | Serve the production build           |
| `npm run lint`  | Run ESLint                           |

## Project structure

```
src/
├── app/                    # App Router routes
│   ├── (app)/              # Authenticated app (dashboard, quizzes, shop, …)
│   ├── login/ register/    # Auth pages
│   └── api/                # Route handlers (SignGPT & YouTube transcript proxies)
├── components/
│   ├── dashboard/          # Dashboard & onboarding
│   ├── layout/             # Sidebar, footer, main layout
│   ├── shared/avatar/      # 3D VRM avatar rigging & pose playback
│   ├── shop/               # Shop UI + avatar canvas
│   └── ui/                 # Reusable UI primitives (button, card, …)
└── lib/
    ├── api.ts              # Thin fetch client (Bearer token + error handling)
    └── auth-context.tsx    # AuthProvider + useAuth
```

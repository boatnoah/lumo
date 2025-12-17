# Lumo

Lumo is a Next.js + Supabase classroom engagement app for running live, interactive sessions with slides, prompts, realtime responses, and chat.

## What’s Included

### Auth + Onboarding

- Email/password auth and Google OAuth via Supabase.
- Guided onboarding to choose a role (`teacher` or `student`) and select an avatar.
- Role-based access (teachers create/run sessions; students join and respond).

### Sessions (Teacher)

- Sessions dashboard: create sessions, search/filter by status (`draft`, `live`, `ended`), and delete sessions.
- Session builder:
  - Upload a PDF and convert pages into slide prompts (stored in Supabase Storage).
  - Add interactive prompts: multiple choice (MCQ), short response, and long response.
  - Drag-and-drop reorder prompts/slides.
  - Save changes and go live.

### Live Room (Teacher)

- Share a 6‑digit join code.
- Set the current prompt shown to students.
- Open/close responses on the current prompt.
- View incoming answers in realtime.
- Built-in realtime chat with students.
- End a session (moves it to `ended`).

### Live Room (Student)

- Join a live session using the 6‑digit join code.
- Realtime updates when the teacher changes prompts or opens/closes responses.
- Submit answers to the active prompt (MCQ / short / long text).
- Live chat.
- Presence tracking (see who’s currently in the room).
- Leave session and return later.

## Tech Stack

- Next.js (App Router) + React + TypeScript
- Tailwind CSS + Radix UI components
- Supabase (Auth, Postgres, Realtime, Storage)

## Local Development

### Prerequisites

- Node.js 20+ recommended
- npm
- A Supabase project (or local Supabase) for Auth/DB/Realtime/Storage

### 1) Install dependencies

```bash
npm install
```

### 2) Configure environment variables

Create a `.env.local` in the project root:

```bash
NEXT_PUBLIC_SUPABASE_URL="https://YOUR_PROJECT.supabase.co"
NEXT_PUBLIC_SUPABASE_PUBLISHABLE="YOUR_SUPABASE_ANON_KEY"
```

Notes:
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE` is the Supabase “anon/public” key (the app uses it in both server and client environments).
- If these aren’t set, the app will fail at runtime because the Supabase clients assert non-null env vars.

### 3) Supabase setup (required for the app to work)

At a minimum, the app expects these tables:

- `profiles` (user profile, role, avatar)
- `sessions` (created sessions, join codes, status, current prompt)
- `prompts` (slides + interactive prompts per session)
- `answers` (student responses per prompt)
- `messages` (chat messages per session)
- `session_members` (join/leave tracking)

Storage:

- Create a Storage bucket named `slides` (used for uploaded PDF slide images).

Realtime:

- Enable Realtime replication for `sessions` (students receive live status/current prompt updates).
- Enable Realtime replication for `answers` (teachers see answers update live).
- Presence and broadcast channels are also used for instant updates.

Auth:

- If using Google sign-in, enable the Google provider in Supabase Auth.
- Set redirect URLs to include:
  - `http://localhost:3000/auth/callback` (local)
  - `https://YOUR_DOMAIN/auth/callback` (production)

### 4) Run the app

```bash
npm run dev
```

Open `http://localhost:3000`.

## Scripts

- `npm run dev` — start local dev server
- `npm run build` — production build
- `npm run start` — run production server
- `npm run lint` — lint

## Typical Flow

- Teacher: sign in → dashboard → create session → edit session → upload slides/add prompts → save → go live → manage prompts & responses in the live room.
- Student: sign in → pick `student` role → join using code at `/session` → respond + chat → leave when done.

## Notes / Customization

- Avatar options are currently hard-coded in `app/profile/avatar/avatar-step.tsx`. Update those URLs if you want to host avatars in your own project.

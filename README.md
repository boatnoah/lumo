# Lumo

Run live classroom sessions with slides, interactive prompts, and real-time student responses.

https://github.com/user-attachments/assets/c7f0e4c6-9a0b-43e5-9117-03a89b5e1764

---

## Features

**Teachers**
- Build sessions from PDF slides — each page becomes a prompt
- Add multiple choice, short response, or long response prompts
- Go live with a 6-digit join code
- Control which prompt students see, open/close responses, and watch answers roll in real-time
- Built-in chat with the room

**Students**
- Join any live session with a code
- See the active prompt and submit answers instantly
- Live chat, presence tracking, and seamless rejoin

---

## Stack

Next.js (App Router) · TypeScript · Tailwind CSS · Radix UI · Supabase (Auth, Postgres, Realtime, Storage)

---

## Quick Start

```bash
npm install
npm run dev
```

Create `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL="https://YOUR_PROJECT.supabase.co"
NEXT_PUBLIC_SUPABASE_PUBLISHABLE="YOUR_SUPABASE_ANON_KEY"
```

**Supabase setup**

Tables: `profiles`, `sessions`, `prompts`, `answers`, `messages`, `session_members`

Storage: create a bucket named `slides`

Realtime: enable replication on `sessions` and `answers`

Auth: if using Google sign-in, add `http://localhost:3000/auth/callback` and your production URL to the allowed redirect URLs

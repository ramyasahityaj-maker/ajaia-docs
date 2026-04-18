# Ajaia Docs

A lightweight collaborative document editor built for the Ajaia LLC TPM assignment.

## Live Demo

> **URL:** [Add Vercel deployment URL here after deployment]  
> **Test accounts** (password: `password123`):  
> `alice@ajaia.com` · `bob@ajaia.com` · `carol@ajaia.com`

---

## Features

| Capability | Status |
|---|---|
| Rich text: bold, italic, underline, headings H1–H3, bullet/numbered lists, blockquote, code | ✅ |
| Create, rename (click title), delete documents | ✅ |
| Autosave (1.5s debounce) | ✅ |
| Import `.txt` / `.md` / `.docx` as new documents | ✅ |
| Share with any user — view or edit permission | ✅ |
| Revoke access | ✅ |
| Owned vs. shared doc distinction (dashboard badges) | ✅ |
| Persistence across refresh / server restart | ✅ |
| JWT auth with seeded test users | ✅ |
| User search autocomplete in share dialog | ✅ |
| 18 unit tests (db layer + auth) | ✅ |

---

## Quick Start

```bash
# 1. Install
npm install

# 2. Seed database (creates test users + sample doc)
node scripts/seed.js

# 3. Run dev server
npm run dev
# → http://localhost:3000

# 4. Tests
npm test
```

---

## Reviewing the Sharing Flow

1. Log in as `alice@ajaia.com`
2. Open "Welcome to Ajaia Docs" → click **Share**
3. Enter `bob@ajaia.com`, choose permission, click **Share**
4. Log out → log in as `bob@ajaia.com`
5. Document appears under **Shared with me** with a green badge

---

## File Import

Click **Import file** on the dashboard.

| Type | Behaviour |
|---|---|
| `.txt` | Double-newline paragraphs → TipTap paragraph nodes |
| `.md` | `#` headings, `-` lists, body text → corresponding TipTap nodes |
| `.docx` | Raw text extracted via `mammoth` → paragraphs |

Max: **5 MB**

---

## Project Structure

```
src/
├── app/api/         # REST API (auth, documents, share, upload, user search)
├── app/dashboard/   # Document list
├── app/doc/[id]/    # Editor
├── app/login|register/
├── components/      # Editor, ShareDialog, UploadButton
├── context/         # AuthContext (JWT state)
├── lib/             # db.ts, auth.ts, apiClient.ts
└── __tests__/       # 18 unit tests
data/                # JSON flat-file database (auto-created)
scripts/seed.js      # One-time database seed
```

---

## Environment Variables

| Variable | Default | Description |
|---|---|---|
| `JWT_SECRET` | `ajaia-docs-dev-secret-2024` | JWT signing secret — change in production |
| `NEXT_PUBLIC_SUPABASE_URL` | - | Supabase project URL (for production) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | - | Supabase anonymous key (for production) |

---

## Database

**Development:** JSON file (`./data/db.json`) — auto-created, no setup required  
**Production:** Supabase PostgreSQL — persistent, scalable

The app automatically switches to Supabase when environment variables are provided.

## Deployment

See [DEPLOYMENT.md](DEPLOYMENT.md) for comprehensive production deployment guide.

**Quick Start:**
```bash
# Vercel (recommended for Next.js)
npx vercel --prod

# Docker (self-hosted)
docker build -t ajaia-docs .
docker-compose -f docker-compose.prod.yml up -d

# Production build
npm run build && npm start
```

**Database Setup:** The app now uses Supabase PostgreSQL for production persistence. JSON files work for local development but won't persist on serverless platforms like Vercel.

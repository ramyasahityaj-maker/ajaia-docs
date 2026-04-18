# Ajaia Docs

A lightweight collaborative document editor built for the Ajaia LLC TPM assignment.

## Live Demo

> **URL:** [Add deployment URL here]  
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

| Variable | Default |
|---|---|
| `JWT_SECRET` | `ajaia-docs-dev-secret-2024` — change in production |

---

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

**Important:** The JSON database (`./data/db.json`) has an ephemeral filesystem on serverless platforms. For production:
- **Vercel:** Migrate to Supabase PostgreSQL (free tier available)
- **Self-hosted:** Use Docker with volume persistence
- See [DEPLOYMENT.md](DEPLOYMENT.md) for detailed migration steps

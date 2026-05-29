# SUBMISSION.md — Ajaia Docs

**Candidate:** Ramya Jakkula  
**Role:** Technical Program and Project Manager, AI Delivery  
**Assignment:** Lightweight collaborative document editor

---

## Contents of This Submission

| File / Folder | Description |
|---|---|
| `README.md` | Local setup, feature table, sharing flow walkthrough |
| `ARCHITECTURE.md` | Stack decisions, data model, API surface, prioritisation rationale, DB upgrade path |
| `AI-WORKFLOW.md` | AI tools used, where they helped, what was changed/rejected, verification approach |
| `SUBMISSION.md` | This file |
| `src/` | All application source code |
| `scripts/seed.js` | One-time database seed script |
| `data/db.json` | JSON flat-file database (auto-created by seed) |
| `[VIDEO_URL.txt]` | Unlisted Loom/YouTube link (add before final submission) |
| Live URL | [Add deployment URL before final submission] |

---

## Test Credentials

All accounts use the password `password123`.

| Email | Name | Notes |
|---|---|---|
| alice@ajaia.com | Alice Chen | Owner account; has a sample document |
| bob@ajaia.com | Bob Rivera | Use to test share recipient flow |
| carol@ajaia.com | Carol Park | Third collaborator |

---

## What Is Working (End-to-End)

- User registration and login with JWT auth
- Create new document (redirects directly to editor)
- Rich text editing: bold, italic, underline, strikethrough, H1/H2/H3, bullet list, numbered list, blockquote, inline code, code block, undo/redo
- Inline title rename (click the title in the header bar)
- Autosave every 1.5 seconds with save status indicator
- File import: `.txt`, `.md`, `.docx` → new editable document (drag-and-drop or file picker)
- Share dialog: email autocomplete, view/edit permission select, current collaborators list, revoke access
- Dashboard: owned documents (indigo badge) and shared documents (green badge) in separate sections
- Document search/filter on dashboard
- Delete document (owner only, with confirmation)
- View-only mode: editor toolbar hidden, "View only" badge shown to restricted users
- 18 passing unit tests (`npm test`)

---

## What Is Incomplete / Out of Scope

| Feature | Status | Notes |
|---|---|---|
| Real-time collaborative cursors | Not built | Would add Yjs + a WebSocket provider (e.g. PartyKit) |
| Version history / undo across sessions | Not built | Would snapshot content on each save |
| Export to PDF / Markdown | Not built | TipTap's `generateHTML` + `html2pdf` would handle this |
| Email notifications on share | Not built | Would add Resend or Nodemailer |
| Role-based permissions beyond view/edit | Not built | Data model supports extension; UI does not |
| Production-grade database | JSON file store | Swap path documented in ARCHITECTURE.md — same interface |

---

## What I Would Build Next (with 2–4 more hours)

1. **Persistent DB adapter** — Replace the JSON file store with Supabase (free tier, no infra needed for reviewers). `db.ts` interface is already stable; only the read/write implementation changes.
2. **Document version history** — Store the previous 10 content snapshots per document. Show a sidebar with timestamps; let the owner restore any version.
3. **Real-time presence** — Add Yjs document syncing via a lightweight WebSocket server. Show avatar indicators for who's currently editing.
4. **Export** — Add a "Download as Markdown" button using TipTap's `generateText` output.

---

## How to Run Locally

```bash
npm install
node scripts/seed.js
npm run dev
# → http://localhost:3000
```

```bash
npm test   # 18 unit tests, all passing
```

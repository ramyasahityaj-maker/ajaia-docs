# Architecture — Ajaia Docs

## Overview

Ajaia Docs is a single-repository full-stack Next.js 14 application using the App Router. The goal was to ship the highest-quality working product within a 4–6 hour timebox, which drove every architectural decision below.

---

## Stack Choices and Rationale

### Next.js 14 (App Router)
**Why:** One repo, one deploy. API routes live alongside frontend pages — no separate Express server to configure, no CORS headers to wrangle, no second Dockerfile to maintain. The App Router's file-based routing makes the URL structure self-documenting.

### TipTap (rich text editor)
**Why:** TipTap is a headless, ProseMirror-based editor with a small, composable extension API. It stores document state as structured JSON (not raw HTML), which means content is portable, diff-friendly, and trivially serialisable to the database. Alternative Slate.js was considered but TipTap's TypeScript-first approach and first-class Next.js support won out.

### JSON flat-file database (`data/db.json`)
**Why:** The assignment explicitly says "any practical storage approach, including a local file-based store if well documented." Shipping with SQLite would require a native binary build (which failed in this environment). A JSON file with synchronous `fs` reads/writes works on every Node runtime, needs zero setup from reviewers, and the data model is simple enough that a flat array scan is fast at this scale.

**Trade-off acknowledged:** Not suitable for concurrent writes at scale. The swap path to a real database is a single file (`src/lib/db.ts`) — the interface it exports (`createDocument`, `updateDocument`, `canUserAccess`, etc.) is identical to what a Prisma/Drizzle adapter would expose. No other file needs to change.

### JWT Authentication (no OAuth)
**Why:** A self-contained token scheme requires no external service and no environment-variable secrets beyond `JWT_SECRET`. Tokens are stored in `localStorage` and sent as `Authorization: Bearer <token>` headers. This is sufficient for a reviewer-facing demo.

### bcryptjs (not argon2)
**Why:** Pure-JS implementation — no native binaries, works in every environment including Vercel's Edge functions.

---

## Data Model

```
User
  id          UUID
  email       String (unique, case-insensitive)
  name        String
  passwordHash String
  createdAt   ISO timestamp

Document
  id          UUID
  title       String
  content     String  ← TipTap JSON, stringified
  ownerId     UUID → User.id
  createdAt   ISO timestamp
  updatedAt   ISO timestamp

Share
  id          UUID
  documentId  UUID → Document.id
  userId      UUID → User.id
  permission  "view" | "edit"
  createdAt   ISO timestamp
```

Cascade delete: when a document is deleted, all its Share records are also removed.

---

## API Surface

```
POST   /api/auth/login          Authenticate, return JWT
POST   /api/auth/register       Create user, return JWT
GET    /api/auth/me             Decode token, return current user

GET    /api/documents           List owned + shared documents
POST   /api/documents           Create document
GET    /api/documents/[id]      Get document + shares (if owner)
PATCH  /api/documents/[id]      Update title (owner) or content (owner/editor)
DELETE /api/documents/[id]      Delete document (owner only)

GET    /api/documents/[id]/share   List collaborators (owner only)
POST   /api/documents/[id]/share   Add/update a share (owner only)
DELETE /api/documents/[id]/share   Revoke access (owner only)

POST   /api/upload              Import .txt/.md/.docx → new document

GET    /api/users/search?q=     Autocomplete users by email/name
```

Every protected route extracts the JWT from the `Authorization: Bearer` header. No middleware file — each handler calls `getUserFromRequest(req)` directly, which keeps the auth logic explicit and easy to trace.

---

## Frontend Architecture

```
AuthContext (localStorage + JWT)
  └── layout.tsx
       ├── / (redirect)
       ├── /login
       ├── /register
       ├── /dashboard      ← owned + shared doc grid
       └── /doc/[id]       ← editor + toolbar + share dialog
            ├── Editor.tsx        (TipTap + toolbar)
            ├── ShareDialog.tsx   (user search, permission select, revoke)
            └── UploadButton.tsx  (drag-and-drop file import)
```

`apiClient.ts` is a typed fetch wrapper. Every API call goes through it, so token injection is centralised and response types are inferred.

---

## Prioritisation Decisions

**Built first (highest reviewer impact):**
1. Core editing flow — create, open, edit with autosave
2. Sharing model — full owner/editor/viewer permission chain
3. Dashboard with owned/shared distinction and doc previews

**Built second:**
4. File import (`.txt`, `.md`, `.docx`)
5. Inline title rename
6. User autocomplete in share dialog
7. Automated tests

**Deliberately omitted (would build next):**
- Real-time presence / collaborative cursors (would add Yjs + WebSocket provider)
- Document version history (would store content snapshots on each save)
- Export to PDF/Markdown
- Role-based permissions beyond view/edit (e.g. commenter)
- Full-text search across document content
- Email notifications on share

---

## Upgrading the Database

To swap in Postgres/Supabase:

1. Replace the body of `src/lib/db.ts` with Prisma or Drizzle calls
2. Keep the same exported function signatures (`createDocument`, `getDocumentById`, `canUserAccess`, etc.)
3. Run `npx prisma migrate dev` (or equivalent)
4. No other files need to change

The rest of the codebase treats `db.ts` as an opaque data layer.

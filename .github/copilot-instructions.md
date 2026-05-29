# Ajaia Docs — AI Agent Instructions

## Architecture Overview

**Ajaia Docs** is a single-repo Next.js 14 App Router app with these core layers:

- **API** (`src/app/api/`): REST routes with JWT auth, no middleware — each handler calls `getUserFromRequest()` explicitly
- **Frontend** (`src/app/dashboard/`, `src/app/doc/`): React components, AuthContext for JWT state
- **Database** (`src/lib/db.ts`): Flat-file JSON (swappable via interface); exports typed functions like `createDocument()`, `findUserById()`
- **Content Format**: Documents stored as **TipTap JSON strings** (not HTML)

## Key Patterns

### Database / Data Access

The **entire data layer is isolated in `src/lib/db.ts`**. All exports have clear function signatures:

```typescript
// Read
getDb(): DB
findUserById(id: string): User | undefined
getDocumentsForUser(userId: string): { owned, shared }

// Write (always use this pattern)
saveAndReturn<T>(mutate: (db: DB) => T): T
```

**When adding features:** If you need to fetch/update data, add the function to `db.ts` first, then call it from handlers/components. This keeps data logic testable and centralized.

### API Routes & Auth

**Pattern for protected routes** (`src/app/api/`):

```typescript
export async function GET(req: NextRequest) {
  const payload = getUserFromRequest(req);
  if (!payload) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  // safe to use payload.userId ...
}
```

**No middleware.** Auth is explicit in every handler for readability. Token is sent as `Authorization: Bearer <token>` header.

### Rich Text Content

Documents store content as **TipTap JSON** (structured, not HTML). When creating a new doc:

```typescript
content: JSON.stringify({ type: "doc", content: [] }) // Empty doc
```

**Why:** Portable, diff-friendly, type-safe, serializable. Changes to the document flow through `Editor.tsx` → autosave → `PATCH /api/documents/[id]`.

### Component Organization

- **Pages** (`src/app/page.tsx`, `src/app/dashboard/page.tsx`, etc.): Route handlers, fetch data, pass to layout
- **Components** (`src/components/`): Reusable UI (Editor, ShareDialog, UploadButton); hooks for auth via useContext(AuthContext)
- **Context** (`src/context/AuthContext.tsx`): Centralized JWT + user state; wraps `<body>` in root layout

### Testing

- **Framework**: Vitest with Node environment (`vitest.config.ts`)
- **Location**: `src/__tests__/*.test.ts`
- **Pattern**: Unit tests for db layer (`core.test.ts` tests `createUser()`, `canUserAccess()`, etc.) — API integration tests live in git history but focus is on data layer
- **Run**: `npm test` or `npm test:watch`

## Permissions Model

Three-level sharing: **owner** (can edit + revoke) → **editor** (can edit, not revoke) → **viewer** (read-only).

Stored in `Share` table:

```typescript
interface Share {
  documentId: string;
  userId: string;
  permission: "view" | "edit";
}
```

**Check permission** via `canUserAccess(userId, documentId)` in `db.ts` — always do this before returning a document to a frontend user.

## File Imports

File upload handler (`src/app/api/upload/route.ts`):

1. Parse multipart form via `multer`
2. Detect format (.txt, .md, .docx)
3. Convert to TipTap JSON (mammoth for .docx)
4. Return new document ID

**When extending:** Add new file type detection in `upload/route.ts`, then export a parser function for content transformation.

## Environment & Running

| Task | Command |
|---|---|
| Dev server | `npm run dev` (→ localhost:3000) |
| Tests | `npm test` or `npm test:watch` |
| Seed test users | `npm run seed` (creates alice@, bob@, carol@ with password `password123`) |
| Linting | `npm run lint` (ESLint) |
| Build (prod) | `npm run build` → `npm start` |

**Environment variables:**
- `JWT_SECRET`: Defaults to `ajaia-docs-dev-secret-2024` (change in production)
- Database: Auto-created at `data/db.json`

## Upgrading to a Real Database

Replace body of `src/lib/db.ts` with Prisma/Drizzle/Supabase calls. **Keep the same function signatures.** Every other file imports from this layer and expects the same interface. No changes needed elsewhere.

## TypeScript / Import Paths

- **Module alias**: `@` resolves to `src/` (tsconfig + vitest.config)
- **Example**: `import { getDb } from "@/lib/db"` ✓

## Common Workflows

- **Add a new share permission type?** Update `Share.permission` type in `db.ts`, then check all `canUserAccess()` call sites
- **Add a new API route?** Create file under `src/app/api/`, follow the auth + error response pattern, add tests for db layer
- **Modify editor toolbar?** Edit `Editor.tsx` and `Editor` extension imports from `@tiptap/extension-*`
- **Add user fields?** Update `User` interface in `db.ts`, then seed script + migration logic if needed

## Style & Conventions

- **Naming**: kebab-case for files (`upload-button.tsx`), camelCase for exports
- **CSS**: Tailwind utilities in JSX (no separate `.css` files for components)
- **Error handling**: Always return HTTP status codes + JSON `{ error: "..." }`
- **Timestamps**: ISO 8601 strings (`new Date().toISOString()`)

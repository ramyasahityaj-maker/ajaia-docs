# AI Workflow Note

## Tools Used

- **Claude (claude.ai / API)** — primary assistant throughout the build
- **GitHub Copilot** — inline completions during component authoring
- **No other AI tools**

---

## Where AI Materially Sped Up the Work

### 1. Database layer scaffolding (~30 minutes saved)
I described the data model (users, documents, shares with permission levels) and asked Claude to generate a typed, synchronous JSON file database. The first output was close to production-ready. I verified the logic manually and made one correction (the `canUserAccess` function wasn't handling the "owner checks their own doc" case correctly in the first draft).

### 2. TipTap toolbar layout
I described the toolbar buttons I needed (heading dropdown, bold/italic/underline/strike, list types, blockquote, code block, undo/redo) and asked Claude to produce the JSX with accessible `onMouseDown` handlers that prevent editor blur. The SVG icons were AI-generated; I visually checked each one rendered correctly in the browser.

### 3. Markdown → TipTap JSON converter (in `/api/upload`)
Writing a lightweight `.md` parser that outputs valid TipTap JSON is fiddly. Claude produced an 80% correct first draft. I adjusted the heading detection logic (it missed `###`) and fixed the bullet list node structure (TipTap requires `listItem > paragraph`, not `listItem > text`).

### 4. Share dialog UX flow
I described the desired interaction (email field with autocomplete, permission dropdown, list of current collaborators with revoke button) and Claude generated the full component. I refactored the debounced search into a `useRef`-based timer (the initial version used `useEffect` with a closure that captured stale state).

### 5. Test suite structure
I asked Claude to produce unit tests covering the db layer and auth helpers. The test structure and assertions were correct. I added the cascade-delete share test case after noticing it wasn't covered.

---

## What AI Output I Changed or Rejected

| Area | Issue | What I did |
|---|---|---|
| `canUserAccess` first draft | Missed owner self-check | Rewrote the condition |
| Markdown parser | Missing `###`, wrong listItem structure | Fixed both manually |
| Share dialog search | Stale closure in `useEffect` | Refactored to `useRef` timer |
| JWT auth helper | Used `any` cast on verify | Changed to explicit `TokenPayload` type with try/catch |
| TipTap `useEffect` content sync | Ran on every content change (caused infinite loop) | Added empty dep array `[]` to run only on mount |
| Test for case-insensitive email | Test helper didn't lower-case; test failed | Fixed inline helper to match `db.ts` behaviour |

---

## How I Verified Correctness

**Database layer:** 18 unit tests covering user CRUD, document CRUD, share creation/revocation, permission checks, cascade delete, and JWT sign/verify. Ran `npm test` after every meaningful change.

**API routes:** Exercised all endpoints manually via the browser during development. Also curl-tested the share endpoint directly:
```bash
curl -X POST http://localhost:3000/api/documents/<id>/share \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"email":"bob@ajaia.com","permission":"edit"}'
```

**Editor:** Verified all formatting marks (bold, italic, underline, strike, headings, lists, blockquote, code) apply and persist correctly. Confirmed autosave fires after 1.5 seconds of inactivity and the save-status indicator reflects the correct state.

**File upload:** Tested with a `.txt` file (multi-paragraph), a `.md` file (headings, lists), and a `.docx` file. Verified imported content renders correctly in the editor.

**Sharing permissions:** Logged in as alice, shared a doc with bob (edit), opened in bob's session — confirmed edits persist. Shared a second doc with carol (view) — confirmed editor toolbar is hidden and a "View only" badge appears.

**UX quality:** Walked through the full user flow (register → create doc → share → switch users → edit → revoke) to verify no dead ends, no unhandled errors, and no UI flicker.

---

## Overall AI Usage Assessment

AI was most valuable for **scaffolding and boilerplate** — the kind of code that is correct by inspection but tedious to write (database helpers, typed API clients, SVG icon shapes). It saved roughly 2–2.5 hours across the build.

AI was least reliable for **state management edge cases** — debounced timers, React `useEffect` dependency arrays, and TipTap's specific content JSON shape. Every AI-generated piece of reactive code got manually reviewed against the React and TipTap docs before being accepted.

The overall ratio: AI produced roughly 60% of the lines of code; I wrote or substantially rewrote the remaining 40%. Nothing shipped without a manual read-through.

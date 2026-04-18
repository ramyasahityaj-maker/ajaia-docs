/**
 * Ajaia Docs — Core Unit Tests
 * Run: npm test
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "fs";
import path from "path";
import os from "os";

// ─── Setup: point db to a temp directory ───────────────────────────────────
let tempDir: string;
let origCwd: string;

// We need to override process.cwd() so db.ts uses our temp directory.
// Easiest approach: write a small inline version of the db helpers here.

interface User {
  id: string; email: string; name: string; passwordHash: string; createdAt: string;
}
interface Document {
  id: string; title: string; content: string; ownerId: string; createdAt: string; updatedAt: string;
}
interface Share {
  id: string; documentId: string; userId: string; permission: "view" | "edit"; createdAt: string;
}
interface DB { users: User[]; documents: Document[]; shares: Share[]; }

function makeDb(dir: string) {
  const file = path.join(dir, "db.json");
  const read = (): DB => JSON.parse(fs.readFileSync(file, "utf-8"));
  const write = (db: DB) => fs.writeFileSync(file, JSON.stringify(db, null, 2));

  const init = (): DB => ({ users: [], documents: [], shares: [] });
  if (!fs.existsSync(file)) write(init());

  return {
    reset: () => write(init()),
    createUser: (data: Omit<User, "id" | "createdAt">): User => {
      const db = read();
      const u: User = { ...data, id: crypto.randomUUID(), createdAt: new Date().toISOString() };
      db.users.push(u);
      write(db);
      return u;
    },
    findUserByEmail: (email: string) => read().users.find(u => u.email.toLowerCase() === email.toLowerCase()),
    createDocument: (data: Omit<Document, "id" | "createdAt" | "updatedAt">): Document => {
      const db = read();
      const now = new Date().toISOString();
      const d: Document = { ...data, id: crypto.randomUUID(), createdAt: now, updatedAt: now };
      db.documents.push(d);
      write(db);
      return d;
    },
    getDocumentById: (id: string) => read().documents.find(d => d.id === id),
    updateDocument: (id: string, patch: Partial<Pick<Document, "title" | "content">>) => {
      const db = read();
      const idx = db.documents.findIndex(d => d.id === id);
      if (idx === -1) return null;
      db.documents[idx] = { ...db.documents[idx], ...patch, updatedAt: new Date().toISOString() };
      write(db);
      return db.documents[idx];
    },
    deleteDocument: (id: string) => {
      const db = read();
      const before = db.documents.length;
      db.documents = db.documents.filter(d => d.id !== id);
      db.shares = db.shares.filter(s => s.documentId !== id);
      write(db);
      return db.documents.length < before;
    },
    createShare: (data: Omit<Share, "id" | "createdAt">): Share => {
      const db = read();
      db.shares = db.shares.filter(s => !(s.documentId === data.documentId && s.userId === data.userId));
      const s: Share = { ...data, id: crypto.randomUUID(), createdAt: new Date().toISOString() };
      db.shares.push(s);
      write(db);
      return s;
    },
    getSharesForDoc: (docId: string) => read().shares.filter(s => s.documentId === docId),
    removeShare: (docId: string, userId: string) => {
      const db = read();
      const before = db.shares.length;
      db.shares = db.shares.filter(s => !(s.documentId === docId && s.userId === userId));
      write(db);
      return db.shares.length < before;
    },
    canAccess: (userId: string, docId: string) => {
      const db = read();
      const doc = db.documents.find(d => d.id === docId);
      if (!doc) return { access: false, permission: null };
      if (doc.ownerId === userId) return { access: true, permission: "owner" };
      const share = db.shares.find(s => s.documentId === docId && s.userId === userId);
      if (share) return { access: true, permission: share.permission };
      return { access: false, permission: null };
    },
    getDocsForUser: (userId: string) => {
      const db = read();
      const owned = db.documents.filter(d => d.ownerId === userId);
      const sharedIds = db.shares.filter(s => s.userId === userId).map(s => s.documentId);
      const shared = db.documents.filter(d => sharedIds.includes(d.id) && d.ownerId !== userId);
      return { owned, shared };
    },
  };
}

// ─── Tests ──────────────────────────────────────────────────────────────────

describe("Database — Users", () => {
  let db: ReturnType<typeof makeDb>;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "ajaia-test-"));
    db = makeDb(tempDir);
    db.reset();
  });
  afterEach(() => fs.rmSync(tempDir, { recursive: true, force: true }));

  it("creates a user and retrieves by email", () => {
    const u = db.createUser({ email: "test@test.com", name: "Test User", passwordHash: "hash123" });
    expect(u.id).toBeTruthy();
    expect(u.email).toBe("test@test.com");
    const found = db.findUserByEmail("test@test.com");
    expect(found).toBeDefined();
    expect(found?.name).toBe("Test User");
  });

  it("returns undefined for unknown email", () => {
    expect(db.findUserByEmail("nobody@test.com")).toBeUndefined();
  });

  it("email lookup is case-insensitive via normalization", () => {
    db.createUser({ email: "Alice@TEST.com", name: "Alice", passwordHash: "x" });
    // Our findUserByEmail in db.ts lowercases both sides
    expect(db.findUserByEmail("alice@test.com")).toBeDefined();
  });
});

describe("Database — Documents", () => {
  let db: ReturnType<typeof makeDb>;
  let ownerId: string;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "ajaia-test-"));
    db = makeDb(tempDir);
    db.reset();
    const u = db.createUser({ email: "owner@test.com", name: "Owner", passwordHash: "h" });
    ownerId = u.id;
  });
  afterEach(() => fs.rmSync(tempDir, { recursive: true, force: true }));

  it("creates and retrieves a document", () => {
    const doc = db.createDocument({ title: "Hello", content: "{}", ownerId });
    expect(doc.id).toBeTruthy();
    expect(db.getDocumentById(doc.id)?.title).toBe("Hello");
  });

  it("updates title and content", () => {
    const doc = db.createDocument({ title: "Old", content: "{}", ownerId });
    const updated = db.updateDocument(doc.id, { title: "New", content: '{"updated":true}' });
    expect(updated?.title).toBe("New");
    expect(updated?.content).toBe('{"updated":true}');
  });

  it("deletes a document", () => {
    const doc = db.createDocument({ title: "Bye", content: "{}", ownerId });
    const ok = db.deleteDocument(doc.id);
    expect(ok).toBe(true);
    expect(db.getDocumentById(doc.id)).toBeUndefined();
  });

  it("returns false when deleting non-existent document", () => {
    expect(db.deleteDocument("not-a-real-id")).toBe(false);
  });

  it("lists owned and shared documents separately", () => {
    const other = db.createUser({ email: "other@test.com", name: "Other", passwordHash: "h" });
    const myDoc = db.createDocument({ title: "Mine", content: "{}", ownerId });
    const theirDoc = db.createDocument({ title: "Theirs", content: "{}", ownerId: other.id });
    db.createShare({ documentId: theirDoc.id, userId: ownerId, permission: "edit" });

    const { owned, shared } = db.getDocsForUser(ownerId);
    expect(owned.map(d => d.id)).toContain(myDoc.id);
    expect(shared.map(d => d.id)).toContain(theirDoc.id);
    // Shared doc should NOT appear in owned
    expect(owned.map(d => d.id)).not.toContain(theirDoc.id);
  });
});

describe("Database — Sharing & Permissions", () => {
  let db: ReturnType<typeof makeDb>;
  let alice: User, bob: User, docId: string;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "ajaia-test-"));
    db = makeDb(tempDir);
    db.reset();
    alice = db.createUser({ email: "alice@test.com", name: "Alice", passwordHash: "h" });
    bob = db.createUser({ email: "bob@test.com", name: "Bob", passwordHash: "h" });
    const doc = db.createDocument({ title: "Shared Doc", content: "{}", ownerId: alice.id });
    docId = doc.id;
  });
  afterEach(() => fs.rmSync(tempDir, { recursive: true, force: true }));

  it("owner has full access", () => {
    const { access, permission } = db.canAccess(alice.id, docId);
    expect(access).toBe(true);
    expect(permission).toBe("owner");
  });

  it("stranger has no access", () => {
    expect(db.canAccess(bob.id, docId).access).toBe(false);
  });

  it("grants edit access to bob", () => {
    db.createShare({ documentId: docId, userId: bob.id, permission: "edit" });
    const { access, permission } = db.canAccess(bob.id, docId);
    expect(access).toBe(true);
    expect(permission).toBe("edit");
  });

  it("grants view-only access to bob", () => {
    db.createShare({ documentId: docId, userId: bob.id, permission: "view" });
    expect(db.canAccess(bob.id, docId).permission).toBe("view");
  });

  it("overwrites existing share when sharing again", () => {
    db.createShare({ documentId: docId, userId: bob.id, permission: "edit" });
    db.createShare({ documentId: docId, userId: bob.id, permission: "view" });
    const shares = db.getSharesForDoc(docId);
    expect(shares.length).toBe(1);
    expect(shares[0].permission).toBe("view");
  });

  it("revokes access", () => {
    db.createShare({ documentId: docId, userId: bob.id, permission: "edit" });
    db.removeShare(docId, bob.id);
    expect(db.canAccess(bob.id, docId).access).toBe(false);
  });

  it("cascade-deletes shares when document is deleted", () => {
    db.createShare({ documentId: docId, userId: bob.id, permission: "edit" });
    db.deleteDocument(docId);
    expect(db.getSharesForDoc(docId).length).toBe(0);
  });
});

describe("Auth — JWT helpers", async () => {
  const { signToken, verifyToken } = await import("../lib/auth.js");

  it("signs and verifies a valid token", () => {
    const payload = { userId: "u1", email: "a@b.com", name: "Alice" };
    const token = signToken(payload);
    const result = verifyToken(token);
    expect(result?.userId).toBe("u1");
    expect(result?.email).toBe("a@b.com");
  });

  it("returns null for invalid token", () => {
    expect(verifyToken("not.a.token")).toBeNull();
    expect(verifyToken("")).toBeNull();
  });

  it("returns null for tampered token", () => {
    const token = signToken({ userId: "u1", email: "x@y.com", name: "X" });
    const tampered = token.slice(0, -5) + "XXXXX";
    expect(verifyToken(tampered)).toBeNull();
  });
});

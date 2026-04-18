import fs from "fs";
import path from "path";
import crypto from "crypto";

const DATA_DIR = path.join(process.cwd(), "data");
const DB_FILE = path.join(DATA_DIR, "db.json");

export interface User {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
  createdAt: string;
}

export interface Document {
  id: string;
  title: string;
  content: string; // TipTap JSON string
  ownerId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Share {
  id: string;
  documentId: string;
  userId: string;
  permission: "view" | "edit";
  createdAt: string;
}

export interface DB {
  users: User[];
  documents: Document[];
  shares: Share[];
}

function ensureDb(): DB {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(DB_FILE)) {
    const initial: DB = { users: [], documents: [], shares: [] };
    fs.writeFileSync(DB_FILE, JSON.stringify(initial, null, 2));
  }
  const raw = fs.readFileSync(DB_FILE, "utf-8");
  return JSON.parse(raw) as DB;
}

function saveDb(db: DB) {
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
}

export function getDb(): DB {
  return ensureDb();
}

export function saveAndReturn<T>(mutate: (db: DB) => T): T {
  const db = ensureDb();
  const result = mutate(db);
  saveDb(db);
  return result;
}

export function newId(): string {
  return crypto.randomUUID();
}

// ---- Users ----
export function findUserByEmail(email: string): User | undefined {
  const db = getDb();
  return db.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
}

export function findUserById(id: string): User | undefined {
  const db = getDb();
  return db.users.find((u) => u.id === id);
}

export function createUser(data: Omit<User, "id" | "createdAt">): User {
  return saveAndReturn((db) => {
    const user: User = { ...data, id: newId(), createdAt: new Date().toISOString() };
    db.users.push(user);
    return user;
  });
}

// ---- Documents ----
export function getDocumentById(id: string): Document | undefined {
  const db = getDb();
  return db.documents.find((d) => d.id === id);
}

export function getDocumentsForUser(userId: string): {
  owned: Document[];
  shared: Document[];
} {
  const db = getDb();
  const owned = db.documents.filter((d) => d.ownerId === userId);
  const sharedIds = db.shares
    .filter((s) => s.userId === userId)
    .map((s) => s.documentId);
  const shared = db.documents.filter(
    (d) => sharedIds.includes(d.id) && d.ownerId !== userId
  );
  return { owned, shared };
}

export function createDocument(data: Omit<Document, "id" | "createdAt" | "updatedAt">): Document {
  return saveAndReturn((db) => {
    const doc: Document = {
      ...data,
      id: newId(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    db.documents.push(doc);
    return doc;
  });
}

export function updateDocument(id: string, data: Partial<Pick<Document, "title" | "content">>): Document | null {
  return saveAndReturn((db) => {
    const idx = db.documents.findIndex((d) => d.id === id);
    if (idx === -1) return null;
    db.documents[idx] = {
      ...db.documents[idx],
      ...data,
      updatedAt: new Date().toISOString(),
    };
    return db.documents[idx];
  });
}

export function deleteDocument(id: string): boolean {
  return saveAndReturn((db) => {
    const idx = db.documents.findIndex((d) => d.id === id);
    if (idx === -1) return false;
    db.documents.splice(idx, 1);
    db.shares = db.shares.filter((s) => s.documentId !== id);
    return true;
  });
}

// ---- Shares ----
export function getSharesForDocument(docId: string): Share[] {
  const db = getDb();
  return db.shares.filter((s) => s.documentId === docId);
}

export function createShare(data: Omit<Share, "id" | "createdAt">): Share {
  return saveAndReturn((db) => {
    // Remove existing share for this user+doc first
    db.shares = db.shares.filter(
      (s) => !(s.documentId === data.documentId && s.userId === data.userId)
    );
    const share: Share = { ...data, id: newId(), createdAt: new Date().toISOString() };
    db.shares.push(share);
    return share;
  });
}

export function removeShare(documentId: string, userId: string): boolean {
  return saveAndReturn((db) => {
    const before = db.shares.length;
    db.shares = db.shares.filter(
      (s) => !(s.documentId === documentId && s.userId === userId)
    );
    return db.shares.length < before;
  });
}

export function canUserAccess(userId: string, docId: string): { access: boolean; permission: "owner" | "edit" | "view" | null } {
  const db = getDb();
  const doc = db.documents.find((d) => d.id === docId);
  if (!doc) return { access: false, permission: null };
  if (doc.ownerId === userId) return { access: true, permission: "owner" };
  const share = db.shares.find((s) => s.documentId === docId && s.userId === userId);
  if (share) return { access: true, permission: share.permission };
  return { access: false, permission: null };
}

import fs from "fs";
import path from "path";
import crypto from "crypto";

// Check if Supabase is configured
const useSupabase = process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Conditionally import and use Supabase or JSON database
let dbModule: any;
if (useSupabase) {
  // Use Supabase in production
  dbModule = require('./supabase-db');
} else {
  // Use JSON file in development/local
  const DATA_DIR = path.join(process.cwd(), "data");
  const DB_FILE = path.join(DATA_DIR, "db.json");

  function ensureDb(): any {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(DB_FILE)) {
      const initial = { users: [], documents: [], shares: [] };
      fs.writeFileSync(DB_FILE, JSON.stringify(initial, null, 2));
    }
    const raw = fs.readFileSync(DB_FILE, "utf-8");
    return JSON.parse(raw);
  }

  function saveDb(db: any): void {
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
  }

  // JSON-based implementations (synchronous)
  dbModule = {
    // Users
    findUserByEmail(email: string) {
      const db = ensureDb();
      return db.users.find((u: any) => u.email.toLowerCase() === email.toLowerCase());
    },

    findUserById(id: string) {
      const db = ensureDb();
      return db.users.find((u: any) => u.id === id);
    },

    createUser(data: any) {
      const db = ensureDb();
      const user = { ...data, id: crypto.randomUUID(), createdAt: new Date().toISOString() };
      db.users.push(user);
      saveDb(db);
      return user;
    },

    searchUsers(query: string) {
      const db = ensureDb();
      return db.users.filter((u: any) =>
        u.email.toLowerCase().includes(query.toLowerCase()) ||
        u.name.toLowerCase().includes(query.toLowerCase())
      ).slice(0, 10);
    },

    // Documents
    getDocumentById(id: string) {
      const db = ensureDb();
      return db.documents.find((d: any) => d.id === id);
    },

    getDocumentsForUser(userId: string) {
      const db = ensureDb();
      const owned = db.documents.filter((d: any) => d.ownerId === userId);
      const sharedIds = db.shares
        .filter((s: any) => s.userId === userId)
        .map((s: any) => s.documentId);
      const shared = db.documents.filter(
        (d: any) => sharedIds.includes(d.id) && d.ownerId !== userId
      );
      return { owned, shared };
    },

    createDocument(data: any) {
      const db = ensureDb();
      const doc = {
        ...data,
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      db.documents.push(doc);
      saveDb(db);
      return doc;
    },

    updateDocument(id: string, data: any) {
      const db = ensureDb();
      const idx = db.documents.findIndex((d: any) => d.id === id);
      if (idx === -1) return null;
      db.documents[idx] = {
        ...db.documents[idx],
        ...data,
        updatedAt: new Date().toISOString(),
      };
      saveDb(db);
      return db.documents[idx];
    },

    deleteDocument(id: string) {
      const db = ensureDb();
      const idx = db.documents.findIndex((d: any) => d.id === id);
      if (idx === -1) return false;
      db.documents.splice(idx, 1);
      db.shares = db.shares.filter((s: any) => s.documentId !== id);
      saveDb(db);
      return true;
    },

    // Shares
    getSharesForDocument(docId: string) {
      const db = ensureDb();
      return db.shares.filter((s: any) => s.documentId === docId);
    },

    createShare(data: any) {
      const db = ensureDb();
      // Remove existing share for this user+doc first
      db.shares = db.shares.filter(
        (s: any) => !(s.documentId === data.documentId && s.userId === data.userId)
      );
      const share = { ...data, id: crypto.randomUUID(), createdAt: new Date().toISOString() };
      db.shares.push(share);
      saveDb(db);
      return share;
    },

    removeShare(documentId: string, userId: string) {
      const db = ensureDb();
      const before = db.shares.length;
      db.shares = db.shares.filter(
        (s: any) => !(s.documentId === documentId && s.userId === userId)
      );
      saveDb(db);
      return db.shares.length < before;
    },

    canUserAccess(userId: string, docId: string) {
      const db = ensureDb();
      const doc = db.documents.find((d: any) => d.id === docId);
      if (!doc) return { access: false, permission: null };
      if (doc.ownerId === userId) return { access: true, permission: "owner" };
      const share = db.shares.find((s: any) => s.documentId === docId && s.userId === userId);
      if (share) return { access: true, permission: share.permission };
      return { access: false, permission: null };
    }
  };
}

// Export all functions
export const {
  findUserByEmail,
  findUserById,
  createUser,
  searchUsers,
  getDocumentById,
  getDocumentsForUser,
  createDocument,
  updateDocument,
  deleteDocument,
  getSharesForDocument,
  createShare,
  removeShare,
  canUserAccess
} = dbModule;

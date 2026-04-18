#!/usr/bin/env node
/**
 * Run this ONCE before starting the dev server:
 *   node scripts/seed.js
 */

// eslint-disable-next-line @typescript-eslint/no-require-imports
const fs = require("fs");
// eslint-disable-next-line @typescript-eslint/no-require-imports
const path = require("path");
// eslint-disable-next-line @typescript-eslint/no-require-imports
const crypto = require("crypto");
// eslint-disable-next-line @typescript-eslint/no-require-imports
const bcrypt = require("bcryptjs");

const DATA_DIR = path.join(__dirname, "..", "data");
const DB_FILE = path.join(DATA_DIR, "db.json");

function ensureDb() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, JSON.stringify({ users: [], documents: [], shares: [] }, null, 2));
  }
  return JSON.parse(fs.readFileSync(DB_FILE, "utf-8"));
}

async function main() {
  console.log("🌱 Seeding Ajaia Docs database...\n");
  const db = ensureDb();

  const accounts = [
    { email: "alice@ajaia.com", name: "Alice Chen", password: "password123" },
    { email: "bob@ajaia.com",   name: "Bob Rivera",  password: "password123" },
    { email: "carol@ajaia.com", name: "Carol Park",  password: "password123" },
  ];

  for (const account of accounts) {
    const exists = db.users.find(u => u.email === account.email);
    if (exists) {
      console.log(`  ✓ Already exists: ${account.email}`);
      continue;
    }
    const passwordHash = await bcrypt.hash(account.password, 10);
    const user = {
      id: crypto.randomUUID(),
      email: account.email,
      name: account.name,
      passwordHash,
      createdAt: new Date().toISOString(),
    };
    db.users.push(user);
    console.log(`  ✓ Created: ${account.email}`);
  }

  // Add a sample document for alice
  const alice = db.users.find(u => u.email === "alice@ajaia.com");
  if (alice && !db.documents.find(d => d.ownerId === alice.id)) {
    const doc = {
      id: crypto.randomUUID(),
      title: "Welcome to Ajaia Docs",
      content: JSON.stringify({
        type: "doc",
        content: [
          { type: "heading", attrs: { level: 1 }, content: [{ type: "text", text: "Welcome to Ajaia Docs 👋" }] },
          { type: "paragraph", content: [{ type: "text", text: "This is a lightweight collaborative document editor. You can:" }] },
          { type: "bulletList", content: [
            { type: "listItem", content: [{ type: "paragraph", content: [{ type: "text", text: "Create and edit rich text documents" }] }] },
            { type: "listItem", content: [{ type: "paragraph", content: [{ type: "text", text: "Share documents with team members" }] }] },
            { type: "listItem", content: [{ type: "paragraph", content: [{ type: "text", text: "Import .txt, .md, or .docx files" }] }] },
          ]},
          { type: "paragraph", content: [{ type: "text", text: "Try sharing this document with ", marks: [] }, { type: "text", text: "bob@ajaia.com", marks: [{ type: "bold" }] }, { type: "text", text: " using the Share button above." }] },
        ]
      }),
      ownerId: alice.id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    db.documents.push(doc);
    console.log("  ✓ Created sample document for alice");
  }

  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));

  console.log("\n✅ Seed complete!\n");
  console.log("Test accounts (all use password: password123):");
  console.log("  alice@ajaia.com");
  console.log("  bob@ajaia.com");
  console.log("  carol@ajaia.com");
}

main().catch(err => { console.error(err); process.exit(1); });

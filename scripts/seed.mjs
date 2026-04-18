#!/usr/bin/env node
// Run: node scripts/seed.js

import { createUser, findUserByEmail, createDocument, getDb } from "../src/lib/db.js";
import bcrypt from "bcryptjs";
import fs from "fs";
import path from "path";

async function seed() {
  console.log("🌱 Seeding database...");

  const users = [
    { email: "alice@ajaia.com", name: "Alice Chen", password: "password123" },
    { email: "bob@ajaia.com", name: "Bob Rivera", password: "password123" },
    { email: "carol@ajaia.com", name: "Carol Park", password: "password123" },
  ];

  const createdUsers = [];
  for (const u of users) {
    const existing = findUserByEmail(u.email);
    if (existing) {
      console.log(`  ✓ User already exists: ${u.email}`);
      createdUsers.push(existing);
    } else {
      const passwordHash = await bcrypt.hash(u.password, 10);
      const user = createUser({ email: u.email, name: u.name, passwordHash });
      createdUsers.push(user);
      console.log(`  ✓ Created user: ${u.email}`);
    }
  }

  console.log("\n✅ Seed complete.");
  console.log("\nTest accounts:");
  for (const u of users) {
    console.log(`  ${u.email} / ${u.password}`);
  }
}

seed().catch(console.error);

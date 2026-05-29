import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

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

// Initialize database tables (run once)
export async function initDatabase() {
  console.log('Note: Database tables should be created manually in Supabase dashboard');
  console.log('Run the following SQL in your Supabase SQL Editor:');

  const sql = `
    -- Create users table
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT NOW()
    );

    -- Create documents table
    CREATE TABLE IF NOT EXISTS documents (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      owner_id TEXT NOT NULL REFERENCES users(id),
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );

    -- Create shares table
    CREATE TABLE IF NOT EXISTS shares (
      id TEXT PRIMARY KEY,
      document_id TEXT NOT NULL REFERENCES documents(id),
      user_id TEXT NOT NULL REFERENCES users(id),
      permission TEXT NOT NULL CHECK (permission IN ('view', 'edit')),
      created_at TIMESTAMP DEFAULT NOW(),
      UNIQUE(document_id, user_id)
    );

    -- Enable Row Level Security (optional, for additional security)
    ALTER TABLE users ENABLE ROW LEVEL SECURITY;
    ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
    ALTER TABLE shares ENABLE ROW LEVEL SECURITY;
  `;

  console.log(sql);
  return sql;
}

// Users
export async function getUserByEmail(email: string): Promise<User | null> {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('email', email.toLowerCase())
    .single();

  if (error || !data) return null;
  return {
    id: data.id,
    email: data.email,
    name: data.name,
    passwordHash: data.password_hash,
    createdAt: data.created_at
  };
}

export async function getUserById(id: string): Promise<User | null> {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !data) return null;
  return {
    id: data.id,
    email: data.email,
    name: data.name,
    passwordHash: data.password_hash,
    createdAt: data.created_at
  };
}

export async function createUser(user: Omit<User, 'createdAt'>): Promise<User> {
  const { data, error } = await supabase
    .from('users')
    .insert([{
      id: user.id,
      email: user.email.toLowerCase(),
      name: user.name,
      password_hash: user.passwordHash,
      created_at: new Date().toISOString()
    }])
    .select()
    .single();

  if (error) throw error;
  return {
    id: data.id,
    email: data.email,
    name: data.name,
    passwordHash: data.password_hash,
    createdAt: data.created_at
  };
}

export async function searchUsers(query: string): Promise<User[]> {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .ilike('email', `%${query}%`)
    .limit(10);

  if (error) throw error;
  return data.map(user => ({
    id: user.id,
    email: user.email,
    name: user.name,
    passwordHash: user.password_hash,
    createdAt: user.created_at
  }));
}

// Documents
export async function getDocumentById(id: string): Promise<Document | null> {
  const { data, error } = await supabase
    .from('documents')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !data) return null;
  return {
    id: data.id,
    title: data.title,
    content: data.content,
    ownerId: data.owner_id,
    createdAt: data.created_at,
    updatedAt: data.updated_at
  };
}

export async function getDocumentsByOwner(ownerId: string): Promise<Document[]> {
  const { data, error } = await supabase
    .from('documents')
    .select('*')
    .eq('owner_id', ownerId)
    .order('updated_at', { ascending: false });

  if (error) throw error;
  return data.map(doc => ({
    id: doc.id,
    title: doc.title,
    content: doc.content,
    ownerId: doc.owner_id,
    createdAt: doc.created_at,
    updatedAt: doc.updated_at
  }));
}

export async function getSharedDocuments(userId: string): Promise<Document[]> {
  const { data, error } = await supabase
    .from('shares')
    .select(`
      documents (
        id,
        title,
        content,
        owner_id,
        created_at,
        updated_at
      )
    `)
    .eq('user_id', userId);

  if (error) throw error;
  return data
    .map((item: any) => item.documents)
    .filter(Boolean)
    .map((doc: any) => ({
      id: doc.id,
      title: doc.title,
      content: doc.content,
      ownerId: doc.owner_id,
      createdAt: doc.created_at,
      updatedAt: doc.updated_at
    }));
}

export async function createDocument(doc: Omit<Document, 'id' | 'createdAt' | 'updatedAt'>): Promise<Document> {
  const id = crypto.randomUUID();
  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from('documents')
    .insert([{
      id,
      title: doc.title,
      content: doc.content,
      owner_id: doc.ownerId,
      created_at: now,
      updated_at: now
    }])
    .select()
    .single();

  if (error) throw error;
  return {
    id: data.id,
    title: data.title,
    content: data.content,
    ownerId: data.owner_id,
    createdAt: data.created_at,
    updatedAt: data.updated_at
  };
}

export async function updateDocument(id: string, updates: Partial<Pick<Document, 'title' | 'content'>>): Promise<Document | null> {
  const updateData: any = { updated_at: new Date().toISOString() };
  if (updates.title) updateData.title = updates.title;
  if (updates.content) updateData.content = updates.content;

  const { data, error } = await supabase
    .from('documents')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error || !data) return null;
  return {
    id: data.id,
    title: data.title,
    content: data.content,
    ownerId: data.owner_id,
    createdAt: data.created_at,
    updatedAt: data.updated_at
  };
}

export async function deleteDocument(id: string): Promise<boolean> {
  // Delete shares first
  await supabase.from('shares').delete().eq('document_id', id);

  // Delete document
  const { error } = await supabase
    .from('documents')
    .delete()
    .eq('id', id);

  return !error;
}

// Shares
export async function getSharesByDocument(documentId: string): Promise<Share[]> {
  const { data, error } = await supabase
    .from('shares')
    .select(`
      id,
      document_id,
      user_id,
      permission,
      created_at,
      users (
        id,
        email,
        name
      )
    `)
    .eq('document_id', documentId);

  if (error) throw error;
  return data.map(share => ({
    id: share.id,
    documentId: share.document_id,
    userId: share.user_id,
    permission: share.permission,
    createdAt: share.created_at
  }));
}

export async function createShare(share: Omit<Share, 'id' | 'createdAt'>): Promise<Share> {
  const id = crypto.randomUUID();

  const { data, error } = await supabase
    .from('shares')
    .insert([{
      id,
      document_id: share.documentId,
      user_id: share.userId,
      permission: share.permission,
      created_at: new Date().toISOString()
    }])
    .select()
    .single();

  if (error) throw error;
  return {
    id: data.id,
    documentId: data.document_id,
    userId: data.user_id,
    permission: data.permission,
    createdAt: data.created_at
  };
}

export async function updateShare(documentId: string, userId: string, permission: "view" | "edit"): Promise<Share | null> {
  const { data, error } = await supabase
    .from('shares')
    .update({ permission })
    .eq('document_id', documentId)
    .eq('user_id', userId)
    .select()
    .single();

  if (error || !data) return null;
  return {
    id: data.id,
    documentId: data.document_id,
    userId: data.user_id,
    permission: data.permission,
    createdAt: data.created_at
  };
}

export async function deleteShare(documentId: string, userId: string): Promise<boolean> {
  const { error } = await supabase
    .from('shares')
    .delete()
    .eq('document_id', documentId)
    .eq('user_id', userId);

  return !error;
}

export async function getSharePermission(documentId: string, userId: string): Promise<"view" | "edit" | null> {
  const { data, error } = await supabase
    .from('shares')
    .select('permission')
    .eq('document_id', documentId)
    .eq('user_id', userId)
    .single();

  if (error || !data) return null;
  return data.permission;
}
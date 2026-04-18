import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/auth";
import {
  getDocumentById,
  updateDocument,
  deleteDocument,
  canUserAccess,
  getSharesForDocument,
  findUserById,
} from "@/lib/db";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const payload = getUserFromRequest(req);
  if (!payload) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const doc = getDocumentById(id);
  if (!doc) return NextResponse.json({ error: "Document not found" }, { status: 404 });

  const { access, permission } = canUserAccess(payload.userId, id);
  if (!access) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  // Attach share info if owner
  let shares = null;
  if (permission === "owner") {
    const rawShares = getSharesForDocument(id);
    shares = rawShares.map((s) => {
      const user = findUserById(s.userId);
      return { ...s, userName: user?.name, userEmail: user?.email };
    });
  }

  const owner = findUserById(doc.ownerId);

  return NextResponse.json({
    ...doc,
    permission,
    shares,
    ownerName: owner?.name,
  });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const payload = getUserFromRequest(req);
  if (!payload) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const doc = getDocumentById(id);
  if (!doc) return NextResponse.json({ error: "Document not found" }, { status: 404 });

  const { access, permission } = canUserAccess(payload.userId, id);
  if (!access || permission === "view") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { title, content } = await req.json();

  // Owners can update title; editors can only update content
  const updates: { title?: string; content?: string } = {};
  if (content !== undefined) updates.content = content;
  if (title !== undefined && permission === "owner") updates.title = title.trim();

  const updated = updateDocument(id, updates);
  return NextResponse.json(updated);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const payload = getUserFromRequest(req);
  if (!payload) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const doc = getDocumentById(id);
  if (!doc) return NextResponse.json({ error: "Document not found" }, { status: 404 });

  if (doc.ownerId !== payload.userId) {
    return NextResponse.json({ error: "Only the owner can delete a document" }, { status: 403 });
  }

  deleteDocument(id);
  return NextResponse.json({ success: true });
}

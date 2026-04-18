import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/auth";
import {
  getDocumentById,
  findUserByEmail,
  createShare,
  removeShare,
  getSharesForDocument,
  findUserById,
} from "@/lib/db";

// GET /api/documents/[id]/share — list shares (owner only)
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const payload = getUserFromRequest(req);
  if (!payload) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const doc = getDocumentById(id);
  if (!doc) return NextResponse.json({ error: "Document not found" }, { status: 404 });
  if (doc.ownerId !== payload.userId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const shares = getSharesForDocument(id).map((s) => {
    const user = findUserById(s.userId);
    return { ...s, userName: user?.name, userEmail: user?.email };
  });

  return NextResponse.json({ shares });
}

// POST /api/documents/[id]/share — share with a user
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const payload = getUserFromRequest(req);
  if (!payload) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const doc = getDocumentById(id);
  if (!doc) return NextResponse.json({ error: "Document not found" }, { status: 404 });
  if (doc.ownerId !== payload.userId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { email, permission = "edit" } = await req.json();

  if (!email) return NextResponse.json({ error: "Email is required" }, { status: 400 });
  if (!["view", "edit"].includes(permission)) {
    return NextResponse.json({ error: "Permission must be 'view' or 'edit'" }, { status: 400 });
  }

  const targetUser = findUserByEmail(email);
  if (!targetUser) {
    return NextResponse.json({ error: "User not found with that email" }, { status: 404 });
  }

  if (targetUser.id === payload.userId) {
    return NextResponse.json({ error: "Cannot share with yourself" }, { status: 400 });
  }

  const share = createShare({
    documentId: id,
    userId: targetUser.id,
    permission: permission as "view" | "edit",
  });

  return NextResponse.json({
    ...share,
    userName: targetUser.name,
    userEmail: targetUser.email,
  });
}

// DELETE /api/documents/[id]/share — revoke a user's access
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const payload = getUserFromRequest(req);
  if (!payload) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const doc = getDocumentById(id);
  if (!doc) return NextResponse.json({ error: "Document not found" }, { status: 404 });
  if (doc.ownerId !== payload.userId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { userId } = await req.json();
  if (!userId) return NextResponse.json({ error: "userId is required" }, { status: 400 });

  const removed = removeShare(id, userId);
  if (!removed) return NextResponse.json({ error: "Share not found" }, { status: 404 });

  return NextResponse.json({ success: true });
}

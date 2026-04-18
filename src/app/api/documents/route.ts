import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/auth";
import { getDocumentsForUser, createDocument, findUserById } from "@/lib/db";

export async function GET(req: NextRequest) {
  const payload = getUserFromRequest(req);
  if (!payload) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { owned, shared } = await getDocumentsForUser(payload.userId);

  // Attach owner info to shared docs
  const sharedWithOwner = await Promise.all(shared.map(async (doc: any) => {
    const owner = await findUserById(doc.ownerId);
    return { ...doc, ownerName: owner?.name ?? "Unknown" };
  }));

  return NextResponse.json({ owned, shared: sharedWithOwner });
}

export async function POST(req: NextRequest) {
  const payload = getUserFromRequest(req);
  if (!payload) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { title, content } = await req.json();

  if (!title?.trim()) {
    return NextResponse.json({ error: "Title is required" }, { status: 400 });
  }

  const doc = await createDocument({
    title: title.trim(),
    content: content ?? JSON.stringify({ type: "doc", content: [] }),
    ownerId: payload.userId,
  });

  return NextResponse.json(doc, { status: 201 });
}

import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/auth";
import { getDb } from "@/lib/db";

export async function GET(req: NextRequest) {
  const payload = getUserFromRequest(req);
  if (!payload) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.toLowerCase() ?? "";

  if (!q || q.length < 2) {
    return NextResponse.json({ users: [] });
  }

  const db = getDb();
  const users = db.users
    .filter(
      (u) =>
        u.id !== payload.userId &&
        (u.email.toLowerCase().includes(q) || u.name.toLowerCase().includes(q))
    )
    .slice(0, 5)
    .map((u) => ({ id: u.id, email: u.email, name: u.name }));

  return NextResponse.json({ users });
}

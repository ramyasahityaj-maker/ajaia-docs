import { NextRequest, NextResponse } from "next/server";
import { findUserByEmail, createUser } from "@/lib/db";
import { hashPassword, signToken } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const { email, password, name } = await req.json();

    if (!email || !password || !name) {
      return NextResponse.json({ error: "Name, email and password required" }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });
    }

    const existing = await findUserByEmail(email);
    if (existing) {
      return NextResponse.json({ error: "Email already in use" }, { status: 409 });
    }

    const passwordHash = await hashPassword(password);
    const user = await createUser({ email, name, passwordHash });
    const token = signToken({ userId: user.id, email: user.email, name: user.name });

    return NextResponse.json({
      token,
      user: { id: user.id, email: user.email, name: user.name },
    });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

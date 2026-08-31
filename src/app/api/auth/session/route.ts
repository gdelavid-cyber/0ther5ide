export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/store";
import { createSessionToken, getServerSession } from "@/lib/auth";
import { logger } from "@/lib/logger";

export async function GET() {
  try {
    const user = await getServerSession();
    return NextResponse.json({ user });
  } catch (err) {
    logger.error("Session fetch error", {}, err);
    return NextResponse.json({ user: null });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const email = body.email;
    const name = body.name || "Operator";
    const avatar = body.avatar;

    if (!email || typeof email !== "string" || !email.includes("@")) {
      return NextResponse.json({ error: "Valid email is required" }, { status: 400 });
    }

    const user = await db.upsertUser({
      email,
      name,
      avatar,
    });

    const token = await createSessionToken({ email: user.email, name: user.name });

    const response = NextResponse.json({ success: true, user });
    response.cookies.set("0ther5ide_session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
    });

    return response;
  } catch (err) {
    logger.error("Login error", {}, err);
    return NextResponse.json({ error: "Authentication failed" }, { status: 500 });
  }
}

export async function DELETE() {
  const response = NextResponse.json({ success: true });
  response.cookies.set("0ther5ide_session", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 0,
    path: "/",
  });
  return response;
}

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db/store";
import { createSessionToken, getServerSession } from "@/lib/auth";
import { logger } from "@/lib/logger";

const LoginSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1).default("Operator"),
  avatar: z.string().url().optional(),
});

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
    const body = await request.json();
    const parsed = LoginSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid payload", details: parsed.error.format() }, { status: 400 });
    }

    const user = await db.upsertUser({
      email: parsed.data.email,
      name: parsed.data.name,
      avatar: parsed.data.avatar,
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

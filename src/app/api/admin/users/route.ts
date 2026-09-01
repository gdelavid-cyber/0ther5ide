export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/store";

const ADMIN_PASSCODE = process.env.ADMIN_SECRET_KEY || "05-ADMIN-2026";

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get("x-admin-key") || req.nextUrl.searchParams.get("key");
    if (authHeader !== ADMIN_PASSCODE) {
      return NextResponse.json({ error: "Unauthorized: Invalid admin key" }, { status: 401 });
    }

    const users = await db.getAllUsers();
    const vipCount = users.filter((u) => u.planTier === "vip").length;
    const freeCount = users.filter((u) => u.planTier !== "vip").length;

    return NextResponse.json({
      success: true,
      stats: {
        totalUsers: users.length,
        vipSubscribers: vipCount,
        freeUsers: freeCount,
        mrrEstimate: vipCount * 100, // $25/wk ~= $100/mo
      },
      users,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Admin query failed" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { key, email, planTier, action } = body;

    if (key !== ADMIN_PASSCODE) {
      return NextResponse.json({ error: "Unauthorized: Invalid admin key" }, { status: 401 });
    }

    if (action === "sync" && Array.isArray(body.users)) {
      const synced = await db.bulkUpsertUsers(body.users);
      const allUsers = await db.getAllUsers();
      return NextResponse.json({
        success: true,
        message: `Synced ${synced.length} user records to persistent database`,
        users: allUsers,
      });
    }

    if (!email || !email.includes("@")) {
      return NextResponse.json({ error: "Valid email is required" }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();

    if (action === "delete") {
      await db.deleteUser(cleanEmail);
      return NextResponse.json({ success: true, message: `User ${cleanEmail} deleted` });
    }

    const updated = await db.upsertUser({
      email: cleanEmail,
      planTier: planTier === "vip" ? "vip" : "recon",
      name: cleanEmail.split("@")[0].toUpperCase(),
    });

    return NextResponse.json({
      success: true,
      user: updated,
      message: `User ${cleanEmail} updated to ${updated.planTier.toUpperCase()}`,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Admin action failed" }, { status: 500 });
  }
}

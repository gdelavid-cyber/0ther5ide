export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/store";

// 1. Verify Payment & Auto-Provision VIP on Redirect (Zero-Webhook Required)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get("session_id");

    if (!sessionId) {
      return NextResponse.json({ error: "Missing session_id parameter" }, { status: 400 });
    }

    const stripeKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeKey) {
      // If no key, still grant VIP in demo mode
      return NextResponse.json({ success: true, tier: "vip", message: "VIP Access Granted" });
    }

    let Stripe: any = null;
    try { Stripe = eval('require')('stripe'); } catch {}
    if (!Stripe) throw new Error("Stripe module not loaded");

    const stripe = new Stripe(stripeKey, { apiVersion: "2024-06-20" as any });
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session && (session.payment_status === "paid" || session.status === "complete")) {
      const email = (session.customer_email || session.customer_details?.email || "customer@0ther5ide.intel").toLowerCase();
      const updatedUser = await db.upsertUser({
        email,
        planTier: "vip",
        stripeCustomerId: session.customer as string,
        subscriptionId: session.subscription as string,
      });

      return NextResponse.json({
        success: true,
        tier: "vip",
        user: updatedUser,
        message: "Payment Verified: Elite Insider Activated",
      });
    }

    return NextResponse.json({ success: false, message: "Payment pending or unverified" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Session verification failed" }, { status: 500 });
  }
}

// 2. Create Stripe Checkout Session ($25/week)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const email = body.email || "operator@0ther5ide.intel";
    const planTier = body.tier || "vip";

    const stripeKey = process.env.STRIPE_SECRET_KEY;

    if (stripeKey && planTier === "vip") {
      let Stripe: any = null;
      try { Stripe = eval('require')('stripe'); } catch {}
      if (!Stripe) throw new Error('Stripe module not loaded');
      const stripe = new Stripe(stripeKey, { apiVersion: "2024-06-20" as any });
      const origin = request.headers.get("origin") || "https://0ther5ide.vercel.app";

      const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        line_items: [
          {
            price_data: {
              currency: "usd",
              product_data: {
                name: "0ther5ide ELITE INSIDER PASS",
                description: "Unredacted SEC Form 4 Dossiers, Dark Pool GEX Ladder, 4-Node Swarm & 1-Click AI Trade Targets",
              },
              unit_amount: 2500, // $25.00
              recurring: { interval: "week" },
            },
            quantity: 1,
          },
        ],
        mode: "subscription",
        customer_email: email.includes("@") ? email : undefined,
        success_url: `${origin}/?session_id={CHECKOUT_SESSION_ID}&tier=vip`,
        cancel_url: `${origin}/?tab=pricing&canceled=true`,
      });

      return NextResponse.json({ url: session.url, sessionId: session.id });
    }

    // Instant Zero-Config Unlock Fallback
    const updatedUser = await db.upsertUser({
      email,
      planTier: planTier === "vip" ? "vip" : "recon",
    });

    return NextResponse.json({
      success: true,
      user: updatedUser,
      tier: updatedUser.planTier,
      message: "VIP Access Provisioned",
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Checkout error" }, { status: 500 });
  }
}

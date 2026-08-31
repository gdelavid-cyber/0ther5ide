export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/store";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const email = body.email || "operator@0ther5ide.intel";
    const planTier = body.tier || "vip";

    const stripeKey = process.env.STRIPE_SECRET_KEY;

    if (stripeKey && planTier === "vip") {
      // Production Stripe Integration
      const Stripe = (await import("stripe")).default;
      const stripe = new Stripe(stripeKey, { apiVersion: "2024-06-20" as any });
      const origin = request.headers.get("origin") || "http://localhost:3000";

      const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        line_items: [
          {
            price_data: {
              currency: "usd",
              product_data: {
                name: "0ther5ide VIP INSIDER ACCESS",
                description: "Unlimited SEC Form 4 Dossier Decryptions, Institutional Order Flow & Tactical Agent",
              },
              unit_amount: 2500, // $25.00
              recurring: { interval: "week" },
            },
            quantity: 1,
          },
        ],
        mode: "subscription",
        customer_email: email,
        success_url: `${origin}?session_id={CHECKOUT_SESSION_ID}&tier=vip`,
        cancel_url: `${origin}?canceled=true`,
      });

      return NextResponse.json({ url: session.url, sessionId: session.id });
    }

    // Instant Demo / Zero-Config Unlock Fallback
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

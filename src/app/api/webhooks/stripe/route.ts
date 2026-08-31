export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/store";

export async function POST(request: NextRequest) {
  const stripeKey = process.env.STRIPE_SECRET_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!stripeKey || !webhookSecret) {
    return NextResponse.json({ received: true, note: "Stripe webhook secret not configured" });
  }

  try {
    const body = await request.text();
    const signature = request.headers.get("stripe-signature") || "";

    const Stripe = (await import("stripe" as any)).default;
    const stripe = new Stripe(stripeKey, { apiVersion: "2024-06-20" as any });
    const event = stripe.webhooks.constructEvent(body, signature, webhookSecret);

    if (event.type === "checkout.session.completed") {
      const session = event.data.object as any;
      const email = session.customer_email || session.customer_details?.email;
      if (email) {
        await db.upsertUser({
          email,
          planTier: "vip",
          stripeCustomerId: session.customer,
          subscriptionId: session.subscription,
        });
      }
    } else if (event.type === "customer.subscription.deleted") {
      const subscription = event.data.object as any;
      // Revert user to recon on cancellation
      const email = subscription.customer_email;
      if (email) {
        await db.upsertUser({ email, planTier: "recon" });
      }
    }

    return NextResponse.json({ received: true });
  } catch (err: any) {
    return NextResponse.json({ error: `Webhook error: ${err.message}` }, { status: 400 });
  }
}

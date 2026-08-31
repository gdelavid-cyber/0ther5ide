export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/store";
import { logger } from "@/lib/logger";

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const sig = req.headers.get("stripe-signature");
    const stripeKey = process.env.STRIPE_SECRET_KEY;
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!stripeKey) {
      return NextResponse.json({ error: "Stripe key not configured" }, { status: 400 });
    }

    let Stripe: any = null;
    try { Stripe = eval('require')('stripe'); } catch {}
    if (!Stripe) throw new Error("Stripe package not loaded");

    const stripe = new Stripe(stripeKey, { apiVersion: "2024-06-20" as any });
    let event: any;

    if (webhookSecret && sig) {
      try {
        event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
      } catch (err: any) {
        logger.warn("Stripe webhook signature failed", {}, err);
        return NextResponse.json({ error: "Invalid webhook signature" }, { status: 400 });
      }
    } else {
      event = JSON.parse(rawBody);
    }

    // Handle Completed Checkout Sessions
    if (event.type === "checkout.session.completed") {
      const session = event.data?.object;
      const email = session?.customer_email || session?.customer_details?.email;
      const stripeCustomerId = session?.customer as string;
      const subscriptionId = session?.subscription as string;

      if (email) {
        await db.upsertUser({
          email: email.toLowerCase(),
          planTier: "vip",
          stripeCustomerId,
          subscriptionId,
        });
        logger.info("Stripe Webhook: Provisioned VIP Tier", { email, subscriptionId });
      }
    }

    // Handle Subscription Cancellations
    if (event.type === "customer.subscription.deleted") {
      const subscription = event.data?.object;
      const customerId = subscription?.customer;
      const users = await db.getAllUsers();
      const user = users.find((u) => u.stripeCustomerId === customerId);

      if (user) {
        await db.upsertUser({
          email: user.email,
          planTier: "recon",
        });
        logger.info("Stripe Webhook: Reverted to Recon Tier on cancel", { email: user.email });
      }
    }

    return NextResponse.json({ received: true });
  } catch (err: any) {
    logger.error("Stripe Webhook processing error", {}, err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

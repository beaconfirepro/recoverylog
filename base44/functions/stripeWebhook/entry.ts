import Stripe from "npm:stripe@17.3.0";
import { secrets } from "base44:runtime";

// Stripe webhook. Verifies the signature, then records a completed checkout.
// A webhook endpoint is unauthenticated by nature, so the signature is the only
// thing that stops a forged request — it is checked before anything else.

export default async function(req: Request): Promise<Response> {
  try {
    const body = await req.text();
    const signature = req.headers.get("stripe-signature");
    if (!signature) {
      return Response.json({ error: "Missing signature" }, { status: 400 });
    }
    const secret = secrets.get("STRIPE_WEBHOOK_SECRET");
    const stripe = new Stripe(secrets.get("STRIPE_SECRET_KEY"));

    let event;
    try {
      event = await stripe.webhooks.constructEventAsync(body, signature, secret);
    } catch (err) {
      console.error("Webhook signature verification failed:", err?.message);
      return Response.json({ error: "Invalid signature" }, { status: 400 });
    }

    if (event.type === "checkout.session.completed") {
      const session = event.data.object;
      // Logged for the dashboard; the base44_app_id metadata ties the charge to
      // this app for transaction tracking.
      console.log("Checkout completed", {
        id: session.id,
        mode: session.mode,
        amount_total: session.amount_total,
        currency: session.currency,
        app_id: session.metadata?.base44_app_id
      });
    }

    return Response.json({ received: true });
  } catch (error) {
    console.error("stripeWebhook error:", error?.message);
    return Response.json({ error: error?.message || "Webhook failed." }, { status: 500 });
  }
}
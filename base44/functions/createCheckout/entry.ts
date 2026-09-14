import { secrets } from "base44:runtime";

// Pay-what-you-want checkout for personalized health monitoring. The patient
// picks an amount and one-time or monthly; this builds a Stripe Checkout
// session with an inline price (the amount is chosen per checkout, so a fixed
// Price would not work) and hands the URL back for the browser to redirect to.
//
// No Base44 auth: checkout is a donation/subscription to the app's Stripe
// account, and the patient may not be signed in. Stripe Checkout itself is the
// secure step, so creating the session grants nothing on its own.

const PRODUCT_ID = "prod_VFti2G4rU6id5P";
const MIN_CENTS = 100; // $1.00 floor — anything below and Stripe rejects the session

export default async function(req: Request): Promise<Response> {
  try {
    const body = await req.json().catch(() => ({}));
    const amountCents = Number(body?.amountCents);
    const cadence = body?.cadence;
    const successUrl = body?.successUrl;
    const cancelUrl = body?.cancelUrl;

    if (!Number.isInteger(amountCents) || amountCents < MIN_CENTS) {
      return Response.json({ error: "Choose an amount of at least $1.00." }, { status: 400 });
    }
    if (amountCents > 1_000_000_00) {
      return Response.json({ error: "That amount is too large for one payment." }, { status: 400 });
    }
    if (cadence !== "one_time" && cadence !== "month") {
      return Response.json({ error: "Choose one-time or monthly." }, { status: 400 });
    }
    if (typeof successUrl !== "string" || typeof cancelUrl !== "string" || !successUrl || !cancelUrl) {
      return Response.json({ error: "Missing redirect URLs." }, { status: 400 });
    }

    const key = secrets.get("STRIPE_SECRET_KEY");
    const appId = secrets.get("BASE44_APP_ID");
    const recurring = cadence === "month";

    const params = new URLSearchParams();
    params.append("mode", recurring ? "subscription" : "payment");
    params.append("success_url", successUrl);
    params.append("cancel_url", cancelUrl);
    params.append("submit_type", "donate");
    params.append("line_items[0][quantity]", "1");
    params.append("line_items[0][price_data][currency]", "usd");
    params.append("line_items[0][price_data][unit_amount]", String(amountCents));
    params.append("line_items[0][price_data][product]", PRODUCT_ID);
    if (recurring) {
      params.append("line_items[0][price_data][recurring][interval]", "month");
      params.append("subscription_data[metadata][base44_app_id]", appId || "");
    }
    params.append("metadata[base44_app_id]", appId || "");

    const res = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Stripe-Version": "2025-10-29.clover",
        "Idempotency-Key": crypto.randomUUID()
      },
      body: params
    });
    const data = await res.json();
    if (!res.ok) {
      console.error("Stripe checkout error:", data?.error?.message);
      return Response.json({ error: data?.error?.message || "Stripe could not start checkout." }, { status: 502 });
    }
    return Response.json({ url: data.url });
  } catch (error) {
    console.error("createCheckout error:", error?.message);
    return Response.json({ error: error?.message || "Could not start checkout." }, { status: 500 });
  }
}
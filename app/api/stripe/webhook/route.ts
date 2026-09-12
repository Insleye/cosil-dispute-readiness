import { createHmac, timingSafeEqual } from "node:crypto";
import { recordVerifiedReadinessPayment } from "@/lib/readiness-access";

export const runtime = "nodejs";

function verifyStripeSignature(payload: string, header: string, secret: string) {
  const parts = header.split(",");
  const timestamp = parts.find((part) => part.startsWith("t="))?.slice(2);
  const signatures = parts.filter((part) => part.startsWith("v1=")).map((part) => part.slice(3));
  if (!timestamp || signatures.length === 0) return false;

  const age = Math.abs(Date.now() / 1000 - Number(timestamp));
  if (!Number.isFinite(age) || age > 300) return false;

  const expected = createHmac("sha256", secret)
    .update(`${timestamp}.${payload}`)
    .digest("hex");

  return signatures.some((signature) => {
    try {
      const a = Buffer.from(expected, "hex");
      const b = Buffer.from(signature, "hex");
      return a.length === b.length && timingSafeEqual(a, b);
    } catch {
      return false;
    }
  });
}

async function sessionContainsReadinessPrice(sessionId: string, priceId: string, secretKey: string) {
  const response = await fetch(
    `https://api.stripe.com/v1/checkout/sessions/${encodeURIComponent(sessionId)}/line_items?limit=100`,
    { headers: { Authorization: `Bearer ${secretKey}` }, cache: "no-store" }
  );
  if (!response.ok) return false;
  const body = await response.json() as { data?: Array<{ price?: { id?: string } }> };
  return body.data?.some((item) => item.price?.id === priceId) ?? false;
}

export async function POST(request: Request) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  const secretKey = process.env.STRIPE_SECRET_KEY;
  const readinessPriceId = process.env.STRIPE_READINESS_PRICE_ID;
  if (!webhookSecret || !secretKey || !readinessPriceId) {
    return new Response("Stripe is not configured", { status: 503 });
  }

  const payload = await request.text();
  const signature = request.headers.get("stripe-signature");
  if (!signature || !verifyStripeSignature(payload, signature, webhookSecret)) {
    return new Response("Invalid signature", { status: 400 });
  }

  const event = JSON.parse(payload) as {
    type?: string;
    data?: { object?: { id?: string; payment_status?: string; mode?: string } };
  };

  if (event.type !== "checkout.session.completed") {
    return Response.json({ received: true });
  }

  const session = event.data?.object;
  if (!session?.id || session.mode !== "payment" || session.payment_status !== "paid") {
    return Response.json({ received: true });
  }

  const matches = await sessionContainsReadinessPrice(session.id, readinessPriceId, secretKey);
  if (!matches) {
    return new Response("Checkout did not contain the configured readiness price", { status: 400 });
  }

  await recordVerifiedReadinessPayment({
    sessionId: session.id,
    priceId: readinessPriceId,
  });

  return Response.json({ received: true });
}

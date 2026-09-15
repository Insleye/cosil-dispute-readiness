import "server-only";

type StripeCheckoutSession = {
  id: string;
  payment_status?: string;
  mode?: string;
};

type StripeLineItems = {
  data?: Array<{ price?: { id?: string } }>;
};

function stripeHeaders(secretKey: string) {
  return { Authorization: `Bearer ${secretKey}` };
}

async function retrieveCheckoutSession(sessionId: string, secretKey: string) {
  const response = await fetch(
    `https://api.stripe.com/v1/checkout/sessions/${encodeURIComponent(sessionId)}`,
    { headers: stripeHeaders(secretKey), cache: "no-store" }
  );
  if (!response.ok) return null;
  return (await response.json()) as StripeCheckoutSession;
}

export async function checkoutSessionContainsPrice(
  sessionId: string,
  priceId: string,
  secretKey: string
) {
  const response = await fetch(
    `https://api.stripe.com/v1/checkout/sessions/${encodeURIComponent(sessionId)}/line_items?limit=100`,
    { headers: stripeHeaders(secretKey), cache: "no-store" }
  );
  if (!response.ok) return false;
  const body = (await response.json()) as StripeLineItems;
  // Matching on price ID (not amount) is what allows legitimate discounted
  // purchases (e.g. a LAUNCH50 coupon) to pass: the price on the line item
  // stays the configured readiness price even when a coupon has reduced
  // the amount charged.
  return body.data?.some((item) => item.price?.id === priceId) ?? false;
}

export type ReadinessCheckoutVerification =
  | { verified: true }
  | {
      verified: false;
      reason: "not_configured" | "not_found" | "not_paid" | "wrong_price";
    };

/**
 * Verifies a Checkout Session directly against the Stripe API. This is the
 * fallback used when no verified webhook record exists yet for a session,
 * so a purchaser is never left waiting solely on the webhook to arrive.
 *
 * Fails closed: any ambiguity (session missing, not yet paid, or paid for
 * something other than the configured readiness price) results in
 * `verified: false`. Access is never granted on the strength of an
 * arbitrary paid session.
 */
export async function verifyPaidReadinessCheckoutSession(
  sessionId: string
): Promise<ReadinessCheckoutVerification> {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  const readinessPriceId = process.env.STRIPE_READINESS_PRICE_ID;

  // Deliberately independent of STRIPE_WEBHOOK_SECRET: this path never
  // verifies a webhook signature, so a missing webhook secret must not
  // block the direct fallback from working.
  if (!(secretKey && readinessPriceId)) {
    return { verified: false, reason: "not_configured" };
  }

  const session = await retrieveCheckoutSession(sessionId, secretKey);
  if (!session) {
    return { verified: false, reason: "not_found" };
  }

  if (session.payment_status !== "paid") {
    return { verified: false, reason: "not_paid" };
  }

  const matches = await checkoutSessionContainsPrice(sessionId, readinessPriceId, secretKey);
  if (!matches) {
    return { verified: false, reason: "wrong_price" };
  }

  return { verified: true };
}

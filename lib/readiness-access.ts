import "server-only";

import { createHash, randomBytes } from "node:crypto";
import postgres from "postgres";
import { verifyPaidReadinessCheckoutSession } from "@/lib/stripe";

export const READINESS_ACCESS_COOKIE = "cosil_readiness_access";
const ACCESS_DAYS = 7;

function db() {
  if (!process.env.POSTGRES_URL) {
    throw new Error("POSTGRES_URL is not configured");
  }
  return postgres(process.env.POSTGRES_URL, { max: 1 });
}

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

async function upsertVerifiedPayment(
  sql: postgres.Sql,
  { sessionId, priceId }: { sessionId: string; priceId: string }
) {
  await sql`
    INSERT INTO "ReadinessPaymentAccess"
      ("sessionId", "priceId", "paymentStatus", "verifiedAt")
    VALUES
      (${sessionId}, ${priceId}, 'paid', NOW())
    ON CONFLICT ("sessionId") DO UPDATE SET
      "priceId" = EXCLUDED."priceId",
      "paymentStatus" = 'paid',
      "verifiedAt" = NOW()
  `;
}

export async function recordVerifiedReadinessPayment({
  sessionId,
  priceId,
}: {
  sessionId: string;
  priceId: string;
}) {
  const sql = db();
  try {
    await upsertVerifiedPayment(sql, { sessionId, priceId });
  } finally {
    await sql.end();
  }
}

export async function hasValidReadinessAccess(token?: string | null) {
  if (!token) return false;
  const sql = db();
  try {
    const rows = await sql`
      SELECT "sessionId"
      FROM "ReadinessPaymentAccess"
      WHERE "accessTokenHash" = ${hashToken(token)}
        AND "paymentStatus" = 'paid'
        AND "expiresAt" IS NOT NULL
        AND "expiresAt" > NOW()
      LIMIT 1
    `;
    return rows.length > 0;
  } finally {
    await sql.end();
  }
}

export async function activateReadinessPayment(sessionId: string):
  Promise<
    | { status: "ready"; token: string; maxAge: number }
    | { status: "pending" }
    | { status: "used" }
    | { status: "invalid" }
  > {
  const sql = db();
  try {
    let existing = await sql`
      SELECT "paymentStatus", "accessTokenHash"
      FROM "ReadinessPaymentAccess"
      WHERE "sessionId" = ${sessionId}
      LIMIT 1
    `;

    if (existing.length === 0 || existing[0].paymentStatus !== "paid") {
      // No verified webhook record yet. Rather than leave the purchaser
      // waiting solely on the webhook, verify the Checkout Session
      // directly against Stripe here. This also recovers sessions whose
      // webhook was missed or delayed entirely.
      const verification = await verifyPaidReadinessCheckoutSession(sessionId);

      if (!verification.verified) {
        // A session that is not yet paid, or whose configuration we can't
        // check right now, may still resolve shortly: report "pending" so
        // the purchaser is invited to wait, not turned away. A session
        // that Stripe doesn't recognise, or that was paid for something
        // other than the configured readiness price, never gets access.
        if (verification.reason === "not_paid" || verification.reason === "not_configured") {
          return { status: "pending" };
        }
        return { status: "invalid" };
      }

      const readinessPriceId = process.env.STRIPE_READINESS_PRICE_ID as string;
      await upsertVerifiedPayment(sql, { sessionId, priceId: readinessPriceId });

      existing = await sql`
        SELECT "paymentStatus", "accessTokenHash"
        FROM "ReadinessPaymentAccess"
        WHERE "sessionId" = ${sessionId}
        LIMIT 1
      `;
    }

    if (existing[0].accessTokenHash) {
      return { status: "used" };
    }

    const token = randomBytes(32).toString("hex");
    const tokenHash = hashToken(token);
    const maxAge = ACCESS_DAYS * 24 * 60 * 60;

    // The WHERE clause makes this update atomic: if two requests for the
    // same session race (e.g. the webhook and this direct fallback landing
    // together), only one can claim an empty accessTokenHash.
    const updated = await sql`
      UPDATE "ReadinessPaymentAccess"
      SET
        "accessTokenHash" = ${tokenHash},
        "activatedAt" = NOW(),
        "expiresAt" = NOW() + INTERVAL '7 days'
      WHERE "sessionId" = ${sessionId}
        AND "paymentStatus" = 'paid'
        AND "accessTokenHash" IS NULL
      RETURNING "sessionId"
    `;

    if (updated.length === 0) {
      return { status: "used" };
    }

    return { status: "ready", token, maxAge };
  } finally {
    await sql.end();
  }
}

import "server-only";

import { createHash, randomBytes } from "node:crypto";
import postgres from "postgres";

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

export async function recordVerifiedReadinessPayment({
  sessionId,
  priceId,
}: {
  sessionId: string;
  priceId: string;
}) {
  const sql = db();
  try {
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
  > {
  const sql = db();
  try {
    const existing = await sql`
      SELECT "paymentStatus", "accessTokenHash"
      FROM "ReadinessPaymentAccess"
      WHERE "sessionId" = ${sessionId}
      LIMIT 1
    `;

    if (existing.length === 0 || existing[0].paymentStatus !== "paid") {
      return { status: "pending" };
    }

    if (existing[0].accessTokenHash) {
      return { status: "used" };
    }

    const token = randomBytes(32).toString("hex");
    const tokenHash = hashToken(token);
    const maxAge = ACCESS_DAYS * 24 * 60 * 60;

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

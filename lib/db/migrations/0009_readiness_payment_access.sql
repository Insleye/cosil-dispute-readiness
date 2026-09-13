CREATE TABLE IF NOT EXISTS "ReadinessPaymentAccess" (
  "sessionId" varchar(255) PRIMARY KEY NOT NULL,
  "priceId" varchar(255) NOT NULL,
  "paymentStatus" varchar(32) NOT NULL,
  "verifiedAt" timestamp NOT NULL,
  "accessTokenHash" varchar(64),
  "activatedAt" timestamp,
  "expiresAt" timestamp
);

CREATE UNIQUE INDEX IF NOT EXISTS "ReadinessPaymentAccess_token_idx"
ON "ReadinessPaymentAccess" ("accessTokenHash")
WHERE "accessTokenHash" IS NOT NULL;
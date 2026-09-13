CREATE TABLE IF NOT EXISTS "MembershipWaitlist" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "name" varchar(160) NOT NULL,
  "email" varchar(254) NOT NULL,
  "phone" varchar(40) NOT NULL,
  "consentedAt" timestamp NOT NULL,
  "createdAt" timestamp NOT NULL,
  "source" varchar(80) NOT NULL DEFAULT 'dispute-readiness-guide'
);

CREATE UNIQUE INDEX IF NOT EXISTS "MembershipWaitlist_email_idx"
ON "MembershipWaitlist" (LOWER("email"));
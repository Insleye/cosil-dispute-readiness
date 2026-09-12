import "server-only";

import postgres from "postgres";

export type WaitlistSubmission = {
  name: string;
  email: string;
  phone: string;
};

function db() {
  if (!process.env.POSTGRES_URL) throw new Error("POSTGRES_URL is not configured");
  return postgres(process.env.POSTGRES_URL, { max: 1 });
}

export async function saveWaitlistSubmission(input: WaitlistSubmission) {
  const sql = db();
  try {
    const rows = await sql`
      INSERT INTO "MembershipWaitlist"
        ("name", "email", "phone", "consentedAt", "createdAt", "source")
      VALUES
        (${input.name}, ${input.email.toLowerCase()}, ${input.phone}, NOW(), NOW(), 'dispute-readiness-guide')
      ON CONFLICT ((LOWER("email"))) DO UPDATE SET
        "name" = EXCLUDED."name",
        "phone" = EXCLUDED."phone",
        "consentedAt" = NOW()
      RETURNING "id"
    `;
    return rows[0]?.id as string | undefined;
  } finally {
    await sql.end();
  }
}

async function getGraphAppToken() {
  const tenantId = process.env.MS_GRAPH_TENANT_ID;
  const clientId = process.env.MS_GRAPH_CLIENT_ID;
  const clientSecret = process.env.MS_GRAPH_CLIENT_SECRET;
  if (!tenantId || !clientId || !clientSecret) return null;

  const body = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    scope: "https://graph.microsoft.com/.default",
    grant_type: "client_credentials",
  });

  const response = await fetch(
    `https://login.microsoftonline.com/${encodeURIComponent(tenantId)}/oauth2/v2.0/token`,
    { method: "POST", headers: { "content-type": "application/x-www-form-urlencoded" }, body, cache: "no-store" }
  );
  if (!response.ok) throw new Error("Could not obtain Microsoft Graph token");
  const data = await response.json() as { access_token?: string };
  return data.access_token ?? null;
}

export async function sendWaitlistNotification(input: WaitlistSubmission) {
  const token = await getGraphAppToken();
  const sender = process.env.MS_GRAPH_MAIL_SENDER;
  const recipient = process.env.MEMBERSHIP_WAITLIST_NOTIFY_EMAIL || "admin@cosilsolutions.co.uk";
  if (!token || !sender) return { configured: false as const };

  const response = await fetch(
    `https://graph.microsoft.com/v1.0/users/${encodeURIComponent(sender)}/sendMail`,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "content-type": "application/json" },
      body: JSON.stringify({
        message: {
          subject: "New Cosil Membership waitlist signup",
          body: {
            contentType: "Text",
            content: `A new person has joined the Cosil Membership waitlist.\n\nName: ${input.name}\nEmail: ${input.email}\nPhone: ${input.phone}\n\nSource: Dispute Readiness Guide`,
          },
          toRecipients: [{ emailAddress: { address: recipient } }],
        },
        saveToSentItems: true,
      }),
      cache: "no-store",
    }
  );
  if (!response.ok) throw new Error("Microsoft Graph email notification failed");
  return { configured: true as const };
}

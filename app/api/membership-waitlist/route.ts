import { NextResponse } from "next/server";
import { z } from "zod";
import { saveWaitlistSubmission, sendWaitlistNotification } from "@/lib/membership-waitlist";

const schema = z.object({
  name: z.string().trim().min(2).max(160),
  email: z.string().trim().email().max(254),
  phone: z.string().trim().min(6).max(40),
  consent: z.literal(true),
});

export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Please check the information entered." }, { status: 400 });
  }

  const { name, email, phone } = parsed.data;
  await saveWaitlistSubmission({ name, email, phone });

  try {
    await sendWaitlistNotification({ name, email, phone });
  } catch (error) {
    console.error("Waitlist notification failed", error);
  }

  return NextResponse.json({ ok: true });
}

import { NextResponse } from "next/server";
import { saveWaitlistSubmission, sendWaitlistNotification } from "@/lib/membership-waitlist";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const name = String(body.name || "").trim();
    const email = String(body.email || "").trim();
    const phone = String(body.phone || "").trim();
    const consent = body.consent === true;

    if (!name || !email || !consent) {
      return NextResponse.json(
        { error: "Please provide your name and email and confirm consent." },
        { status: 400 }
      );
    }

    const submission = { name, email, phone };
    await saveWaitlistSubmission(submission);

    // Registration is complete once the database save succeeds.
    // Email is attempted afterwards, but a mail issue must not undo registration.
    try {
      const mail = await sendWaitlistNotification(submission);
      if (!mail.configured) {
        console.error("Membership waitlist email is not configured: check MS_GRAPH_* and sender environment variables.");
      } else {
        console.info("Membership waitlist notification and customer confirmation email processed.");
      }
    } catch (error) {
      console.error("Membership waitlist email delivery failed", error);
    }

    return NextResponse.json({
      ok: true,
      message: "You're on the Cosil Membership waitlist.",
    });
  } catch (error) {
    console.error("Membership waitlist submission failed", error);
    return NextResponse.json(
      { error: "We could not add you to the waitlist. Please try again." },
      { status: 500 }
    );
  }
}

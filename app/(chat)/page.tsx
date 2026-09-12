import { cookies } from "next/headers";
import { Button } from "@/components/ui/button";
import { ReadinessAssessment } from "@/components/readiness-assessment";
import {
  hasValidReadinessAccess,
  READINESS_ACCESS_COOKIE,
} from "@/lib/readiness-access";
import { complexityFlags, dimensions, questions } from "@/lib/readiness-content";

const LIVE_PAYMENT_LINK = "https://buy.stripe.com/fZucN6e1z2Kc0spdyo5gc00";

export default async function Page() {
  const cookieStore = await cookies();
  const token = cookieStore.get(READINESS_ACCESS_COOKIE)?.value;
  const hasAccess = token ? await hasValidReadinessAccess(token) : false;

  if (hasAccess) {
    return (
      <ReadinessAssessment
        dimensions={dimensions}
        questions={questions}
        complexityFlags={complexityFlags}
      />
    );
  }

  const isProduction = process.env.VERCEL_ENV === "production";
  const paymentLink = isProduction
    ? (process.env.STRIPE_LIVE_PAYMENT_LINK_URL || LIVE_PAYMENT_LINK)
    : process.env.STRIPE_TEST_PAYMENT_LINK_URL;

  return (
    <main className="mx-auto max-w-3xl px-4 py-12 sm:py-16">
      <div className="rounded-2xl border bg-background p-6 shadow-sm sm:p-10">
        <p className="mb-3 text-sm font-medium text-zinc-500">Cosil Solutions Ltd</p>
        <h1 className="text-3xl font-semibold tracking-tight">
          Enhanced Dispute Readiness Check
        </h1>
        <p className="mt-4 text-zinc-600">
          Understand how prepared you currently are to deal with a dispute across six areas of readiness.
        </p>
        <div className="mt-6 rounded-xl border bg-zinc-50 p-4 text-sm text-zinc-600 dark:bg-zinc-900">
          One-off access: <strong>£24.99</strong>. The check is diagnostic and reflective. It does not provide legal advice or tell you what action to take.
        </div>

        {paymentLink ? (
          <Button asChild className="mt-8">
            <a href={paymentLink}>Buy access — £24.99</a>
          </Button>
        ) : (
          <div className="mt-8 rounded-xl border p-4 text-sm text-zinc-600">
            Test payment is not configured for this preview yet. Add a Stripe test Payment Link to enable checkout.
          </div>
        )}

        <p className="mt-6 text-xs text-zinc-400">
          Assessment access is granted only after Stripe confirms a completed payment.
        </p>
      </div>
    </main>
  );
}

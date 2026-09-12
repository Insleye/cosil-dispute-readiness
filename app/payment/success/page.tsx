import { PaymentConfirmation } from "@/components/payment-confirmation";

export default async function PaymentSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string }>;
}) {
  const { session_id: sessionId } = await searchParams;

  if (!sessionId) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-16">
        <div className="rounded-2xl border bg-background p-8 shadow-sm">
          <h1 className="text-2xl font-semibold">Payment confirmation</h1>
          <p className="mt-4 text-zinc-600">
            We could not identify the Stripe checkout session. No assessment access has been granted.
          </p>
        </div>
      </main>
    );
  }

  return <PaymentConfirmation sessionId={sessionId} />;
}

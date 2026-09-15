"use client";

import { useEffect, useState } from "react";

export function PaymentConfirmation({ sessionId }: { sessionId: string }) {
  const [message, setMessage] = useState("Confirming your payment with Stripe…");

  useEffect(() => {
    let cancelled = false;
    let attempts = 0;

    async function check() {
      attempts += 1;
      const response = await fetch(`/api/readiness/activate?session_id=${encodeURIComponent(sessionId)}`, {
        cache: "no-store",
        headers: { Accept: "application/json" },
      });
      const data = await response.json().catch(() => ({}));

      if (cancelled) return;
      if (response.ok && data.status === "ready") {
        window.location.replace("/");
        return;
      }
      if (response.status === 409) {
        setMessage("This payment link has already been activated. Please return using the browser that completed the purchase.");
        return;
      }
      if (response.status === 400 && data.status === "invalid") {
        setMessage("We could not match this payment to a Dispute Readiness Guide purchase. Please contact us with your payment receipt and we will sort out access directly.");
        return;
      }
      if (attempts >= 20) {
        setMessage("Payment was received, but confirmation is still processing. Please refresh this page in a few moments.");
        return;
      }
      setTimeout(check, 1000);
    }

    check();
    return () => { cancelled = true; };
  }, [sessionId]);

  return (
    <main className="mx-auto max-w-2xl px-4 py-16">
      <div className="rounded-2xl border bg-background p-8 shadow-sm">
        <p className="text-sm font-medium text-zinc-500">Cosil Solutions Ltd</p>
        <h1 className="mt-2 text-2xl font-semibold">Payment confirmation</h1>
        <p className="mt-4 text-zinc-600">{message}</p>
        <p className="mt-6 text-xs text-zinc-400">
          Access is released once Stripe confirms your payment as complete.
        </p>
      </div>
    </main>
  );
}

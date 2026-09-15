"use client";

import { FormEvent, useRef, useState } from "react";
import { Button } from "@/components/ui/button";

export function MembershipWaitlistForm() {
  const [status, setStatus] = useState<"idle"|"sending"|"success"|"error">("idle");
  const [error, setError] = useState("");
  const formRef = useRef<HTMLFormElement>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("sending");
    setError("");
    const form = new FormData(event.currentTarget);
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 45000);

    try {
      const response = await fetch("/api/membership-waitlist", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name: form.get("name"),
          email: form.get("email"),
          phone: form.get("phone"),
          consent: form.get("consent") === "on",
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        setError(body.error || "We could not add you to the waitlist. Please try again.");
        setStatus("error");
        return;
      }
      formRef.current?.reset();
      setStatus("success");
    } catch {
      setError("Your submission is taking longer than expected to confirm. Please check your email before submitting again. If no confirmation arrives, please try again.");
      setStatus("error");
    } finally {
      window.clearTimeout(timeout);
    }
  }

  if (status === "success") {
    return (
      <div className="rounded-xl border bg-zinc-50 p-5 text-zinc-700 dark:bg-zinc-900 dark:text-zinc-200">
        <p className="font-semibold">You're on the Cosil Membership waitlist.</p>
        <p className="mt-2 text-sm leading-6">
          Thank you. Your registration has been received and we'll contact you when Membership is ready to launch. A confirmation email will also be sent to the email address you provided.
        </p>
      </div>
    );
  }

  return (
    <form ref={formRef} onSubmit={submit} className="grid gap-5">
      <label className="grid gap-2 text-sm font-medium">
        Name
        <input name="name" required minLength={2} maxLength={160} className="rounded-lg border bg-background px-3 py-3 font-normal" autoComplete="name" />
      </label>
      <label className="grid gap-2 text-sm font-medium">
        Email
        <input name="email" required type="email" maxLength={254} className="rounded-lg border bg-background px-3 py-3 font-normal" autoComplete="email" />
      </label>
      <label className="grid gap-2 text-sm font-medium">
        Phone
        <input name="phone" required type="tel" maxLength={40} className="rounded-lg border bg-background px-3 py-3 font-normal" autoComplete="tel" />
      </label>
      <label className="flex items-start gap-3 text-sm text-zinc-600">
        <input name="consent" type="checkbox" required className="mt-1" />
        <span>
          By submitting this form, you agree to be contacted by Cosil Solutions about the membership launch. See our{" "}
          <a className="underline underline-offset-4" href="https://cosilsolutions.co.uk/privacy-policy/" target="_blank" rel="noreferrer">Privacy Policy</a> for more.
        </span>
      </label>
      {status === "error" ? <p className="text-sm text-red-600">{error}</p> : null}
      <Button disabled={status === "sending"} type="submit">
        {status === "sending" ? "Adding you…" : "Join the waitlist"}
      </Button>
    </form>
  );
}

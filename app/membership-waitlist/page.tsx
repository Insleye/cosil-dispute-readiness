import { Button } from "@/components/ui/button";
import { MembershipWaitlistForm } from "@/components/membership-waitlist-form";

export default function MembershipWaitlistPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-12 sm:py-16">
      <div className="rounded-2xl border bg-background p-6 shadow-sm sm:p-10">
        <p className="text-sm font-medium text-zinc-500">Cosil Solutions Ltd</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">Cosil Membership — coming soon</h1>
        <p className="mt-4 leading-7 text-zinc-600">
          Join Cosil Dispute Watch on WhatsApp for updates, and add your name to the waitlist to be first in when membership launches.
        </p>
        <Button asChild variant="outline" className="mt-6">
          <a href="https://whatsapp.com/channel/0029VbDYUmFJf05lwkozbZ01" target="_blank" rel="noreferrer">Join Cosil Dispute Watch</a>
        </Button>
        <div className="my-8 border-t" />
        <h2 className="text-xl font-semibold">Join the membership waitlist</h2>
        <p className="mt-2 mb-6 text-sm text-zinc-600">Leave your details and we will contact you when membership opens.</p>
        <MembershipWaitlistForm />
      </div>
    </main>
  );
}

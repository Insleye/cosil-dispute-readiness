import { Button } from "@/components/ui/button";
import { MembershipWaitlistForm } from "@/components/membership-waitlist-form";

export default function MembershipWaitlistPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-12 sm:py-16">
      <div className="rounded-2xl border bg-background p-6 shadow-sm sm:p-10">
        <p className="text-sm font-medium text-zinc-500">Cosil Solutions Ltd</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">
          Cosil Membership — coming soon
        </h1>
        <p className="mt-4 text-xl font-semibold">£39/month</p>
        <p className="mt-4 leading-7 text-zinc-600">
          For people who want ongoing dispute-readiness support without moving
          straight into bespoke consultancy. Membership is designed to help you
          stay informed, organised and better prepared as issues develop.
        </p>

        <div className="mt-6 rounded-xl border bg-zinc-50 p-5 text-sm leading-6 text-zinc-700 dark:bg-zinc-900">
          <p className="font-semibold">Membership will include:</p>
          <ul className="mt-3 space-y-2">
            <li>• A 60-minute live monthly Dispute Clinic</li>
            <li>• A written Clinic Summary with general learning points</li>
            <li>• A Monthly Dispute Update</li>
            <li>• Member discounts on eligible Cosil services</li>
            <li>• Access to the member WhatsApp Community with numbers protected</li>
          </ul>
          <p className="mt-4 text-xs text-zinc-500">
            Clinics are not recorded and do not provide individual legal advice.
          </p>
        </div>

        <Button asChild variant="outline" className="mt-6">
          <a
            href="https://whatsapp.com/channel/0029VbDYUmFJf05lwkozbZ01"
            target="_blank"
            rel="noreferrer"
          >
            Follow Cosil Dispute Watch
          </a>
        </Button>

        <div className="my-8 border-t" />
        <h2 className="text-xl font-semibold">Join the membership waitlist</h2>
        <p className="mt-2 mb-6 text-sm text-zinc-600">
          Leave your details and we will contact you when membership opens.
        </p>
        <MembershipWaitlistForm />
      </div>
    </main>
  );
}

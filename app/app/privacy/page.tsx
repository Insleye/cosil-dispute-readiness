export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="mb-6 text-3xl font-semibold">Privacy Notice</h1>

      <p className="mb-4 text-sm text-zinc-600">
        Last updated: {new Date().toLocaleDateString("en-GB")}
      </p>

      <section className="space-y-6 text-base text-zinc-800">
        <p>
          This Privacy Notice explains how information is handled when you use
          the Dispute Readiness Check and related tools provided by Cosil
          Solutions Ltd.
        </p>

        <h2 className="text-xl font-semibold">1. Who we are</h2>
        <p>
          Cosil Solutions Ltd is a UK-based strategic dispute consultancy and
          civil and commercial mediation practice.
        </p>

        <h2 className="text-xl font-semibold">2. What information is collected</h2>
        <p>
          This tool may collect information that you choose to enter, such as:
        </p>
        <ul className="list-disc pl-6">
          <li>Your role (for example, tenant, leaseholder, landlord)</li>
          <li>General information about a dispute or complaint</li>
          <li>Uploaded files, if you choose to upload them</li>
        </ul>

        <p>
          You should not include sensitive personal data unless it is necessary
          and you are comfortable doing so.
        </p>

        <h2 className="text-xl font-semibold">3. How the information is used</h2>
        <p>
          Information is used solely to:
        </p>
        <ul className="list-disc pl-6">
          <li>Provide general strategic guidance</li>
          <li>Help structure dispute-related information</li>
          <li>Improve how the tool functions and responds</li>
        </ul>

        <p>
          This tool does not provide legal advice and does not replace
          professional advice.
        </p>

        <h2 className="text-xl font-semibold">4. Data storage</h2>
        <p>
          Messages and uploaded content may be stored securely to allow the tool
          to function correctly. Access is restricted and data is not sold or
          shared for marketing purposes.
        </p>

        <h2 className="text-xl font-semibold">5. File uploads</h2>
        <p>
          If you upload documents or images, they are used only in connection
          with your session. Avoid uploading documents containing highly
          sensitive personal data unless strictly necessary.
        </p>

        <h2 className="text-xl font-semibold">6. Your rights</h2>
        <p>
          You have rights under UK data protection law, including the right to
          request access to or deletion of your personal data, subject to legal
          and operational limits.
        </p>

        <h2 className="text-xl font-semibold">7. Contact</h2>
        <p>
          If you have questions about this Privacy Notice or how information is
          handled, you can contact Cosil Solutions Ltd directly.
        </p>

        <p className="mt-8 text-sm text-zinc-600">
          Note: This tool provides general strategic guidance only and does not
          constitute legal advice.
        </p>
      </section>
    </main>
  );
}

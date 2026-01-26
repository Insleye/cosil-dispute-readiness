export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="mb-2 text-3xl font-semibold">Privacy Notice</h1>
      <p className="mb-8 text-sm text-zinc-600">
        Cosil Solutions Ltd, Dispute Readiness Check
      </p>

      <section className="space-y-6 text-zinc-800">
        <p>
          This Privacy Notice explains how information is handled when you use
          the Cosil Solutions Ltd Dispute Readiness Check and related chat
          features.
        </p>

        <h2 className="text-xl font-semibold">Who we are</h2>
        <p>
          Cosil Solutions Ltd is a UK-based strategic dispute consultancy and
          civil and commercial mediation practice. This tool is designed to help
          users organise issues, reduce escalation, and choose practical next
          steps with clarity.
        </p>

        <h2 className="text-xl font-semibold">What we collect</h2>
        <p>We collect only what you choose to provide, which may include:</p>
        <ul className="list-disc pl-6">
          <li>Your role selection, for example tenant, leaseholder, landlord</li>
          <li>Your complaint stage selection</li>
          <li>Messages you type into the chat</li>
          <li>Files you upload, if you choose to upload them</li>
        </ul>
        <p>
          Please avoid sharing unnecessary personal data. Do not include special
          category data unless it is genuinely needed and you are comfortable
          providing it.
        </p>

        <h2 className="text-xl font-semibold">How we use your information</h2>
        <p>We use the information you provide to:</p>
        <ul className="list-disc pl-6">
          <li>Provide structured, practical guidance based on what you share</li>
          <li>Ask relevant triage questions to reduce generic responses</li>
          <li>Support basic app functions, including chat continuity</li>
        </ul>

        <h2 className="text-xl font-semibold">What we do not do</h2>
        <ul className="list-disc pl-6">
          <li>We do not sell your data</li>
          <li>We do not use your data for advertising</li>
          <li>We do not publish your messages or files</li>
        </ul>

        <h2 className="text-xl font-semibold">Storage and access</h2>
        <p>
          Messages and uploaded files may be stored securely so the tool can
          operate properly. Access is restricted. We keep information only for
          as long as it is needed for operational, security, or legal purposes.
        </p>

        <h2 className="text-xl font-semibold">File uploads</h2>
        <p>
          If you upload files, they are handled only to support your request.
          Do not upload documents containing highly sensitive information unless
          it is essential.
        </p>

        <h2 className="text-xl font-semibold">Your rights</h2>
        <p>
          You have rights under UK data protection law, including the right to
          request access to, correction of, or deletion of your personal data,
          subject to legal and operational limits.
        </p>

        <h2 className="text-xl font-semibold">Contact</h2>
        <p>
          If you have questions about this Privacy Notice or how this tool
          handles information, contact Cosil Solutions Ltd:
        </p>
        <ul className="list-disc pl-6">
          <li>Email: admin@cosilsolution.co.uk</li>
          <li>Phone: 0207 458 4707 or 07587 065511</li>
        </ul>

        <p className="pt-6 text-sm text-zinc-600">
          Note: This tool provides general strategic guidance. It does not
          provide legal advice.
        </p>
      </section>
    </main>
  );
}

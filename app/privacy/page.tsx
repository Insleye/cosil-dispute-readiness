export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16">
      <h1 className="mb-8 text-3xl font-semibold">Privacy Policy</h1>

      <section className="mb-8">
        <h2 className="mb-4 text-xl font-semibold">Introduction</h2>
        <p className="mb-4 text-zinc-600 dark:text-zinc-400">
          Cosil Solutions Ltd (&quot;we&quot;, &quot;us&quot;, or &quot;our&quot;) is committed to protecting your privacy. 
          This Privacy Policy explains how we collect, use, and safeguard your information when you use 
          our Dispute Readiness Check tool.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="mb-4 text-xl font-semibold">Information We Collect</h2>
        <p className="mb-4 text-zinc-600 dark:text-zinc-400">
          When you use our service, we may collect:
        </p>
        <ul className="mb-4 list-disc pl-6 text-zinc-600 dark:text-zinc-400">
          <li className="mb-2">Information you provide during conversations (role type, complaint stage, dispute details)</li>
          <li className="mb-2">Technical data such as browser type and device information</li>
          <li className="mb-2">Usage data to help us improve our service</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="mb-4 text-xl font-semibold">How We Use Your Information</h2>
        <p className="mb-4 text-zinc-600 dark:text-zinc-400">
          We use the information we collect to:
        </p>
        <ul className="mb-4 list-disc pl-6 text-zinc-600 dark:text-zinc-400">
          <li className="mb-2">Provide you with relevant dispute guidance</li>
          <li className="mb-2">Improve and develop our services</li>
          <li className="mb-2">Respond to your enquiries</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="mb-4 text-xl font-semibold">Data Security</h2>
        <p className="mb-4 text-zinc-600 dark:text-zinc-400">
          We implement appropriate technical and organisational measures to protect your personal data 
          against unauthorised access, alteration, disclosure, or destruction.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="mb-4 text-xl font-semibold">Your Rights</h2>
        <p className="mb-4 text-zinc-600 dark:text-zinc-400">
          Under UK data protection law, you have rights including the right to access, correct, or delete 
          your personal data. To exercise these rights, please contact us.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="mb-4 text-xl font-semibold">Contact Us</h2>
        <p className="mb-4 text-zinc-600 dark:text-zinc-400">
          If you have any questions about this Privacy Policy, please contact Cosil Solutions Ltd:
        </p>
        <ul className="mb-4 list-none text-zinc-600 dark:text-zinc-400">
          <li className="mb-2">
            Email:{" "}
            <a className="underline" href="mailto:admin@cosilsolution.co.uk">
              admin@cosilsolution.co.uk
            </a>
          </li>
          <li className="mb-2">
            Phone:{" "}
            <a className="underline" href="tel:07587065611">
              07587 065 611
            </a>
          </li>
        </ul>
      </section>

      <p className="text-sm text-zinc-400">
        Last updated: January 2026
      </p>
    </div>
  );
}

import { createFileRoute } from "@tanstack/react-router";
import { SiteLayout } from "@/components/site/SiteLayout";
import { PageHero, Section } from "@/components/site/sections";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy — UIG" },
      {
        name: "description",
        content: "How Unified Innovations Group collects, uses and protects your data.",
      },
      { name: "robots", content: "index, follow" },
    ],
  }),
  component: PrivacyPage,
});

const LAST_UPDATED = "July 2026";

function PrivacyPage() {
  return (
    <SiteLayout>
      <PageHero
        eyebrow="Legal"
        title="Privacy Policy"
        subtitle={`Last updated: ${LAST_UPDATED}`}
      />
      <Section>
        <div className="mx-auto max-w-3xl space-y-10 text-muted-foreground leading-relaxed">
          <div>
            <h2 className="text-xl font-semibold text-foreground">1. Who we are</h2>
            <p className="mt-3">
              Unified Innovations Group ("UIG", "we", "us") operates across Technology, AgriTech,
              Real Estate, Logistics, Intelligence and Innovation Lab divisions, including the Apex
              Portal and our public websites. This policy explains what personal data we collect,
              why we collect it, and the choices you have.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-foreground">2. What we collect</h2>
            <p className="mt-3">
              Depending on how you interact with UIG, we may collect: account information (name,
              email, phone, role), portal activity (division access, actions you take inside Apex),
              content you submit (property listings, shipment details, farm and field data,
              prototypes, models and datasets), messages you send us (contact forms, access
              requests, support), and technical data (IP address, device and browser information,
              cookies).
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-foreground">3. How we use your data</h2>
            <p className="mt-3">
              We use your data to provide and operate the Apex Portal and our division products,
              authenticate and authorize access, communicate with you about your account or
              requests, improve our products, detect and prevent abuse or fraud, and comply with
              legal obligations. We do not sell personal data to third parties.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-foreground">4. Legal basis and consent</h2>
            <p className="mt-3">
              Where required by law, we process your data on the basis of your consent, the
              necessity of processing to perform a contract with you (e.g. operating your portal
              account), our legitimate interests in running and securing our services, or
              compliance with a legal obligation.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-foreground">5. Sharing</h2>
            <p className="mt-3">
              We share data with service providers who help us operate our infrastructure (hosting,
              database, authentication, email delivery, AI inference), only to the extent needed to
              provide those services, and under contractual confidentiality obligations. We may also
              disclose data if required by law or to protect the rights, safety or property of UIG
              or others.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-foreground">6. Data retention</h2>
            <p className="mt-3">
              We retain personal data for as long as your account is active or as needed to provide
              our services, resolve disputes, and comply with legal obligations. You may request
              deletion of your account and associated data at any time, subject to legal or
              contractual retention requirements.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-foreground">7. Your rights</h2>
            <p className="mt-3">
              Depending on your jurisdiction, you may have the right to access, correct, export or
              delete your personal data, and to object to or restrict certain processing. To
              exercise these rights, contact us using the details below.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-foreground">8. Security</h2>
            <p className="mt-3">
              We use industry-standard safeguards — encryption in transit, access controls and
              row-level security on our data platform, and least-privilege administrative access —
              to protect your data. No system is completely secure, and we encourage you to use a
              strong, unique password for your portal account.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-foreground">9. Cookies</h2>
            <p className="mt-3">
              We use essential cookies to keep you signed in and remember your preferences. See our{" "}
              <a href="/cookies" className="text-gold hover:underline">
                Cookie Policy
              </a>{" "}
              for details.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-foreground">10. Changes to this policy</h2>
            <p className="mt-3">
              We may update this policy from time to time. Material changes will be reflected by
              updating the "Last updated" date above.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-foreground">11. Contact</h2>
            <p className="mt-3">
              Questions about this policy or your data can be sent to us via our{" "}
              <a href="/contact" className="text-gold hover:underline">
                contact page
              </a>
              .
            </p>
          </div>
        </div>
      </Section>
    </SiteLayout>
  );
}

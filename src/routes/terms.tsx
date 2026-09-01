import { createFileRoute } from "@tanstack/react-router";
import { SiteLayout } from "@/components/site/SiteLayout";
import { PageHero, Section } from "@/components/site/sections";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Terms of Service — UIG" },
      {
        name: "description",
        content:
          "The terms that govern your use of Unified Innovations Group products and the Apex Portal.",
      },
      { name: "robots", content: "index, follow" },
    ],
  }),
  component: TermsPage,
});

const LAST_UPDATED = "July 2026";

function TermsPage() {
  return (
    <SiteLayout>
      <PageHero
        eyebrow="Legal"
        title="Terms of Service"
        subtitle={`Last updated: ${LAST_UPDATED}`}
      />
      <Section>
        <div className="mx-auto max-w-3xl space-y-10 text-muted-foreground leading-relaxed">
          <div>
            <h2 className="text-xl font-semibold text-foreground">1. Acceptance of terms</h2>
            <p className="mt-3">
              By accessing or using any UIG website, the Apex Portal, or any product operated by a
              UIG division (Technology, AgriTech, Real Estate, Logistics, Intelligence, Innovation
              Lab), you agree to be bound by these Terms of Service. If you don't agree, don't use
              our services.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-foreground">2. Accounts</h2>
            <p className="mt-3">
              Apex Portal access is granted per account and tied to your assigned role and division
              access. You're responsible for keeping your credentials confidential and for all
              activity under your account. Notify us immediately if you suspect unauthorized access.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-foreground">3. Acceptable use</h2>
            <p className="mt-3">
              You agree not to misuse our services — including attempting to access data or
              divisions you're not authorized for, interfering with the operation of the platform,
              uploading unlawful or infringing content, or using the platform to harass or defraud
              others.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-foreground">4. Content you submit</h2>
            <p className="mt-3">
              You retain ownership of content you submit through the portal (property listings,
              shipment records, farm data, prototypes, models, and similar). You grant UIG a license
              to host, process and display that content as necessary to operate the relevant
              division's product for you.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-foreground">5. AI features</h2>
            <p className="mt-3">
              Some UIG products use AI models to generate suggestions, summaries, checklists or
              insights (for example, the Intelligence division's assistant and Innovation Lab's MVP
              checklist generator). These outputs are provided for informational purposes and may be
              inaccurate or incomplete — you're responsible for reviewing and validating any
              AI-generated content before relying on it.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-foreground">6. Intellectual property</h2>
            <p className="mt-3">
              The UIG name, logo, and platform software are the property of Unified Innovations
              Group and may not be copied, reproduced or used without permission, except as
              necessary to use our services as intended.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-foreground">7. Disclaimers</h2>
            <p className="mt-3">
              Our services are provided "as is" without warranties of any kind, express or implied.
              We do not guarantee that the platform will be uninterrupted, error-free, or fully
              secure.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-foreground">8. Limitation of liability</h2>
            <p className="mt-3">
              To the maximum extent permitted by law, UIG will not be liable for indirect,
              incidental, or consequential damages arising from your use of our services.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-foreground">9. Termination</h2>
            <p className="mt-3">
              We may suspend or terminate your access if you violate these terms or misuse the
              platform. You may stop using our services and request account deletion at any time.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-foreground">10. Governing law</h2>
            <p className="mt-3">
              These terms are governed by the laws of the Federal Republic of Nigeria, without
              regard to conflict-of-law principles.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-foreground">11. Contact</h2>
            <p className="mt-3">
              Questions about these terms can be sent via our{" "}
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

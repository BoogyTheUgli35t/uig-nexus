import type { ReactNode } from "react";
import { Header } from "./Header";
import { Footer } from "./Footer";
import { CookieBanner } from "./CookieBanner";
import { WhatsAppFab } from "./WhatsAppFab";
import { JsonLd } from "./JsonLd";
import { ORGANIZATION_JSON_LD } from "@/lib/seo";

export function SiteLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <JsonLd data={ORGANIZATION_JSON_LD} />
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
      <WhatsAppFab />
      <CookieBanner />
    </div>
  );
}

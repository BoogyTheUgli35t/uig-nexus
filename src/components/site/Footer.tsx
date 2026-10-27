import { Link } from "@tanstack/react-router";
import { Logo } from "./Logo";
import { FLAGS } from "@/lib/flags";
import { CONTACT_EMAIL, HQ, SOCIAL_LINKS } from "@/lib/seo";

export function Footer() {
  return (
    <footer className="mt-32 border-t border-border bg-surface/40">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 grid gap-10 md:grid-cols-6">
        <div className="md:col-span-2">
          <Logo />
          <p className="mt-4 text-sm text-muted-foreground max-w-md">
            Unified Innovations Group — Nigeria's leading multi-sector innovation conglomerate. Two
            Steps Ahead.
          </p>
          <p className="mt-4 text-xs text-muted-foreground">
            HQ: {HQ.locality}, {HQ.countryName}
            <br />
            Operations: Nigeria-wide · Pan-African · Global
          </p>
        </div>
        <div>
          <h4 className="text-sm font-semibold text-foreground">Divisions</h4>
          <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
            <li>
              <Link to="/divisions" className="hover:text-gold transition">
                All six divisions
              </Link>
            </li>
            <li>
              <Link to="/divisions/technology" className="hover:text-gold transition">
                Technology
              </Link>
            </li>
            <li>
              <Link to="/divisions/agritech" className="hover:text-gold transition">
                AgriTech
              </Link>
            </li>
            <li>
              <Link to="/divisions/real-estate" className="hover:text-gold transition">
                Real Estate
              </Link>
            </li>
            <li>
              <Link to="/divisions/logistics" className="hover:text-gold transition">
                Logistics
              </Link>
            </li>
            <li>
              <Link to="/divisions/intelligence" className="hover:text-gold transition">
                Intelligence
              </Link>
            </li>
            <li>
              <Link to="/divisions/innovation-lab" className="hover:text-gold transition">
                Innovation Lab
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <h4 className="text-sm font-semibold text-foreground">Company</h4>
          <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
            <li>
              <Link to="/about" className="hover:text-gold transition">
                About
              </Link>
            </li>
            <li>
              <Link to="/services" className="hover:text-gold transition">
                Services
              </Link>
            </li>
            <li>
              <Link to="/careers" className="hover:text-gold transition">
                Careers
              </Link>
            </li>
            <li>
              <Link to="/insights" className="hover:text-gold transition">
                News & Insights
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <h4 className="text-sm font-semibold text-foreground">Contact</h4>
          <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
            <li>
              <Link to="/contact" className="hover:text-gold transition">
                Get in touch
              </Link>
            </li>
            <li>
              <a href={`mailto:${CONTACT_EMAIL}`} className="hover:text-gold transition break-all">
                {CONTACT_EMAIL}
              </a>
            </li>
            <li>
              <Link to="/portal" className="hover:text-gold transition">
                Apex Portal
              </Link>
            </li>
            <li>
              <Link to="/track" className="hover:text-gold transition">
                Track a shipment
              </Link>
            </li>
            {FLAGS.statusPage && (
              <li>
                <Link to="/status" className="hover:text-gold transition">
                  System status
                </Link>
              </li>
            )}
          </ul>
        </div>
        <div>
          <h4 className="text-sm font-semibold text-foreground">Legal</h4>
          <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
            <li>
              <Link to="/privacy" className="hover:text-gold transition">
                Privacy Policy
              </Link>
            </li>
            <li>
              <Link to="/terms" className="hover:text-gold transition">
                Terms of Service
              </Link>
            </li>
            <li>
              <Link to="/cookies" className="hover:text-gold transition">
                Cookie Policy
              </Link>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-border">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
          <p>© {new Date().getFullYear()} Unified Innovations Group. All rights reserved.</p>
          {/* Rendered from SOCIAL_LINKS in lib/seo.ts. An entry with no URL
              shows muted and non-clickable, because these were three
              `href="#"` links that jumped to the top of whatever page you were
              on — a dead link reads as a broken site, an unlinked label reads
              as an account that isn't live yet. */}
          {SOCIAL_LINKS.length > 0 && (
            <div className="flex gap-4">
              {SOCIAL_LINKS.map((s) =>
                s.href ? (
                  <a
                    key={s.label}
                    href={s.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="transition hover:text-gold"
                    aria-label={s.label}
                  >
                    {s.label}
                  </a>
                ) : (
                  <span
                    key={s.label}
                    className="cursor-default text-muted-foreground/50"
                    title={`${s.label} — coming soon`}
                  >
                    {s.label}
                  </span>
                ),
              )}
            </div>
          )}
        </div>
      </div>
    </footer>
  );
}

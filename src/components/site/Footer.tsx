import { Link } from "@tanstack/react-router";
import { Logo } from "./Logo";

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
            HQ: Victoria Island, Lagos, Nigeria
            <br />
            Operations: Nigeria-wide · Pan-African · Global
          </p>
        </div>
        <div>
          <h4 className="text-sm font-semibold text-foreground">Divisions</h4>
          <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
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
              <a
                href="mailto:hello@unifiedinnovationsgroup.online"
                className="hover:text-gold transition break-all"
              >
                hello@unifiedinnovationsgroup.online
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
          <div className="flex gap-4">
            <a href="#" className="hover:text-gold transition" aria-label="LinkedIn">
              LinkedIn
            </a>
            <a href="#" className="hover:text-gold transition" aria-label="Twitter / X">
              Twitter
            </a>
            <a href="#" className="hover:text-gold transition" aria-label="Instagram">
              Instagram
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}

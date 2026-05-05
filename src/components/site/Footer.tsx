import { Link } from "@tanstack/react-router";
import { Logo } from "./Logo";

export function Footer() {
  return (
    <footer className="mt-32 border-t border-border bg-surface/40">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 grid gap-10 md:grid-cols-4">
        <div className="md:col-span-2">
          <Logo />
          <p className="mt-4 text-sm text-muted-foreground max-w-md">
            Unified Innovations Group — a multi-division, AI-first group building
            the next generation of infrastructure for Africa and the world.
          </p>
        </div>
        <div>
          <h4 className="text-sm font-semibold text-foreground">Divisions</h4>
          <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
            <li><Link to="/divisions/technology" className="hover:text-gold transition">Technology</Link></li>
            <li><Link to="/divisions/agritech" className="hover:text-gold transition">AgriTech</Link></li>
            <li><Link to="/divisions/real-estate" className="hover:text-gold transition">Real Estate</Link></li>
            <li><Link to="/divisions/logistics" className="hover:text-gold transition">Logistics</Link></li>
            <li><Link to="/divisions/intelligence" className="hover:text-gold transition">Intelligence</Link></li>
            <li><Link to="/divisions/innovation-lab" className="hover:text-gold transition">Innovation Lab</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="text-sm font-semibold text-foreground">Company</h4>
          <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
            <li><Link to="/about" className="hover:text-gold transition">About</Link></li>
            <li><Link to="/services" className="hover:text-gold transition">Services</Link></li>
            <li><Link to="/contact" className="hover:text-gold transition">Contact</Link></li>
            <li><Link to="/portal" className="hover:text-gold transition">Apex Portal</Link></li>
            <li><a href="mailto:hello@uig.africa" className="hover:text-gold transition">hello@uig.africa</a></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-border">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
          <p>© {new Date().getFullYear()} Unified Innovations Group. All rights reserved.</p>
          <div className="flex gap-4">
            <a href="#" className="hover:text-gold transition">Twitter</a>
            <a href="#" className="hover:text-gold transition">LinkedIn</a>
            <a href="#" className="hover:text-gold transition">Instagram</a>
          </div>
        </div>
      </div>
    </footer>
  );
}

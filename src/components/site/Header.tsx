import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { Menu, X, ChevronDown } from "lucide-react";
import { Logo } from "./Logo";
import { Button } from "@/components/ui/button";

const divisions = [
  { to: "/divisions/technology", label: "UIG Technology" },
  { to: "/divisions/agritech", label: "UIG AgriTech" },
  { to: "/divisions/real-estate", label: "UIG Real Estate" },
  { to: "/divisions/logistics", label: "UIG Logistics" },
  { to: "/divisions/intelligence", label: "UIG Intelligence" },
  { to: "/divisions/innovation-lab", label: "UIG Innovation Lab" },
] as const;

export function Header() {
  const [open, setOpen] = useState(false);
  const [divOpen, setDivOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-border/60 backdrop-blur-xl bg-background/70">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <Logo />
        <nav className="hidden lg:flex items-center gap-8 text-sm">
          <Link to="/" className="text-muted-foreground hover:text-foreground transition" activeProps={{ className: "text-foreground" }} activeOptions={{ exact: true }}>Home</Link>
          <Link to="/about" className="text-muted-foreground hover:text-foreground transition" activeProps={{ className: "text-foreground" }}>About</Link>
          <div
            className="relative"
            onMouseEnter={() => setDivOpen(true)}
            onMouseLeave={() => setDivOpen(false)}
          >
            <Link to="/divisions" className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground transition" activeProps={{ className: "text-foreground" }}>
              Divisions <ChevronDown className="h-3.5 w-3.5" />
            </Link>
            {divOpen && (
              <div className="absolute left-0 top-full pt-3 w-64">
                <div className="rounded-xl border border-border bg-surface shadow-elevated p-2">
                  {divisions.map((d) => (
                    <Link
                      key={d.to}
                      to={d.to}
                      className="block px-3 py-2 rounded-md text-sm text-muted-foreground hover:bg-surface-elevated hover:text-foreground transition"
                    >
                      {d.label}
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
          <Link to="/services" className="text-muted-foreground hover:text-foreground transition" activeProps={{ className: "text-foreground" }}>Services</Link>
          <Link to="/portal" className="text-muted-foreground hover:text-foreground transition" activeProps={{ className: "text-foreground" }}>Portal</Link>
          <Link to="/contact" className="text-muted-foreground hover:text-foreground transition" activeProps={{ className: "text-foreground" }}>Contact</Link>
        </nav>
        <div className="hidden lg:flex items-center gap-2">
          <Button asChild variant="ghost" size="sm">
            <Link to="/portal/login">Sign in</Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link to="/portal/signup">Sign up</Link>
          </Button>
          <Button asChild size="sm" className="bg-gold text-gold-foreground hover:bg-gold/90">
            <Link to="/contact">Partner with UIG</Link>
          </Button>
        </div>
        <button
          className="lg:hidden p-2 -mr-2"
          onClick={() => setOpen(!open)}
          aria-label="Menu"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>
      {open && (
        <div className="lg:hidden border-t border-border bg-surface">
          <div className="px-4 py-4 space-y-1 text-sm">
            {[
              { to: "/", label: "Home" },
              { to: "/about", label: "About" },
              { to: "/divisions", label: "Divisions" },
              { to: "/services", label: "Services" },
              { to: "/portal", label: "Portal" },
              { to: "/contact", label: "Contact" },
            ].map((l) => (
              <Link
                key={l.to}
                to={l.to}
                className="block px-3 py-2 rounded-md hover:bg-surface-elevated"
                onClick={() => setOpen(false)}
              >
                {l.label}
              </Link>
            ))}
            <div className="pt-3 flex gap-2">
              <Button asChild variant="outline" size="sm" className="flex-1">
                <Link to="/portal/login" onClick={() => setOpen(false)}>Sign in</Link>
              </Button>
              <Button asChild size="sm" className="flex-1 bg-gold text-gold-foreground hover:bg-gold/90">
                <Link to="/contact" onClick={() => setOpen(false)}>Partner</Link>
              </Button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

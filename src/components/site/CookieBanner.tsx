import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";

const STORAGE_KEY = "uig-cookie-consent";

type Consent = "accepted" | "essential-only";

export function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const existing = window.localStorage.getItem(STORAGE_KEY);
    if (!existing) setVisible(true);
  }, []);

  function choose(consent: Consent) {
    window.localStorage.setItem(STORAGE_KEY, consent);
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-background/95 backdrop-blur px-4 py-4 sm:px-6">
      <div className="mx-auto flex max-w-6xl flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          We use essential cookies to run this site and portal, and optional cookies to understand
          usage. See our{" "}
          <Link to="/cookies" className="text-gold hover:underline">
            Cookie Policy
          </Link>
          .
        </p>
        <div className="flex shrink-0 gap-2">
          <Button variant="outline" size="sm" onClick={() => choose("essential-only")}>
            Essential only
          </Button>
          <Button
            size="sm"
            className="bg-gold text-gold-foreground hover:bg-gold/90"
            onClick={() => choose("accepted")}
          >
            Accept all
          </Button>
        </div>
      </div>
    </div>
  );
}

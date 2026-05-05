import { Link } from "@tanstack/react-router";

export function Logo({ className = "" }: { className?: string }) {
  return (
    <Link to="/" className={`inline-flex items-center gap-2 ${className}`}>
      <div className="relative h-8 w-8 rounded-md gradient-gold flex items-center justify-center font-display font-bold text-gold-foreground text-sm shadow-gold">
        U
      </div>
      <span className="font-display font-bold text-lg tracking-tight">
        UIG
        <span className="text-gold">.</span>
      </span>
    </Link>
  );
}

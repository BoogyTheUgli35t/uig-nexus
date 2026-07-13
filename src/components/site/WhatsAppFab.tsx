import { MessageCircle } from "lucide-react";

// Set VITE_WHATSAPP_NUMBER (E.164, digits only, e.g. 2348001234567) in your
// environment to point this at the real UIG WhatsApp Business line.
const WHATSAPP_NUMBER = import.meta.env.VITE_WHATSAPP_NUMBER || "2348000000000";
const DEFAULT_MESSAGE = "Hi UIG — I'd like to talk to someone about your divisions.";

export function WhatsAppFab() {
  const href = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(DEFAULT_MESSAGE)}`;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat with UIG on WhatsApp"
      className="fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg shadow-black/20 transition hover:scale-105 hover:brightness-105"
    >
      <MessageCircle className="h-6 w-6" fill="currentColor" strokeWidth={0} />
    </a>
  );
}

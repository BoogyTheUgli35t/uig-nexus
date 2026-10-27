import { MessageCircle } from "lucide-react";
import { whatsappHref } from "@/lib/seo";

const DEFAULT_MESSAGE = "Hi UIG — I'd like to talk to someone about your divisions.";

/**
 * The floating WhatsApp button.
 *
 * Renders nothing when `VITE_WHATSAPP_NUMBER` is unset. It used to fall back
 * to `2348000000000`, so a deploy configured from `.env.example` shipped a
 * chat button on every public page that dialled a number nobody owns —
 * strictly worse than having no button, because a visitor who taps it
 * concludes UIG doesn't answer.
 */
export function WhatsAppFab() {
  const href = whatsappHref(DEFAULT_MESSAGE);
  if (!href) return null;

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

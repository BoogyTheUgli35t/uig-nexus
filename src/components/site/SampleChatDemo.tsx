import { MessageSquare } from "lucide-react";

const EXCHANGE = [
  { from: "customer", text: "Abeg, my order never reach since last week. Wetin dey happen?" },
  {
    from: "bot",
    text: "Sorry for the delay o! I don check am — your order (UIG-88213) dey Lagos hub since yesterday. E go land your address before 6pm today. Tracking link don land your WhatsApp now-now.",
  },
  { from: "customer", text: "Ehen, thank you well well!" },
  { from: "bot", text: "No wahala at all. Anything else I fit help you with today?" },
] as const;

/** Static, clearly-labelled sample transcript — not a live, callable model.
 * Demonstrates the native-language chatbot value prop without implying a
 * working AI backend actually powers this page. */
export function SampleChatDemo() {
  return (
    <div className="rounded-xl border border-border bg-surface/60 p-5 sm:p-6">
      <div className="flex items-center gap-2 text-sm font-semibold">
        <MessageSquare className="h-4 w-4 text-gold" /> Sample conversation · Nigerian Pidgin
      </div>
      <p className="mt-1 text-xs text-muted-foreground">
        An illustrative transcript, not a live model — this is what a customer-service bot built
        on native-language understanding sounds like.
      </p>

      <div className="mt-5 space-y-3">
        {EXCHANGE.map((msg, i) => (
          <div
            key={i}
            className={
              msg.from === "bot"
                ? "ml-auto max-w-[85%] rounded-2xl rounded-tr-sm bg-gold/10 border border-gold/20 px-4 py-2.5 text-sm"
                : "mr-auto max-w-[85%] rounded-2xl rounded-tl-sm bg-background border border-border px-4 py-2.5 text-sm"
            }
          >
            {msg.text}
          </div>
        ))}
      </div>
    </div>
  );
}

// Renders a JSON-LD <script> tag directly in the page body. Search engines
// crawl structured data anywhere in the rendered HTML (head or body) — this
// avoids depending on the router's less-common typed `head().scripts` API,
// which has no existing precedent elsewhere in this codebase to verify against.
export function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      // Safe: `data` is app-authored structured data, never user input.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

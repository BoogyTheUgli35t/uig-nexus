import { Outlet, Link, createRootRoute, HeadContent, Scripts } from "@tanstack/react-router";
import { useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { installGlobalErrorReporting } from "@/lib/report-error";
import { Toaster } from "@/components/ui/sonner";
import { BackendBanner } from "@/components/site/BackendBanner";

import appCss from "../styles.css?url";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      retry: 1,
    },
  },
});

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-gradient-gold">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-gold px-4 py-2 text-sm font-medium text-gold-foreground transition-colors hover:bg-gold/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Unified Innovations Group — Two Steps Ahead." },
      {
        name: "description",
        content:
          "UIG is Nigeria's leading multi-sector innovation conglomerate — building the infrastructure for Africa's future through technology, agriculture, intelligence and beyond.",
      },
      { name: "author", content: "Unified Innovations Group" },
      { property: "og:title", content: "Unified Innovations Group — Two Steps Ahead." },
      {
        property: "og:description",
        content:
          "UIG is Nigeria's leading multi-sector innovation conglomerate — building the infrastructure for Africa's future through technology, agriculture, intelligence and beyond.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Unified Innovations Group — Two Steps Ahead." },
      {
        name: "twitter:description",
        content:
          "UIG is Nigeria's leading multi-sector innovation conglomerate — building the infrastructure for Africa's future through technology, agriculture, intelligence and beyond.",
      },
      {
        property: "og:image",
        content:
          "https://storage.googleapis.com/gpt-engineer-file-uploads/attachments/og-images/e6b25550-beb6-4918-8631-81e4e441b36b",
      },
      {
        name: "twitter:image",
        content:
          "https://storage.googleapis.com/gpt-engineer-file-uploads/attachments/og-images/e6b25550-beb6-4918-8631-81e4e441b36b",
      },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Inter:wght@100..900&family=Space+Grotesk:wght@300..700&display=swap",
      },
    ],

  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        <QueryClientProvider client={queryClient}>
          {children}
          <Toaster />
        </QueryClientProvider>
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  // Hydration probe: set once the client bundle actually mounts. E2E uses this
  // to distinguish "the app is broken" from "this environment served SSR HTML
  // but never hydrated", which is otherwise indistinguishable from the outside
  // and produced a run of phantom test failures.
  useEffect(() => {
    (window as unknown as { __UIG_HYDRATED__?: boolean }).__UIG_HYDRATED__ = true;
    installGlobalErrorReporting();
  }, []);

  return (
    <>
      <BackendBanner />
      <Outlet />
    </>
  );
}

/**
 * Client-side error reporting.
 *
 * Fire-and-forget POST to /api/public/client-error, which lands the error in
 * portal_audit_log (visible at /portal/admin/audit). Kept dependency-free and
 * deliberately silent: a reporter that throws, retries, or blocks rendering is
 * worse than no reporter.
 */

let reportedThisSession = 0;
const SESSION_CAP = 10;

export function reportClientError(error: unknown, context?: { route?: string }) {
  if (typeof window === "undefined") return;
  // A render loop can throw hundreds of times a second; never let reporting
  // amplify an outage into a self-inflicted request flood.
  if (reportedThisSession >= SESSION_CAP) return;
  reportedThisSession++;

  const err = error instanceof Error ? error : new Error(String(error));
  const body = JSON.stringify({
    message: err.message,
    stack: err.stack ?? "",
    route: context?.route ?? window.location.pathname,
  });

  try {
    // sendBeacon survives navigation/unload, which is exactly when errors bite.
    if (navigator.sendBeacon) {
      navigator.sendBeacon(
        "/api/public/client-error",
        new Blob([body], { type: "application/json" }),
      );
      return;
    }
    void fetch("/api/public/client-error", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      keepalive: true,
    }).catch(() => {});
  } catch {
    // Never let reporting break the page.
  }
}

/** Attach global handlers once, from the app root. */
export function installGlobalErrorReporting() {
  if (typeof window === "undefined") return;
  const w = window as unknown as { __uigErrorHandlersInstalled?: boolean };
  if (w.__uigErrorHandlersInstalled) return;
  w.__uigErrorHandlersInstalled = true;

  window.addEventListener("error", (e) => reportClientError(e.error ?? e.message));
  window.addEventListener("unhandledrejection", (e) => reportClientError(e.reason));
}

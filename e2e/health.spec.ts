import { test, expect } from "@playwright/test";

/**
 * Guards the endpoints external monitoring depends on. If these change shape,
 * uptime alerting silently stops meaning anything — so they're asserted here
 * rather than trusted.
 */
test.describe("Operational endpoints", () => {
  test("shallow health check reports ok without touching the database", async ({ request }) => {
    const res = await request.get("/api/public/health");
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.status).toBe("ok");
    expect(typeof body.uptime_seconds).toBe("number");
    expect(body.database).toBeUndefined();
  });

  test("deep health check reports database reachability", async ({ request }) => {
    const res = await request.get("/api/public/health?deep=1");
    const body = await res.json();
    // 200 + ok, or 503 + degraded — both are valid, well-formed answers. A
    // monitor must be able to trust the status code either way.
    expect([200, 503]).toContain(res.status());
    expect(body.database).toBeDefined();
    expect(typeof body.database.latency_ms).toBe("number");
    if (res.status() === 200) {
      expect(body.status).toBe("ok");
      expect(body.database.status).toBe("ok");
    } else {
      expect(body.status).toBe("degraded");
    }
  });

  test("client error sink accepts a report and never leaks detail", async ({ request }) => {
    const res = await request.post("/api/public/client-error", {
      data: { message: "e2e synthetic error", route: "/e2e", stack: "synthetic" },
    });
    expect(res.status()).toBe(204);
    expect((await res.text()).length).toBe(0);
  });

  test("client error sink shrugs off malformed payloads", async ({ request }) => {
    const res = await request.post("/api/public/client-error", {
      headers: { "content-type": "application/json" },
      data: "not-json-at-all",
    });
    expect(res.status()).toBe(204);
  });
});

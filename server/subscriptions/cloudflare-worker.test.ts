import { afterEach, describe, expect, it, vi } from "vitest";
import crypto from "node:crypto";
import worker, { runScheduled, sendReconciliationTrigger, type Env } from "../../cloudflare/subscription-reconciler/src/index";

const env: Env = {
  BAKERIQ_TRIGGER_URL: "https://bakeriq.app/api/internal/subscription-reconcile",
  BAKERIQ_TRIGGER_SECRET: "test-trigger-secret-with-at-least-32-bytes",
  SUBSCRIPTION_CRON_ENABLED: "true",
};

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe("Cloudflare scheduled worker", () => {
  it("signs the exact BakerIQ request body and sends no billing credentials", async () => {
    const fetcher = vi.fn().mockResolvedValue(new Response(JSON.stringify({ ok: true, processed: 1 })));
    const nonce = "00000000-0000-4000-8000-000000000001";
    const now = 1_800_000_000_000;
    await sendReconciliationTrigger(env, fetcher, now, nonce);
    const [url, init] = fetcher.mock.calls[0] as [string, RequestInit];
    expect(url).toBe(env.BAKERIQ_TRIGGER_URL);
    expect(init.method).toBe("POST");
    expect(init.redirect).toBe("error");
    expect(init.body).toBe('{"trigger":"scheduled"}');
    const headers = new Headers(init.headers);
    const timestamp = Math.floor(now / 1000).toString();
    const hash = crypto.createHash("sha256").update(String(init.body)).digest("hex");
    const canonical = `POST\n/api/internal/subscription-reconcile\n${timestamp}\n${nonce}\n${hash}`;
    const expected = crypto.createHmac("sha256", env.BAKERIQ_TRIGGER_SECRET).update(canonical).digest("hex");
    expect(headers.get("x-bakeriq-signature")).toBe(expected);
    expect(headers.get("x-bakeriq-nonce")).toBe(nonce);
    expect(headers.has("authorization")).toBe(false);
    expect(headers.has("stripe-secret-key")).toBe(false);
  });

  it("rejects non-HTTPS, wrong-host, or wrong-path targets before sending secrets", async () => {
    const fetcher = vi.fn();
    await expect(sendReconciliationTrigger({
      ...env, BAKERIQ_TRIGGER_URL: "https://attacker.example/api/internal/subscription-reconcile",
    }, fetcher, Date.now(), "00000000-0000-4000-8000-000000000001")).rejects.toThrow("safety check");
    expect(fetcher).not.toHaveBeenCalled();
  });

  it("keeps the disabled cron inert and stops after the first empty batch", async () => {
    const fetcher = vi.fn().mockResolvedValue(new Response(JSON.stringify({ ok: true, processed: 0 })));
    vi.stubGlobal("fetch", fetcher);
    const log = vi.spyOn(console, "info").mockImplementation(() => {});
    await worker.scheduled({}, { ...env, SUBSCRIPTION_CRON_ENABLED: "false" });
    expect(fetcher).not.toHaveBeenCalled();
    await worker.scheduled({}, env);
    expect(fetcher).toHaveBeenCalledOnce();
    expect(log).toHaveBeenCalledWith(expect.stringContaining("processed=0"));
  });

  it("marks non-success HTTP responses as failed scheduled invocations", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("unavailable", { status: 503 })));
    vi.spyOn(console, "error").mockImplementation(() => {});
    await expect(worker.scheduled({}, env)).rejects.toThrow("HTTP 503");
  });

  it("caps ordinary runs at 30 and slow runs below 12 minutes without real waits", async () => {
    for (const requestMs of [100, 15_000, 59_000]) {
      let clock = 0;
      const send = vi.fn(async () => {
        clock += requestMs;
        return new Response(JSON.stringify({ ok: true, processed: 1 }));
      });
      await runScheduled(env, {
        now: () => clock, send, sleep: async ms => { clock += ms; },
      });
      expect(send.mock.calls.length).toBeLessThanOrEqual(30);
      expect(clock).toBeLessThanOrEqual(12 * 60_000);
      if (requestMs === 100) expect(send).toHaveBeenCalledTimes(30);
    }
  });

  it("does not retry timeout/network failures or accept malformed success", async () => {
    const send = vi.fn(async () => { throw new DOMException("timeout", "TimeoutError"); });
    await expect(runScheduled(env, { send })).rejects.toThrow("timeout");
    expect(send).toHaveBeenCalledOnce();
    await expect(runScheduled(env, {
      send: async () => new Response(JSON.stringify({ processed: 999 })),
    })).rejects.toThrow("invalid aggregate");
  });

  it("ships without Cron Triggers or a runtime activation", async () => {
    const { readFile } = await import("node:fs/promises");
    const config = await readFile("cloudflare/subscription-reconciler/wrangler.toml", "utf8");
    expect(config).toMatch(/crons\s*=\s*\[\]/);
    expect(config).toContain('SUBSCRIPTION_CRON_ENABLED = "false"');
  });
});

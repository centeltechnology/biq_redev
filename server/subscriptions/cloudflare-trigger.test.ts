import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import crypto from "node:crypto";
import express from "express";
import { createServer, type Server } from "node:http";

const mocks = vi.hoisted(() => ({
  connect: vi.fn(),
  tick: vi.fn(),
  enabled: vi.fn(),
}));
vi.mock("../db", () => ({ pool: { connect: mocks.connect } }));
vi.mock("./service", () => ({
  reconciliationTick: mocks.tick,
  syncEnabled: mocks.enabled,
}));

import { registerCloudflareSubscriptionTrigger } from "./cloudflare-trigger";

const secret = "test-trigger-secret-with-at-least-32-bytes";
const nonce = "00000000-0000-4000-8000-000000000001";
const path = "/api/internal/subscription-reconcile";
const body = Buffer.from('{"trigger":"scheduled"}');
let server: Server;
let url: string;
let now: number;
let claimNonce: ReturnType<typeof vi.fn>;
let run: ReturnType<typeof vi.fn>;

function signedHeaders(nonceValue = nonce, timestampMs = now) {
  const timestamp = Math.floor(timestampMs / 1000).toString();
  const digest = crypto.createHash("sha256").update(body).digest("hex");
  const canonical = `POST\n${path}\n${timestamp}\n${nonceValue}\n${digest}`;
  const signature = crypto.createHmac("sha256", secret).update(canonical).digest("hex");
  return {
    "content-type": "application/json",
    "x-bakeriq-timestamp": timestamp,
    "x-bakeriq-nonce": nonceValue,
    "x-bakeriq-signature": signature,
  };
}

async function post(headers = signedHeaders(), payload: Buffer = body) {
  return fetch(url, { method: "POST", headers, body: payload });
}

beforeEach(async () => {
  now = Date.now();
  claimNonce = vi.fn().mockResolvedValue("accepted");
  run = vi.fn().mockResolvedValue({ failed: false, processed: 1, skipped: false });
  mocks.enabled.mockReturnValue(true);
  const app = express();
  registerCloudflareSubscriptionTrigger(app, {
    secret: () => secret,
    enabled: mocks.enabled,
    claimNonce,
    run,
    now: () => now,
  });
  server = createServer(app);
  await new Promise<void>(resolve => server.listen(0, "127.0.0.1", resolve));
  url = `http://127.0.0.1:${(server.address() as { port: number }).port}${path}`;
});

afterEach(async () => {
  await new Promise<void>(resolve => server.close(() => resolve()));
  vi.clearAllMocks();
});

describe("Cloudflare reconciliation trigger authentication", () => {
  it("rejects missing and invalid signatures before touching nonce storage or the worker", async () => {
    const missingSecretApp = express();
    const { createCloudflareTriggerHandler } = await import("./cloudflare-trigger");
    missingSecretApp.post(path, express.raw({ type: "application/json" }),
      createCloudflareTriggerHandler({
        secret: () => undefined, enabled: () => true, claimNonce, run, now: () => now,
      }));
    const missingServer = createServer(missingSecretApp);
    await new Promise<void>(resolve => missingServer.listen(0, "127.0.0.1", resolve));
    const missingUrl = `http://127.0.0.1:${(missingServer.address() as { port: number }).port}${path}`;
    const unavailable = await fetch(missingUrl, {
      method: "POST", headers: signedHeaders(), body,
    });
    expect(unavailable.status).toBe(503);
    await new Promise<void>(resolve => missingServer.close(() => resolve()));

    const headers = signedHeaders();
    headers["x-bakeriq-signature"] = "0".repeat(64);
    expect((await post(headers)).status).toBe(401);
    expect(claimNonce).not.toHaveBeenCalled();
    expect(run).not.toHaveBeenCalled();
  });

  it("rejects stale timestamps and body changes", async () => {
    expect((await post(signedHeaders(nonce, now - 6 * 60_000))).status).toBe(401);
    expect((await post(signedHeaders(), Buffer.from("{}"))).status).toBe(401);
    expect(claimNonce).not.toHaveBeenCalled();
    expect(run).not.toHaveBeenCalled();
  });

  it("keeps the independent subscription-sync gate fail-closed", async () => {
    mocks.enabled.mockReturnValue(false);
    expect((await post()).status).toBe(503);
    expect(claimNonce).not.toHaveBeenCalled();
    expect(run).not.toHaveBeenCalled();
  });

  it("rejects replay and rate-limited nonce claims", async () => {
    claimNonce.mockResolvedValueOnce("replay").mockResolvedValueOnce("rate_limited");
    expect((await post()).status).toBe(409);
    expect((await post(signedHeaders("00000000-0000-4000-8000-000000000002"))).status).toBe(429);
    expect(run).not.toHaveBeenCalled();
  });

  it("awaits one bounded batch and returns only aggregate progress", async () => {
    const response = await post();
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true, processed: 1 });
    expect(claimNonce).toHaveBeenCalledWith(nonce);
    expect(run).toHaveBeenCalledOnce();
  });

  it("reports overlap and provider failure without claiming success", async () => {
    run.mockResolvedValueOnce({ failed: false, processed: 0, skipped: true })
      .mockResolvedValueOnce({ failed: true, processed: 1, skipped: false });
    expect((await post()).status).toBe(409);
    expect((await post(signedHeaders("00000000-0000-4000-8000-000000000003"))).status).toBe(503);
  });
});

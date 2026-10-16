import { afterEach, describe, expect, it, vi } from "vitest";
import express from "express";
import { createServer, type Server } from "node:http";
import Stripe from "stripe";
import { applicationJson, authenticateConnectWebhook } from "./connect-webhook-auth";

// Synthetic test credentials only. No provider requests or real records.
const stripe = new Stripe("sk_test_synthetic_not_a_real_key");
const secret = "whsec_synthetic_fixture_only";
const servers: Server[] = [];
afterEach(async () => {
  await Promise.all(servers.splice(0).map(server => new Promise<void>(resolve => {
    server.close(() => resolve());
    server.closeAllConnections();
  })));
});

function event(overrides: Record<string, unknown> = {}) {
  return {
    id: "evt_fixture", object: "event", type: "checkout.session.completed",
    data: { object: {
      id: "cs_fixture", object: "checkout.session", mode: "payment",
      payment_status: "paid", amount_total: 1000, payment_intent: "pi_fixture",
      metadata: { quoteId: "quote_fixture", bakerId: "baker_fixture", paymentType: "full", platformFee: "0.70" },
      ...overrides,
    } },
  };
}

async function fixture(options: { missingSecret?: boolean; missingRaw?: boolean; wrongOwner?: boolean; lookupFails?: boolean } = {}) {
  const app = express();
  app.use(options.missingRaw ? express.json() : applicationJson());
  const lookup = vi.fn(async () => {
    if (options.lookupFails) throw new Error("fixture failure");
    return { bakerId: options.wrongOwner ? "another_baker" : "baker_fixture" };
  });
  const processPayment = vi.fn();
  app.post("/api/stripe-connect/webhook", authenticateConnectWebhook({
    signingSecret: () => options.missingSecret ? undefined : secret,
    stripe: async () => stripe,
    getQuote: lookup,
  }), (_req, res) => {
    processPayment(res.locals.verifiedConnectEvent);
    res.json({ received: true });
  });
  const server = createServer(app);
  servers.push(server);
  await new Promise<void>(resolve => server.listen(0, "127.0.0.1", resolve));
  const address = server.address() as { port: number };
  const post = async (payload: string, signature?: string) => fetch(
    `http://127.0.0.1:${address.port}/api/stripe-connect/webhook`, {
      method: "POST",
      headers: { "content-type": "application/json", ...(signature ? { "stripe-signature": signature } : {}) },
      body: payload,
    });
  return { post, lookup, processPayment };
}
const sign = (payload: string, timestamp?: number) =>
  stripe.webhooks.generateTestHeaderString({ payload, secret, ...(timestamp ? { timestamp } : {}) });

describe("Connect webhook HTTP trust boundary", () => {
  it("rejects missing signatures without reading or mutating business records", async () => {
    const f = await fixture();
    expect((await f.post(JSON.stringify(event()))).status).toBe(400);
    expect(f.lookup).not.toHaveBeenCalled();
    expect(f.processPayment).not.toHaveBeenCalled();
  });
  it("rejects invalid signatures without business access", async () => {
    const f = await fixture();
    expect((await f.post(JSON.stringify(event()), "invalid")).status).toBe(400);
    expect(f.lookup).not.toHaveBeenCalled();
    expect(f.processPayment).not.toHaveBeenCalled();
  });
  it("fails closed without signing configuration", async () => {
    const f = await fixture({ missingSecret: true });
    const body = JSON.stringify(event());
    expect((await f.post(body, sign(body))).status).toBe(503);
    expect(f.processPayment).not.toHaveBeenCalled();
  });
  it("verifies original whitespace-preserving bytes with the application JSON middleware", async () => {
    const f = await fixture();
    const body = JSON.stringify(event(), null, 3) + "\n";
    expect((await f.post(body, sign(body))).status).toBe(200);
    expect(f.processPayment).toHaveBeenCalledWith(event());
  });
  it("rejects modified raw bytes", async () => {
    const f = await fixture();
    const body = JSON.stringify(event());
    expect((await f.post(body + " ", sign(body))).status).toBe(400);
    expect(f.processPayment).not.toHaveBeenCalled();
  });
  it("rejects stale signatures", async () => {
    const f = await fixture();
    const body = JSON.stringify(event());
    expect((await f.post(body, sign(body, 1))).status).toBe(400);
    expect(f.processPayment).not.toHaveBeenCalled();
  });
  it("does not fall back to parsed JSON when raw-body capture is absent", async () => {
    const f = await fixture({ missingRaw: true });
    const body = JSON.stringify(event());
    expect((await f.post(body, sign(body))).status).toBe(400);
    expect(f.processPayment).not.toHaveBeenCalled();
  });
  it.each([
    { mode: "subscription" },
    { amount_total: -100 },
    { metadata: {} },
    { payment_intent: null },
    { metadata: { quoteId: "quote_fixture", bakerId: "baker_fixture", platformFee: "NaN" } },
  ])("rejects a signed invalid context: %j", async overrides => {
    const f = await fixture();
    const body = JSON.stringify(event(overrides));
    expect((await f.post(body, sign(body))).status).toBe(400);
    expect(f.processPayment).not.toHaveBeenCalled();
  });
  it("rejects a signed cross-baker reference", async () => {
    const f = await fixture({ wrongOwner: true });
    const body = JSON.stringify(event());
    expect((await f.post(body, sign(body))).status).toBe(400);
    expect(f.processPayment).not.toHaveBeenCalled();
  });
  it("fails closed if business context cannot be checked", async () => {
    const f = await fixture({ lookupFails: true });
    const body = JSON.stringify(event());
    expect((await f.post(body, sign(body))).status).toBe(503);
    expect(f.processPayment).not.toHaveBeenCalled();
  });
  it("acknowledges unrelated signed events without processing payments", async () => {
    const f = await fixture();
    const body = JSON.stringify({ ...event(), type: "account.updated" });
    expect((await f.post(body, sign(body))).status).toBe(200);
    expect(f.processPayment).not.toHaveBeenCalled();
  });
  it("rejects connected-account events for platform destination-charge processing", async () => {
    const f = await fixture();
    const body = JSON.stringify({ ...event(), account: "acct_fixture" });
    expect((await f.post(body, sign(body))).status).toBe(400);
    expect(f.processPayment).not.toHaveBeenCalled();
  });
  it("acknowledges unpaid completion without mutations", async () => {
    const f = await fixture();
    const body = JSON.stringify(event({ payment_status: "unpaid" }));
    expect((await f.post(body, sign(body))).status).toBe(200);
    expect(f.processPayment).not.toHaveBeenCalled();
  });
  it("rejects a signed event with no session object", async () => {
    const f = await fixture();
    const body = JSON.stringify({ ...event(), data: {} });
    expect((await f.post(body, sign(body))).status).toBe(400);
    expect(f.processPayment).not.toHaveBeenCalled();
  });
});

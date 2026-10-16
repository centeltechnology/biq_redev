import { afterAll, beforeAll, beforeEach, expect, it, vi } from "vitest";
import express from "express";
import { createServer, type Server } from "node:http";
import Stripe from "stripe";
import { applicationJson } from "./connect-webhook-auth";

vi.mock("./db", () => ({ pool: {}, db: {} }));
vi.mock("./storage", () => ({
  storage: {
    getQuote: vi.fn(),
    updateQuote: vi.fn(),
    createQuotePayment: vi.fn(),
    setActivationTimestamp: vi.fn(),
    getBaker: vi.fn(),
    getCustomer: vi.fn(),
    getBakerByEmail: vi.fn(async () => ({ id: "existing_fixture" })),
    getAllBakers: vi.fn(),
    updateBaker: vi.fn(),
  },
}));
vi.mock("./email");
vi.mock("./push");
vi.mock("./event-tracking");
vi.mock("./seed-retention-templates", () => ({ seedRetentionTemplates: vi.fn() }));
vi.mock("./stripeClient", () => ({
  getUncachableStripeClient: vi.fn(),
  getStripePublishableKey: vi.fn(),
}));
vi.mock("./replit_integrations/object_storage", () => ({
  registerObjectStorageRoutes: vi.fn(),
}));
vi.mock("openai", () => ({ default: class {} }));
vi.mock("connect-pg-simple", async () => {
  const session = await import("express-session");
  return { default: () => session.default.MemoryStore };
});
vi.mock("./connect-webhook-auth", async importOriginal => {
  const original = await importOriginal<typeof import("./connect-webhook-auth")>();
  return {
    ...original,
    authenticateConnectWebhook: (deps: Parameters<typeof original.authenticateConnectWebhook>[0]) =>
      original.authenticateConnectWebhook({ ...deps, signingSecret: () => "whsec_route_fixture" }),
  };
});

import { registerRoutes } from "./routes";
import { storage } from "./storage";
import { getUncachableStripeClient } from "./stripeClient";

let server: Server;
let url: string;
const stripe = new Stripe("sk_test_synthetic_not_real");
const payload = JSON.stringify({
  id: "evt_fixture", object: "event", type: "checkout.session.completed",
  data: { object: {
    id: "cs_fixture", object: "checkout.session", mode: "payment",
    payment_status: "paid", amount_total: 1000, payment_intent: "pi_fixture", currency: "usd",
    metadata: { quoteId: "quote_fixture", bakerId: "baker_fixture", paymentType: "full", platformFee: "0.70" },
  } },
}, null, 2);

beforeAll(async () => {
  const app = express();
  app.use(applicationJson());
  // Test-only session fixture. No production auth bypass is installed.
  app.use((req,_res,next) => {
    if (req.headers["x-test-session"] === "baker")
      req.session = {bakerId:"baker_fixture"} as typeof req.session;
    next();
  });
  server = createServer(app);
  await registerRoutes(server, app);
  await new Promise<void>(resolve => server.listen(0, "127.0.0.1", resolve));
  url = `http://127.0.0.1:${(server.address() as { port: number }).port}/api/stripe-connect/webhook`;
});
beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(getUncachableStripeClient).mockResolvedValue(stripe);
  vi.mocked(storage.getQuote).mockResolvedValue({
    id: "quote_fixture", bakerId: "baker_fixture", customerId: "customer_fixture",
    total: "10.00", amountPaid: "0", status: "sent", currencyCode: "USD",
  } as Awaited<ReturnType<typeof storage.getQuote>>);
});
afterAll(async () => {
  await new Promise<void>(resolve => {
    server.close(() => resolve());
    server.closeAllConnections();
  });
});

it("ordinary baker cannot grant plan, billing IDs or administrative entitlements through profile edits",async()=>{
  const base=url.replace("/api/stripe-connect/webhook","");
  vi.mocked(storage.updateBaker).mockResolvedValue({id:"baker_fixture",plan:"free"} as any);
  const response=await fetch(`${base}/api/bakers/me`,{
    method:"PATCH",headers:{"content-type":"application/json","x-test-session":"baker"},
    body:JSON.stringify({businessName:"Fixture Bakery",plan:"pro",administrativePlan:"pro",
      role:"super_admin",stripeCustomerId:"other_customer",stripeSubscriptionId:"other_subscription"}),
  });
  expect(response.status).toBe(200);
  const changes=vi.mocked(storage.updateBaker).mock.calls[0][1];
  for(const key of ["plan","administrativePlan","role","stripeCustomerId","stripeSubscriptionId"])
    expect(changes).not.toHaveProperty(key);
});

it("subscription diagnostics and reconciliation require super-admin authorization",async()=>{
  const base=url.replace("/api/stripe-connect/webhook","");
  expect((await fetch(`${base}/api/admin/subscription-sync`)).status).toBe(401);
  vi.mocked(storage.getBaker).mockResolvedValue({id:"baker_fixture",role:"baker"} as any);
  expect((await fetch(`${base}/api/admin/subscription-sync`,{
    headers:{"x-test-session":"baker"},
  })).status).toBe(403);
  expect((await fetch(`${base}/api/admin/subscription-sync/reconcile`,{
    method:"POST",headers:{"x-test-session":"baker"},
  })).status).toBe(403);
});

it("signed HTTP delivery reaches the existing payment handler and its storage writes", async () => {
  const signature = stripe.webhooks.generateTestHeaderString({ payload, secret: "whsec_route_fixture" });
  const response = await fetch(url, {
    method: "POST", body: payload,
    headers: { "content-type": "application/json", "stripe-signature": signature },
  });
  expect(response.status).toBe(200);
  expect(storage.updateQuote).toHaveBeenCalledWith("quote_fixture", expect.objectContaining({
    amountPaid: "10.00", paymentStatus: "paid", status: "approved",
  }));
  expect(storage.createQuotePayment).toHaveBeenCalledWith(expect.objectContaining({
    quoteId: "quote_fixture", bakerId: "baker_fixture",
    amount: "10.00", platformFee: "0.70", status: "succeeded",
  }));
  expect(storage.setActivationTimestamp).toHaveBeenCalledWith("baker_fixture", "firstPaymentProcessedAt");
});

it("unsigned HTTP delivery cannot reach any existing business writes", async () => {
  const response = await fetch(url, {
    method: "POST", body: payload, headers: { "content-type": "application/json" },
  });
  expect(response.status).toBe(400);
  expect(storage.getQuote).not.toHaveBeenCalled();
  expect(storage.updateQuote).not.toHaveBeenCalled();
  expect(storage.createQuotePayment).not.toHaveBeenCalled();
  expect(storage.setActivationTimestamp).not.toHaveBeenCalled();
});

// Containment must reject all callers without reading or mutating records.
it.each([
  { name: "anonymous upgrade", initial: "free", status: "active", signature: undefined },
  { name: "invalid-signature upgrade", initial: "free", status: "active", signature: "invalid" },
  { name: "anonymous cancellation", initial: "pro", status: "canceled", signature: undefined },
])("contained callback: $name cannot change a baker's plan", async ({ initial, status, signature }) => {
  const record = { id: "baker_fixture", stripeCustomerId: "cus_fixture", plan: initial };
  vi.mocked(storage.getAllBakers).mockResolvedValue([record as Awaited<ReturnType<typeof storage.getAllBakers>>[number]]);
  vi.mocked(storage.updateBaker).mockImplementation(async (_id, patch) => {
    Object.assign(record, patch);
    return record as Awaited<ReturnType<typeof storage.updateBaker>>;
  });
  const response = await fetch(url.replace("/stripe-connect/webhook", "/subscription/webhook-update"), {
    method: "POST",
    headers: { "content-type": "application/json", ...(signature ? { "stripe-signature": signature } : {}) },
    body: JSON.stringify({
      customerId: "cus_fixture", subscriptionId: "sub_fixture", status, plan: "pro",
    }),
  });
  // Demonstrate the storage mutation before asserting the HTTP status, so
  // this test cannot mistake an error response after a write for protection.
  expect(record.plan).toBe(initial);
  expect(storage.updateBaker).not.toHaveBeenCalled();
  expect(storage.getAllBakers).not.toHaveBeenCalled();
  expect(storage.getBaker).not.toHaveBeenCalled();
  expect(getUncachableStripeClient).not.toHaveBeenCalled();
  expect(response.status).toBe(503);
  expect(response.headers.get("cache-control")).toBe("no-store");
  expect(await response.json()).toEqual({
    code: "SUBSCRIPTION_CALLBACK_DISABLED",
    message: "Subscription callback temporarily unavailable",
  });
});

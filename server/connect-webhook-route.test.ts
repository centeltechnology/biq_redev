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

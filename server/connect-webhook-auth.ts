import express, { type RequestHandler } from "express";
import type Stripe from "stripe";

// Shared by the application and HTTP tests. Stripe verification must receive
// these original bytes, never JSON.stringify(req.body).
export const applicationJson = () => express.json({
  verify: (req, _res, buffer) => {
    (req as typeof req & { rawBody: Buffer }).rawBody = buffer;
  },
});

type Dependencies = {
  signingSecret: () => string | undefined;
  stripe: () => Promise<Pick<Stripe, "webhooks">>;
  getQuote: (id: string) => Promise<{ bakerId: string } | undefined>;
};

export function authenticateConnectWebhook(deps: Dependencies): RequestHandler {
  return async (req, res, next) => {
    const secret = deps.signingSecret();
    if (!secret) {
      res.status(503).json({ message: "Webhook verification unavailable" });
      return;
    }
    const signature = req.headers["stripe-signature"];
    const rawBody = (req as typeof req & { rawBody?: unknown }).rawBody;
    if (typeof signature !== "string" || !signature || !Buffer.isBuffer(rawBody)) {
      res.status(400).json({ message: "Invalid webhook signature" });
      return;
    }

    let stripe: Pick<Stripe, "webhooks">;
    try {
      stripe = await deps.stripe();
    } catch {
      res.status(503).json({ message: "Webhook verification unavailable" });
      return;
    }
    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(rawBody, signature, secret);
    } catch {
      res.status(400).json({ message: "Invalid webhook signature" });
      return;
    }

    // Other signed event types belong to other handlers. Preserve Stripe's
    // successful acknowledgement without letting them mutate payment records.
    if (event.type !== "checkout.session.completed") {
      res.json({ received: true });
      return;
    }
    const session = event.data?.object;
    if (!session || typeof session !== "object" || session.object !== "checkout.session") {
      res.status(400).json({ message: "Invalid payment event context" });
      return;
    }
    if (session.payment_status !== "paid") {
      res.json({ received: true });
      return;
    }
    // Destination-charge Checkout sessions originate on the platform account.
    // Subscription Checkout sessions must not enter quote-payment accounting.
    if (event.account || session.object !== "checkout.session" || session.mode !== "payment") {
      res.status(400).json({ message: "Invalid payment event context" });
      return;
    }
    const { quoteId, bakerId, paymentType, platformFee } = session.metadata || {};
    if (!quoteId || !bakerId ||
        (paymentType !== undefined && !["deposit", "full", "remaining"].includes(paymentType)) ||
        !Number.isSafeInteger(session.amount_total) || session.amount_total! <= 0 ||
        typeof session.payment_intent !== "string" || !session.payment_intent ||
        (platformFee !== undefined && (!platformFee.trim() ||
          !Number.isFinite(Number(platformFee)) || Number(platformFee) < 0))) {
      res.status(400).json({ message: "Invalid payment event context" });
      return;
    }
    try {
      const quote = await deps.getQuote(quoteId);
      if (!quote || quote.bakerId !== bakerId) {
        res.status(400).json({ message: "Invalid payment event context" });
        return;
      }
    } catch {
      res.status(503).json({ message: "Payment event validation unavailable" });
      return;
    }
    res.locals.verifiedConnectEvent = event;
    next();
  };
}

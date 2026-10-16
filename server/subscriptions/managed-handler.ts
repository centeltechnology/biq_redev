import type { RequestHandler } from "express";
export function managedSubscriptionHandler(deps: {
  verify(raw: Buffer, signature: string): Promise<void>;
  enqueue(raw: Buffer): Promise<void>;
}): RequestHandler {
  return async (req,res) => {
    const signature = req.headers["stripe-signature"];
    if (!signature) return void res.status(400).json({error:"Missing stripe-signature"});
    if (!Buffer.isBuffer(req.body))
      return void res.status(500).json({error:"Webhook processing error"});
    try {
      await deps.verify(req.body,Array.isArray(signature) ? signature[0] : signature);
    } catch {
      return void res.status(400).json({error:"Webhook processing error"});
    }
    try {
      await deps.enqueue(req.body);
      res.status(200).json({received:true});
    } catch {
      // Verified, but not durably queued: ask Stripe to retry. Do not leak SQL,
      // customer metadata, raw event bodies or signatures into logs/responses.
      console.error("Verified subscription event could not be queued");
      res.status(503).json({error:"Subscription synchronization temporarily unavailable"});
    }
  };
}

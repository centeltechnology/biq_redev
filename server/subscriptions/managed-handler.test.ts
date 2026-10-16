import express from "express";
import { createServer, type Server } from "node:http";
import Stripe from "stripe";
import { afterAll, beforeAll, beforeEach, expect, it, vi } from "vitest";
import { managedSubscriptionHandler } from "./managed-handler";

const stripe = new Stripe("sk_test_synthetic");
const secret = "whsec_managed_fixture";
const body = JSON.stringify({id:"evt_fixture",type:"customer.subscription.updated",
  data:{object:{id:"sub_fixture",customer:"cus_fixture",status:"active"}}});
const enqueue = vi.fn(async (_raw:Buffer) => {});
const verify = vi.fn(async(raw:Buffer,sig:string) => { stripe.webhooks.constructEvent(raw,sig,secret); });
let server:Server,url:string;
beforeAll(async()=>{
  const app=express();
  app.post("/api/stripe/webhook",express.raw({type:"application/json"}),
    managedSubscriptionHandler({verify,enqueue}));
  app.use(express.json());
  server=createServer(app);
  await new Promise<void>(r=>server.listen(0,"127.0.0.1",r));
  url=`http://127.0.0.1:${(server.address() as {port:number}).port}/api/stripe/webhook`;
});
beforeEach(()=>{vi.clearAllMocks();enqueue.mockResolvedValue(undefined);});
afterAll(async()=>{await new Promise<void>(r=>{server.close(()=>r());server.closeAllConnections();});});
it.each([undefined,"t=0,v1=invalid"])("unverified requests never enqueue entitlement work (%s)",async sig=>{
  const r=await fetch(url,{method:"POST",body,headers:{"Content-Type":"application/json",...(sig?{"stripe-signature":sig}:{})}});
  expect(r.status).toBe(400);expect(enqueue).not.toHaveBeenCalled();
});
it("queues verified raw bytes after the managed handler accepts them",async()=>{
  const sig=stripe.webhooks.generateTestHeaderString({payload:body,secret});
  const r=await fetch(url,{method:"POST",body,headers:{"Content-Type":"application/json","stripe-signature":sig}});
  expect(r.status).toBe(200);expect(enqueue).toHaveBeenCalledWith(Buffer.from(body));
  expect(verify.mock.invocationCallOrder[0]).toBeLessThan(enqueue.mock.invocationCallOrder[0]);
});
it("tampered payload cannot update subscriptions",async()=>{
  const sig=stripe.webhooks.generateTestHeaderString({payload:body,secret});
  const r=await fetch(url,{method:"POST",body:body+" ",headers:{"Content-Type":"application/json","stripe-signature":sig}});
  expect(r.status).toBe(400);expect(enqueue).not.toHaveBeenCalled();
});
it("queue failure requests a retry without leaking internal errors",async()=>{
  enqueue.mockRejectedValueOnce(new Error("private database detail"));
  const sig=stripe.webhooks.generateTestHeaderString({payload:body,secret});
  const r=await fetch(url,{method:"POST",body,headers:{"Content-Type":"application/json","stripe-signature":sig}});
  expect(r.status).toBe(503);expect(await r.text()).not.toContain("private");
});

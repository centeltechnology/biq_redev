import { beforeEach, describe, expect, it, vi } from "vitest";
import type Stripe from "stripe";
import { currentBilling, type Snapshot } from "./provider";
import { billingAccess, effective, fees, paying, type Billing, type Subject } from "./policy";
import { synchronize, type SyncRepository } from "./synchronizer";

const now = Date.parse("2026-10-16T12:00:00Z");
const day = 86_400_000;
const subject = (): Subject => ({
  id:"baker_fixture",plan:"free",customerId:"cus_fixture",subscriptionId:null,
  surveyTrialEnd:null,giftedPlan:"free",giftEnd:null,
});
function fixtures(plan: "basic" | "pro" = "basic") {
  const price = `price_${plan}`;
  const sub = {id:"sub_fixture",customer:"cus_fixture",status:"active",trial_end:null,
    cancel_at_period_end:false,items:{has_more:false,data:[{price:{id:price}}]}};
  const session = {id:"cs_fixture",mode:"subscription",status:"complete",
    customer:"cus_fixture",subscription:"sub_fixture",metadata:{bakerId:"baker_fixture",plan:"forged_ignored"}};
  const invoice = {id:"in_fixture",customer:"cus_fixture",
    parent:{subscription_details:{subscription:"sub_fixture"}},status:"paid",
    amount_paid:plan === "pro" ? 999 : 499,amount_remaining:0,currency:"usd"};
  const line = {amount:499,period:{start:(now-day*10)/1000,end:(now+day*20)/1000},
    pricing:{price_details:{price}},
    parent:{subscription_item_details:{subscription:"sub_fixture"}}};
  const api = {
    prices:{list:vi.fn(async () => ({data:[
      {id:"price_basic",lookup_key:"bakeriq_basic_monthly",unit_amount:499,currency:"usd",
        recurring:{interval:"month",interval_count:1}},
      {id:"price_pro",lookup_key:"bakeriq_pro_monthly",unit_amount:999,currency:"usd",
        recurring:{interval:"month",interval_count:1}},
    ]}))},
    subscriptions:{list:vi.fn(async () => ({has_more:false,data:[sub]}))},
    checkout:{sessions:{
      list:vi.fn(async () => ({has_more:false,data:[session]})),
      listLineItems:vi.fn(async () => ({has_more:false,data:[{price:{id:price}}]})),
    }},
    invoices:{
      list:vi.fn(async () => ({has_more:false,data:[invoice]})),
      listLineItems:vi.fn(async () => ({has_more:false,data:[line]})),
    },
  };
  return {api,sub,session,invoice,line,stripe:api as unknown as Stripe};
}
function memoryRepo(s = subject()) {
  let billing: Billing | null = null;
  let busy = false;
  let writes = 0;
  const awards = new Map<string,unknown>();
  const customerData = { customers:["customer1"],quotes:["quote1"],completedFee:"7.00" };
  let error: string | null = null;
  const repo: SyncRepository = {
    async locked(_id,work) {
      if (busy) return false;
      busy = true;
      try {
        let pending: {snapshot:Snapshot;plan:string} | null = null;
        await work({subject:s,previous:billing,save:async (snapshot,plan) => {
          pending = {snapshot,plan};
        }});
        if (pending) {
          const p = pending as {snapshot:Snapshot;plan:string};
          billing = p.snapshot.billing;
          s.plan = p.plan as Subject["plan"];s.subscriptionId=billing.subscriptionId;
          p.snapshot.activities.forEach(a => awards.set(a.invoiceId,a));
          writes++;error=null;
        }
        return true;
      } finally { busy=false; }
    },
    async failure(_id,code) {error=code;},
  };
  return {repo,s,awards,customerData,get billing(){return billing;},get error(){return error;},
    get writes(){return writes;}};
}
describe("trusted billing lifecycle (no real provider/customer changes)",() => {
  it.each(["basic","pro"] as const)("Free subscribes to %s; exact associated paid invoice authorizes access",async plan => {
    const f=fixtures(plan),m=memoryRepo();
    expect(await synchronize(m.s.id,m.repo,(s,p,n)=>currentBilling(f.stripe,s,p,n),now)).toBe("synced");
    expect(m.s.plan).toBe(plan);
    expect(fees[m.s.plan]).toBe(plan==="basic"?5:3);
    expect(m.awards.size).toBe(1);
    expect(paying(m.s,m.billing,now)).toBe(true);
  });
  it("Basic upgrades to Pro only with matching paid coverage",async()=>{
    const f=fixtures(),m=memoryRepo();
    await synchronize(m.s.id,m.repo,(s,p,n)=>currentBilling(f.stripe,s,p,n),now);
    const pro=fixtures("pro");
    await synchronize(m.s.id,m.repo,(s,p,n)=>currentBilling(pro.stripe,s,p,n),now);
    expect(m.s.plan).toBe("pro");expect(fees[m.s.plan]).toBe(3);
  });
  it("unpaid upgrade does not revoke verified Basic access or grant Pro",async()=>{
    const f=fixtures(),m=memoryRepo();
    await synchronize(m.s.id,m.repo,(s,p,n)=>currentBilling(f.stripe,s,p,n),now);
    const pro=fixtures("pro");pro.invoice.status="open";
    await synchronize(m.s.id,m.repo,(s,p,n)=>currentBilling(pro.stripe,s,p,n),now+1000);
    expect(m.s.plan).toBe("basic");
  });
  it("Pro downgrade waits through paid Pro period then uses paid Basic period",async()=>{
    const f=fixtures("pro"),m=memoryRepo();
    await synchronize(m.s.id,m.repo,(s,p,n)=>currentBilling(f.stripe,s,p,n),now);
    const basic=fixtures();basic.line.period.start=(now+day*20)/1000;
    basic.line.period.end=(now+day*50)/1000;
    await synchronize(m.s.id,m.repo,(s,p,n)=>currentBilling(basic.stripe,s,p,n),now+day);
    expect(m.s.plan).toBe("pro");
    await synchronize(m.s.id,m.repo,(s,p,n)=>currentBilling(basic.stripe,s,p,n),now+day*21);
    expect(m.s.plan).toBe("basic");expect(fees[m.s.plan]).toBe(5);
  });
  it("successful renewal extends paid coverage and restores expired access automatically",async()=>{
    const f=fixtures(),m=memoryRepo();
    await synchronize(m.s.id,m.repo,(s,p,n)=>currentBilling(f.stripe,s,p,n),now+day*21);
    expect(m.s.plan).toBe("free");
    f.line.period.start=(now+day*20)/1000;f.line.period.end=(now+day*50)/1000;
    f.invoice.id="in_renewal";
    await synchronize(m.s.id,m.repo,(s,p,n)=>currentBilling(f.stripe,s,p,n),now+day*21);
    expect(m.s.plan).toBe("basic");expect(m.billing!.paidThrough).toBe(now+day*50);
  });
  it.each(["past_due","unpaid","canceled","incomplete_expired","paused"])(
    "%s preserves purchased access then expires with no extra grace",async status=>{
      const f=fixtures(),m=memoryRepo();f.sub.status=status;
      await synchronize(m.s.id,m.repo,(s,p,n)=>currentBilling(f.stripe,s,p,n),now);
      expect(m.s.plan).toBe("basic");
      await synchronize(m.s.id,m.repo,(s,p,n)=>currentBilling(f.stripe,s,p,n),now+day*20);
      expect(m.s.plan).toBe("free");expect(fees[m.s.plan]).toBe(7);
      expect(m.customerData).toEqual({customers:["customer1"],quotes:["quote1"],completedFee:"7.00"});
    });
  it("scheduled cancellation keeps access through paid date",async()=>{
    const f=fixtures(),m=memoryRepo();f.sub.cancel_at_period_end=true;
    await synchronize(m.s.id,m.repo,(s,p,n)=>currentBilling(f.stripe,s,p,n),now);
    expect(m.s.plan).toBe("basic");expect(m.billing!.cancelAtPeriodEnd).toBe(true);
    expect(paying(m.s,m.billing,now)).toBe(true); // still an active, paid subscription until period end
  });
  it("failed first payment grants no paid access",async()=>{
    const f=fixtures(),m=memoryRepo();f.invoice.status="open";f.sub.status="past_due";
    await synchronize(m.s.id,m.repo,(s,p,n)=>currentBilling(f.stripe,s,p,n),now);
    expect(m.s.plan).toBe("free");expect(m.awards.size).toBe(0);
  });
  it("authorized Stripe trial expires unless qualifying paid evidence exists",async()=>{
    const f=fixtures(),m=memoryRepo();
    f.sub.status="trialing";(f.sub as any).trial_end=(now+day)/1000;f.invoice.amount_paid=0;
    await synchronize(m.s.id,m.repo,(s,p,n)=>currentBilling(f.stripe,s,p,n),now);
    expect(m.s.plan).toBe("basic");expect(paying(m.s,m.billing,now)).toBe(false);
    await synchronize(m.s.id,m.repo,(s,p,n)=>currentBilling(f.stripe,s,p,n),now+day);
    expect(m.s.plan).toBe("free");
  });
  it("duplicate deliveries produce one verified invoice candidate and no financial awards",async()=>{
    const f=fixtures(),m=memoryRepo();
    for(let i=0;i<3;i++) await synchronize(m.s.id,m.repo,(s,p,n)=>currentBilling(f.stripe,s,p,n),now);
    expect(m.awards.size).toBe(1);expect(m.s.plan).toBe("basic");
    expect(m.customerData.completedFee).toBe("7.00");
  });
  it("delayed event signals fetch current authoritative state, not old event status",async()=>{
    const f=fixtures("pro"),m=memoryRepo();
    // A delayed cancellation is only a signal; the provider now says renewed Pro.
    await synchronize(m.s.id,m.repo,(s,p,n)=>currentBilling(f.stripe,s,p,n),now);
    await synchronize(m.s.id,m.repo,(s,p,n)=>currentBilling(f.stripe,s,p,n),now+1000);
    expect(m.s.plan).toBe("pro");expect(m.billing!.status).toBe("active");
  });
  it("reconciliation repairs a missed event without an active browser session",async()=>{
    const f=fixtures("pro"),m=memoryRepo();
    await synchronize(m.s.id,m.repo,(s,p,n)=>currentBilling(f.stripe,s,p,n),now);
    expect(m.s.plan).toBe("pro");expect(m.s.subscriptionId).toBe("sub_fixture");
  });
  it.each(["customer","checkout","invoice","subscription","price","pagination"])(
    "rejects %s mismatch without changing account data",async kind=>{
      const f=fixtures(),m=memoryRepo();m.s.plan="basic";
      if(kind==="customer") f.sub.customer="other_customer";
      if(kind==="checkout") f.session.metadata.bakerId="other_baker";
      if(kind==="invoice") f.invoice.customer="other_customer";
      if(kind==="subscription") m.s.subscriptionId="different_subscription";
      if(kind==="price") f.sub.items.data[0].price.id="unknown_price";
      if(kind==="pagination") f.api.subscriptions.list.mockResolvedValue({has_more:true,data:[f.sub]});
      expect(await synchronize(m.s.id,m.repo,(s,p,n)=>currentBilling(f.stripe,s,p,n),now)).toBe("failed");
      expect(m.s.plan).toBe("basic");expect(m.writes).toBe(0);expect(m.error).toBeTruthy();
    });
  it("temporary provider failure after paid expiry preserves access and records failure",async()=>{
    const f=fixtures(),m=memoryRepo();
    await synchronize(m.s.id,m.repo,(s,p,n)=>currentBilling(f.stripe,s,p,n),now);
    f.api.subscriptions.list.mockRejectedValue(new Error("provider unavailable with sensitive details"));
    await synchronize(m.s.id,m.repo,(s,p,n)=>currentBilling(f.stripe,s,p,n),now+day*21);
    expect(m.s.plan).toBe("basic");expect(m.error).toBe("PROVIDER_OR_STORAGE_UNAVAILABLE");
  });
  it("uses the bounded trigger Stripe timeout without retrying and preserves access on timeout",async()=>{
    const f=fixtures(),m=memoryRepo();m.s.plan="pro";
    f.api.prices.list.mockRejectedValue(new Error("synthetic Stripe timeout"));
    expect(await synchronize(m.s.id,m.repo,
      (s,p,n)=>currentBilling(f.stripe,s,p,n,{
        budgetMs:15_000,requestTimeoutMs:5_000,maxNetworkRetries:0,
      }),now)).toBe("failed");
    expect((f.api.prices.list as any).mock.calls[0][1])
      .toEqual({timeout:5_000,maxNetworkRetries:0});
    expect(m.s.plan).toBe("pro");
    expect(m.writes).toBe(0);
  });
  it("eventual invoice omission cannot erase verified unexpired payment",async()=>{
    const f=fixtures(),m=memoryRepo();
    await synchronize(m.s.id,m.repo,(s,p,n)=>currentBilling(f.stripe,s,p,n),now);
    f.api.invoices.list.mockResolvedValue({has_more:false,data:[]});
    await synchronize(m.s.id,m.repo,(s,p,n)=>currentBilling(f.stripe,s,p,n),now+day);
    expect(m.s.plan).toBe("basic");
  });
  it("no subscriptions cannot revoke stored unexpired paid period",async()=>{
    const f=fixtures(),m=memoryRepo();
    await synchronize(m.s.id,m.repo,(s,p,n)=>currentBilling(f.stripe,s,p,n),now);
    f.api.subscriptions.list.mockResolvedValue({has_more:false,data:[]});
    await synchronize(m.s.id,m.repo,(s,p,n)=>currentBilling(f.stripe,s,p,n),now+day);
    expect(m.s.plan).toBe("basic");
  });
  it("cross-account concurrent processing uses the repository lock",async()=>{
    const m=memoryRepo(),f=fixtures();let release!:()=>void;
    const gate=new Promise<void>(r=>release=r);
    const first=synchronize(m.s.id,m.repo,async(s,p,n)=>{await gate;return currentBilling(f.stripe,s,p,n);},now);
    expect(await synchronize(m.s.id,m.repo,(s,p,n)=>currentBilling(f.stripe,s,p,n),now)).toBe("busy");
    release();await first;expect(m.writes).toBe(1);
  });
  it.each(["fixture_test_admin","fixture_test_baker"])("preserves intentional test access %s separately",id=>{
    const s=subject();s.id=id;s.plan="pro";s.customerId=null;
    expect(effective(s,"free",now,true)).toEqual({plan:"pro",source:"test"});
    expect(paying(s,null,now)).toBe(false);
  });
  it("unlinked existing Pro is not automatically downgraded or classified paid",async()=>{
    const m=memoryRepo();m.s.plan="pro";m.s.customerId=null;
    const fetch=vi.fn();
    await synchronize(m.s.id,m.repo,fetch,now);
    expect(fetch).not.toHaveBeenCalled();expect(m.s.plan).toBe("pro");
    expect(paying(m.s,m.billing,now)).toBe(false);
  });
  it("gift and survey entitlements are independent of billing base and expire normally",()=>{
    const s=subject();s.giftedPlan="pro";s.giftEnd=now+day;
    expect(effective(s,"free",now)).toEqual({plan:"pro",source:"gift"});
    expect(effective(s,"free",now+day).plan).toBe("free");
    s.surveyTrialEnd=now+day;
    expect(effective(s,"free",now)).toEqual({plan:"pro",source:"survey_trial"});
    s.administrativePlan="pro";
    expect(effective(s,"free",now+day)).toEqual({plan:"pro",source:"administrative"});
  });
});

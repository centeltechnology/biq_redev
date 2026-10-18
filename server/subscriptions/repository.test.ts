import { beforeAll, afterAll, beforeEach, describe, expect, it } from "vitest";
import type { Pool, PoolClient } from "pg";
import { readFile } from "node:fs/promises";
import { repository, diagnostics } from "./repository";
import { synchronize } from "./synchronizer";
import type { Snapshot } from "./provider";

// Optional database integration suite. Only connection-local TEMP tables are
// used, shadowing every table touched by the repository. No application rows.
describe.runIf(process.env.TEST_SUBSCRIPTION_DB === "1")("PostgreSQL atomic subscription persistence",()=>{
  let client:PoolClient,dbPool:Pool,tempPool:Pool;
  const now=Date.now();
  const snapshot:Snapshot={billing:{plan:"pro",status:"active",subscriptionId:"sub_fixture",
    paidThrough:now+86_400_000,trialEnd:null,cancelAtPeriodEnd:false},
    activities:[{invoiceId:"in_fixture",subscriptionId:"sub_fixture",plan:"pro"}]};
  beforeAll(async()=>{
    const {pool}=await import("../db");dbPool=pool;client=await pool.connect();
    await client.query(`CREATE TEMP TABLE bakers(
      id varchar PRIMARY KEY,plan text NOT NULL,stripe_customer_id text,stripe_subscription_id text,
      survey_trial_end_date timestamptz,gifted_plan text,gifted_plan_expires_at timestamptz,
      created_at timestamptz DEFAULT now())`);
    const migration=await readFile("migrations/20261016_subscription_sync.sql","utf8");
    await client.query(migration.replaceAll("CREATE TABLE IF NOT EXISTS","CREATE TEMP TABLE IF NOT EXISTS"));
    tempPool={
      connect:async()=>({query:client.query.bind(client),release:()=>{}}),
      query:client.query.bind(client),
    } as unknown as Pool;
  });
  beforeEach(async()=>{
    await client.query("TRUNCATE pg_temp.subscription_award_candidates,pg_temp.subscription_sync,pg_temp.subscription_sync_events,pg_temp.bakers");
    await client.query("INSERT INTO pg_temp.bakers(id,plan,stripe_customer_id) VALUES ('fixture_baker','free','cus_fixture')");
  });
  afterAll(async()=>{client?.release();await dbPool?.end();});
  it("commits plan and billing state together; duplicate invoices remain one candidate",async()=>{
    const repo=repository(tempPool);
    for(let i=0;i<2;i++) expect(await synchronize("fixture_baker",repo,async()=>snapshot,now)).toBe("synced");
    const state=await client.query("SELECT plan,stripe_subscription_id FROM pg_temp.bakers");
    expect(state.rows[0]).toEqual({plan:"pro",stripe_subscription_id:"sub_fixture"});
    expect((await client.query("SELECT count(*)::int AS n FROM pg_temp.subscription_award_candidates")).rows[0].n).toBe(1);
    const d=await diagnostics(tempPool,true);
    expect(d.proPaid).toBe(1);expect(d.mrr).toBe(9.99);
    expect(JSON.stringify(d)).not.toContain("cus_fixture");
  });
  it("a storage failure rolls back the plan and paid state, retaining a bounded error",async()=>{
    const broken={...snapshot,activities:[{invoiceId:"bad",subscriptionId:"sub",plan:"invalid"} as any]};
    expect(await synchronize("fixture_baker",repository(tempPool),async()=>broken,now)).toBe("failed");
    expect((await client.query("SELECT plan FROM pg_temp.bakers")).rows[0].plan).toBe("free");
    const s=(await client.query("SELECT attempts,error_code,billing_plan FROM pg_temp.subscription_sync")).rows[0];
    expect(s).toMatchObject({attempts:1,error_code:"PROVIDER_OR_STORAGE_UNAVAILABLE",billing_plan:"free"});
    expect((await client.query("SELECT count(*)::int AS n FROM pg_temp.subscription_award_candidates")).rows[0].n).toBe(0);
  });
  it("caps automatic retries and never downgrades in failure recording",async()=>{
    await client.query("UPDATE pg_temp.bakers SET plan='pro'");
    const repo=repository(tempPool);
    for(let i=0;i<8;i++) await repo.failure("fixture_baker","PROVIDER_OR_STORAGE_UNAVAILABLE",now);
    const s=(await client.query("SELECT attempts,next_attempt_at FROM pg_temp.subscription_sync")).rows[0];
    expect(s.attempts).toBe(5);expect(new Date(s.next_attempt_at).getTime()).toBeGreaterThan(now);
    expect((await client.query("SELECT plan FROM pg_temp.bakers")).rows[0].plan).toBe("pro");
  });
  it("only fresh successful reconciliation expires a paid base",async()=>{
    const repo=repository(tempPool);
    await synchronize("fixture_baker",repo,async()=>snapshot,now);
    const expired={...snapshot,billing:{...snapshot.billing,paidThrough:now-1000,status:"past_due"}};
    await synchronize("fixture_baker",repo,async()=>expired,now);
    expect((await client.query("SELECT plan FROM pg_temp.bakers")).rows[0].plan).toBe("free");
    expect((await diagnostics(tempPool,true)).paidSubscribers).toBe(0);
  });
  it("rolls back staged entitlement and candidate writes on cancellation before commit",async()=>{
    const controller=new AbortController();
    const repo=repository(tempPool,2_000,controller.signal);
    await expect(repo.locked("fixture_baker",async account=>{
      await account.save(snapshot,"pro","subscription",now);
      controller.abort();
    })).rejects.toThrow();
    expect((await client.query("SELECT plan FROM pg_temp.bakers")).rows[0].plan).toBe("free");
    expect((await client.query("SELECT count(*)::int n FROM pg_temp.subscription_sync")).rows[0].n).toBe(0);
    expect((await client.query("SELECT count(*)::int n FROM pg_temp.subscription_award_candidates")).rows[0].n).toBe(0);
  });
  it("recovers from a PostgreSQL statement timeout without an entitlement fallback",async()=>{
    const repo=repository(tempPool,100);
    await expect(repo.locked("fixture_baker",async()=>{
      await client.query("SELECT pg_sleep(0.2)");
    })).rejects.toMatchObject({code:"57014"});
    expect((await client.query("SELECT plan FROM pg_temp.bakers")).rows[0].plan).toBe("free");
    expect(await synchronize("fixture_baker",repository(tempPool,2_000),async()=>snapshot,now)).toBe("synced");
  });
});

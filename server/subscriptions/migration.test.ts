import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { readFile } from "node:fs/promises";
import type { Pool, PoolClient } from "pg";
import { getTableConfig, PgDialect } from "drizzle-orm/pg-core";
import { bakers, subscriptionSync, subscriptionAwardCandidates } from "../../shared/schema";

const migration = await readFile("migrations/20261016_subscription_sync.sql", "utf8");
const dialect = new PgDialect();
const normalized = (s: string) => s.replace(/"[^"]+"\./g, "").replaceAll('"', "")
  .replace(/\s+/g, "").toLowerCase();

describe("subscription SQL / Drizzle CHECK parity", () => {
  const cases = [
    { table: bakers, name: "bakers_administrative_plan_check",
      expression: "administrative_plan IS NULL OR administrative_plan IN ('basic','pro')" },
    { table: subscriptionSync, name: "subscription_sync_billing_plan_check",
      expression: "billing_plan IN ('free','basic','pro')" },
    { table: subscriptionAwardCandidates, name: "subscription_award_candidates_plan_check",
      expression: "plan IN ('basic','pro')" },
  ];
  for (const fixture of cases) {
    it(fixture.name, () => {
      const checks = getTableConfig(fixture.table).checks.filter(c => c.name === fixture.name);
      expect(checks).toHaveLength(1);
      expect(normalized(dialect.sqlToQuery(checks[0].value).sql))
        .toBe(normalized(fixture.expression));
      expect(normalized(migration)).toContain(normalized(`CHECK (${fixture.expression})`));
    });
  }
});

// Never use application tables: all DDL and fixtures are connection-local TEMPs.
describe.runIf(process.env.TEST_SUBSCRIPTION_DB === "1")("additive migration safety", () => {
  let pool: Pool, client: PoolClient;
  const temporaryMigration = migration.replaceAll("CREATE TABLE IF NOT EXISTS",
    "CREATE TEMP TABLE IF NOT EXISTS");
  const originals = [
    { id: "fixture_basic", plan: "basic", stripe_customer_id: "cus_fixture", stripe_subscription_id: "sub_fixture" },
    { id: "fixture_free", plan: "free", stripe_customer_id: null, stripe_subscription_id: null },
    { id: "fixture_test_a", plan: "pro", stripe_customer_id: null, stripe_subscription_id: null },
    { id: "fixture_test_b", plan: "pro", stripe_customer_id: null, stripe_subscription_id: null },
  ];
  beforeAll(async () => {
    ({ pool } = await import("../db"));
    client = await pool.connect();
    await client.query(`CREATE TEMP TABLE bakers(
      id varchar PRIMARY KEY,plan text NOT NULL,
      stripe_customer_id text,stripe_subscription_id text)`);
    for (const row of originals) await client.query(
      "INSERT INTO pg_temp.bakers VALUES($1,$2,$3,$4)", Object.values(row));
    await client.query(temporaryMigration);
  });
  afterAll(async () => { client?.release(true); await pool?.end(); });

  it("preserves all original fields, Free/Basic/Pro plans and both Pro fixtures", async () => {
    const rows = await client.query(
      "SELECT id,plan,stripe_customer_id,stripe_subscription_id FROM pg_temp.bakers ORDER BY id");
    expect(rows.rows).toEqual(originals);
    expect((await client.query(
      "SELECT count(*)::int n FROM pg_temp.bakers WHERE administrative_plan IS NOT NULL")).rows[0].n).toBe(0);
  });
  it("starts with three empty tables and tolerates reapplication without rewriting fixtures", async () => {
    for (const table of ["subscription_sync", "subscription_sync_events", "subscription_award_candidates"]) {
      expect((await client.query(`SELECT count(*)::int n FROM pg_temp.${table}`)).rows[0].n).toBe(0);
    }
    await client.query(temporaryMigration);
    expect((await client.query(
      "SELECT id,plan,stripe_customer_id,stripe_subscription_id FROM pg_temp.bakers ORDER BY id")).rows).toEqual(originals);
  });
  it("sets non-entitling queue defaults only on insertion", async () => {
    const result = await client.query(`INSERT INTO pg_temp.subscription_sync(baker_id)
      VALUES('fixture_free') RETURNING *`);
    expect(result.rows[0]).toMatchObject({ billing_plan: "free", cancel_at_period_end: false,
      entitlement_source: "unreconciled", needs_reconcile: true, attempts: 0 });
    expect(result.rows[0].next_attempt_at).toBeInstanceOf(Date);
  });
  it("enforces all three CHECK constraints and baker association", async () => {
    await expect(client.query("UPDATE pg_temp.bakers SET administrative_plan='invalid' WHERE id='fixture_free'"))
      .rejects.toMatchObject({ code: "23514" });
    await expect(client.query("UPDATE pg_temp.subscription_sync SET billing_plan='invalid'"))
      .rejects.toMatchObject({ code: "23514" });
    await expect(client.query(`INSERT INTO pg_temp.subscription_award_candidates
      VALUES('in_bad','fixture_free','sub_fixture','invalid','policy_review',now())`))
      .rejects.toMatchObject({ code: "23514" });
    await expect(client.query("INSERT INTO pg_temp.subscription_sync(baker_id) VALUES('absent')"))
      .rejects.toMatchObject({ code: "23503" });
  });
  it("enforces baker, event and invoice uniqueness", async () => {
    await expect(client.query("INSERT INTO pg_temp.subscription_sync(baker_id) VALUES('fixture_free')"))
      .rejects.toMatchObject({ code: "23505" });
    await client.query("INSERT INTO pg_temp.subscription_sync_events(event_id) VALUES('evt_fixture')");
    await expect(client.query("INSERT INTO pg_temp.subscription_sync_events(event_id) VALUES('evt_fixture')"))
      .rejects.toMatchObject({ code: "23505" });
    const insert = `INSERT INTO pg_temp.subscription_award_candidates
      VALUES('in_fixture','fixture_free','sub_fixture','basic','policy_review',now())`;
    await client.query(insert);
    await expect(client.query(insert)).rejects.toMatchObject({ code: "23505" });
  });
  it("cascades only to dependent sync/candidate fixtures on an explicit fixture deletion", async () => {
    await client.query("DELETE FROM pg_temp.bakers WHERE id='fixture_free'");
    for (const table of ["subscription_sync", "subscription_award_candidates"]) {
      expect((await client.query(`SELECT count(*)::int n FROM pg_temp.${table}`)).rows[0].n).toBe(0);
    }
    expect((await client.query("SELECT count(*)::int n FROM pg_temp.bakers WHERE plan='pro'")).rows[0].n).toBe(2);
  });
  it("rolls back every added object when the transaction is rolled back", async () => {
    const isolated = await pool.connect();
    try {
      await isolated.query("CREATE TEMP TABLE bakers(id varchar PRIMARY KEY,plan text)");
      await isolated.query("BEGIN");
      await isolated.query(temporaryMigration.replace(/^BEGIN;$/m, "").replace(/^COMMIT;$/m, ""));
      await isolated.query("ROLLBACK");
      expect((await isolated.query(`SELECT count(*)::int n FROM pg_attribute
        WHERE attrelid='pg_temp.bakers'::regclass AND attname='administrative_plan'
        AND NOT attisdropped`)).rows[0].n).toBe(0);
      expect((await isolated.query(`SELECT count(*)::int n FROM pg_class
        WHERE relnamespace=pg_my_temp_schema() AND relname IN
        ('subscription_sync','subscription_sync_events','subscription_award_candidates')`)).rows[0].n).toBe(0);
    } finally { isolated.release(true); }
  });
});

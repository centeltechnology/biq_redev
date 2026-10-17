import { describe, expect, it } from "vitest";
import { reconciliationBatchLock } from "./service";

describe.runIf(process.env.TEST_SUBSCRIPTION_DB === "1")("PostgreSQL cross-process batch exclusion", () => {
  it("excludes a second connection and releases the lock at transaction end without touching application tables", async () => {
    const { pool } = await import("../db");
    const first = await pool.connect();
    const second = await pool.connect();
    const acquire = "SELECT pg_try_advisory_xact_lock(hashtextextended($1,0)) AS acquired";
    try {
      await first.query("BEGIN");
      await second.query("BEGIN");
      expect((await first.query(acquire, [reconciliationBatchLock])).rows[0].acquired).toBe(true);
      expect((await second.query(acquire, [reconciliationBatchLock])).rows[0].acquired).toBe(false);
      await first.query("ROLLBACK");
      expect((await second.query(acquire, [reconciliationBatchLock])).rows[0].acquired).toBe(true);
      await second.query("ROLLBACK");
      await first.query("BEGIN");
      expect((await first.query(acquire, [reconciliationBatchLock])).rows[0].acquired).toBe(true);
    } finally {
      await first.query("ROLLBACK").catch(() => {});
      await second.query("ROLLBACK").catch(() => {});
      first.release();
      second.release();
      await pool.end();
    }
  });
});

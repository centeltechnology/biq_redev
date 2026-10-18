import { describe, expect, it, vi } from "vitest";
import type { PoolClient } from "pg";
import { claimCloudflareTriggerNonce } from "./cloudflare-trigger";

function fakePool(initial: Array<{ nonce: string; receivedAt: number }> = []) {
  let records = new Map(initial.map(row => [row.nonce, row.receivedAt]));
  let beforeTransaction = new Map(records);
  const client = {
    query: vi.fn(async (sql: string, values: unknown[] = []) => {
      if (sql === "BEGIN") beforeTransaction = new Map(records);
      if (sql.startsWith("DELETE FROM subscription_trigger_nonces")) {
        const expiry = Date.now() - 10 * 60_000;
        records = new Map([...records].filter(([, receivedAt]) => receivedAt >= expiry));
      }
      if (sql.startsWith("INSERT INTO subscription_trigger_nonces")) {
        const nonce = String(values[0]);
        if (records.has(nonce)) return { rowCount: 0, rows: [] };
        records.set(nonce, Date.now());
        return { rowCount: 1, rows: [{ nonce }] };
      }
      if (sql.includes("SELECT count(*)::int AS requests")) {
        const count = [...records.values()].filter(time => time >= Date.now() - 60_000).length;
        return { rowCount: 1, rows: [{ requests: count }] };
      }
      if (sql === "ROLLBACK") records = new Map(beforeTransaction);
      return { rowCount: 0, rows: [] };
    }),
    release: vi.fn(),
  };
  return {
    pool: { connect: vi.fn(async () => client) } as unknown as Pick<import("pg").Pool, "connect">,
    client,
    records: () => records,
  };
}

describe("Cloudflare trigger replay/rate-limit storage", () => {
  it("discards a connection whose failed rollback could retain a transaction lock", async () => {
    const release = vi.fn();
    const client = {
      query: vi.fn(async (sql: string) => {
        if (sql.startsWith("INSERT") || sql === "ROLLBACK") throw new Error("synthetic disconnected transaction");
        return { rows: [], rowCount: 0 };
      }),
      release,
    };
    await expect(claimCloudflareTriggerNonce({ connect: async () => client } as any,
      "00000000-0000-4000-8000-000000000001")).rejects.toThrow();
    expect(release).toHaveBeenCalledWith(true);
  });
  it("accepts each nonce once and rejects replay", async () => {
    const f = fakePool();
    expect(await claimCloudflareTriggerNonce(f.pool, "00000000-0000-4000-8000-000000000001")).toBe("accepted");
    expect(await claimCloudflareTriggerNonce(f.pool, "00000000-0000-4000-8000-000000000001")).toBe("replay");
    expect(f.records().size).toBe(1);
    expect(f.client.release).toHaveBeenCalledTimes(2);
  });

  it("rejects the fifth valid trigger within a minute without storing its nonce", async () => {
    const now = Date.now();
    const f = fakePool([1, 2, 3, 4].map(index => ({
      nonce: `00000000-0000-4000-8000-${String(index).padStart(12, "0")}`,
      receivedAt: now - 10_000,
    })));
    expect(await claimCloudflareTriggerNonce(f.pool, "00000000-0000-4000-8000-000000000005"))
      .toBe("rate_limited");
    expect(f.records().size).toBe(4);
  });
});

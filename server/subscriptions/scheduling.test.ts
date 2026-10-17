import { afterEach, beforeEach, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  query: vi.fn(), connect: vi.fn(), release: vi.fn(), stripe: vi.fn(),
  repo: vi.fn(), sync: vi.fn(), provider: vi.fn(),
}));
vi.mock("../db", () => ({ pool: { connect: mocks.connect } }));
vi.mock("../stripeClient", () => ({ getUncachableStripeClient: mocks.stripe }));
vi.mock("./repository", () => ({ repository: mocks.repo, diagnostics: vi.fn() }));
vi.mock("./synchronizer", () => ({ synchronize: mocks.sync }));
vi.mock("./provider", () => ({ currentBilling: mocks.provider }));

import { reconciliationTick, startSubscriptionReconciliation, enqueueVerifiedSubscriptionEvent } from "./service";

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubEnv("SUBSCRIPTION_SYNC_ENABLED", "true");
  vi.stubEnv("SUBSCRIPTION_SYNC_IN_PROCESS_ENABLED", "");
  mocks.connect.mockResolvedValue({ query: mocks.query, release: mocks.release });
  mocks.query.mockImplementation(async (sql: string) => {
    if (sql.includes("pg_try_advisory_xact_lock")) return { rows: [{ acquired: true }] };
    return { rows: [{ id: "synthetic_fixture" }] };
  });
  mocks.stripe.mockResolvedValue({});
  mocks.sync.mockResolvedValue("synced");
});
afterEach(() => { vi.unstubAllEnvs(); vi.restoreAllMocks(); });

it("the master gate off prevents all worker, provider and webhook queue access", async () => {
  vi.stubEnv("SUBSCRIPTION_SYNC_ENABLED", "");
  vi.stubEnv("SUBSCRIPTION_SYNC_IN_PROCESS_ENABLED", "true");
  startSubscriptionReconciliation();
  expect(await reconciliationTick()).toBeUndefined();
  await enqueueVerifiedSubscriptionEvent(Buffer.from("{}"));
  expect(mocks.connect).not.toHaveBeenCalled();
  expect(mocks.stripe).not.toHaveBeenCalled();
});

it.each(["", "false"])("enabling sync alone never starts the Autoscale timer (%s)", value => {
  vi.stubEnv("SUBSCRIPTION_SYNC_IN_PROCESS_ENABLED", value);
  const interval = vi.spyOn(globalThis, "setInterval");
  startSubscriptionReconciliation();
  expect(interval).not.toHaveBeenCalled();
  expect(mocks.connect).not.toHaveBeenCalled();
});

it.each([0, 1])("verified webhook queueing and event deduplication remain independent of the timer (claimed=%s)", async claimed => {
  mocks.query.mockImplementation(async (sql: string) => ({
    rows: [], rowCount: sql.includes("INSERT INTO subscription_sync_events") ? claimed : 0,
  }));
  await enqueueVerifiedSubscriptionEvent(Buffer.from(JSON.stringify({
    id: "evt_synthetic", type: "customer.subscription.updated",
    data: { object: { customer: "cus_synthetic" } },
  })));
  expect(mocks.query.mock.calls[0][0]).toBe("BEGIN");
  expect(mocks.query.mock.calls.at(-1)![0]).toBe("COMMIT");
  expect(mocks.query.mock.calls.filter(([sql]) => sql.includes("INSERT INTO subscription_sync(baker_id)"))).toHaveLength(claimed);
  expect(mocks.sync).not.toHaveBeenCalled();
  expect(mocks.stripe).not.toHaveBeenCalled();
  expect(mocks.query.mock.calls.some(([sql]) => /UPDATE bakers|INSERT INTO subscription_award_candidates/.test(sql))).toBe(false);
});

it("the scheduled entry point works with the in-process timer off and keeps existing candidate/retry bounds", async () => {
  expect(await reconciliationTick()).toEqual({ failed: false, processed: 1, skipped: false });
  const selection = mocks.query.mock.calls.find(([sql]) => sql.includes("SELECT b.id"))![0];
  expect(selection).toContain("LIMIT 20");
  expect(selection).toContain("COALESCE(s.attempts,0)<5");
  expect(selection).toContain("s.next_attempt_at<=now()");
  expect(mocks.sync).toHaveBeenCalledTimes(1);
  expect(mocks.query.mock.calls[0][0]).toBe("BEGIN");
  expect(mocks.query.mock.calls[1][0]).toContain("pg_try_advisory_xact_lock");
  expect(mocks.query.mock.calls.at(-1)![0]).toBe("ROLLBACK");
  expect(mocks.release).toHaveBeenCalledWith(false);
});

it("a competing process cannot select accounts or call Stripe", async () => {
  mocks.query.mockImplementation(async (sql: string) =>
    ({ rows: sql.includes("pg_try_advisory_xact_lock") ? [{ acquired: false }] : [] }));
  expect(await reconciliationTick()).toEqual({ failed: false, processed: 0, skipped: true });
  expect(mocks.query).toHaveBeenCalledTimes(3);
  expect(mocks.stripe).not.toHaveBeenCalled();
  expect(mocks.sync).not.toHaveBeenCalled();
  expect(mocks.release).toHaveBeenCalledWith(false);
});

it("a second local invocation cannot compete with the active batch", async () => {
  let releaseWork!: (value: string) => void;
  mocks.sync.mockImplementationOnce(() => new Promise(resolve => { releaseWork = resolve; }));
  const first = reconciliationTick();
  await vi.waitFor(() => expect(mocks.sync).toHaveBeenCalledTimes(1));
  expect(await reconciliationTick()).toBeUndefined();
  expect(mocks.connect).toHaveBeenCalledTimes(1);
  releaseWork("synced");
  expect((await first)?.failed).toBe(false);
});

it("reported reconciliation failures retain the normal lock cleanup and fail the batch", async () => {
  mocks.sync.mockResolvedValueOnce("failed");
  expect(await reconciliationTick()).toMatchObject({ failed: true, processed: 1 });
  expect(mocks.query.mock.calls.at(-1)![0]).toBe("ROLLBACK");
  expect(mocks.release).toHaveBeenCalledWith(false);
});

it("an unexpected failure releases the transaction lock and destroys the connection", async () => {
  mocks.stripe.mockRejectedValueOnce(new Error("synthetic provider outage"));
  expect((await reconciliationTick())?.failed).toBe(true);
  expect(mocks.query.mock.calls.at(-1)![0]).toBe("ROLLBACK");
  expect(mocks.release).toHaveBeenCalledWith(true);
  expect(mocks.sync).not.toHaveBeenCalled();
});

it("failed rollback discards the connection instead of leaking a lock into the pool", async () => {
  mocks.query.mockImplementation(async (sql: string) => {
    if (sql.includes("pg_try_advisory_xact_lock")) return { rows: [{ acquired: true }] };
    if (sql === "ROLLBACK") throw new Error("synthetic disconnect");
    return { rows: [] };
  });
  expect((await reconciliationTick())?.failed).toBe(true);
  expect(mocks.release).toHaveBeenCalledWith(true);
});

it("the legacy timer requires a second explicit opt-in", async () => {
  vi.stubEnv("SUBSCRIPTION_SYNC_IN_PROCESS_ENABLED", "true");
  const unref = vi.fn();
  const interval = vi.spyOn(globalThis, "setInterval").mockReturnValue({ unref } as any);
  startSubscriptionReconciliation();
  await vi.waitFor(() => expect(mocks.release).toHaveBeenCalled());
  expect(interval).toHaveBeenCalledWith(expect.any(Function), 60_000);
  expect(unref).toHaveBeenCalledOnce();
});

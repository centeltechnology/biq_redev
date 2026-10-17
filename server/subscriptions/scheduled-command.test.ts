import { afterEach, beforeEach, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ enabled: vi.fn(), tick: vi.fn(), end: vi.fn() }));
vi.mock("./service", () => ({ syncEnabled: mocks.enabled, reconciliationTick: mocks.tick }));
vi.mock("../db", () => ({ pool: { end: mocks.end } }));
const previousExitCode = process.exitCode;

beforeEach(() => {
  vi.resetModules();
  vi.clearAllMocks();
  process.exitCode = undefined;
  mocks.enabled.mockReturnValue(true);
  mocks.end.mockResolvedValue(undefined);
  vi.spyOn(console, "log").mockImplementation(() => {});
  vi.spyOn(console, "error").mockImplementation(() => {});
});
afterEach(() => { process.exitCode = previousExitCode; vi.restoreAllMocks(); });

async function run() {
  await import("../../script/reconcile-subscriptions");
  await vi.waitFor(() => expect(mocks.end).toHaveBeenCalledOnce());
}

it("the disabled command fails closed without running a batch", async () => {
  mocks.enabled.mockReturnValue(false);
  await run();
  expect(mocks.tick).not.toHaveBeenCalled();
  expect(process.exitCode).toBe(1);
});

it.each([
  { failed: true, processed: 1, skipped: false },
  { failed: false, processed: 0, skipped: true },
  undefined,
])("an incomplete or overlapping run exits nonzero for scheduler failure alerts (%j)", async result => {
  mocks.tick.mockResolvedValue(result);
  await run();
  expect(process.exitCode).toBe(1);
});

it("a complete bounded batch logs safe aggregate progress and exits successfully", async () => {
  mocks.tick.mockResolvedValue({ failed: false, processed: 3, skipped: false });
  await run();
  expect(process.exitCode).toBeUndefined();
  expect(console.log).toHaveBeenCalledWith(expect.stringContaining("3 accounts checked"));
});

import { afterEach, expect, it, vi } from "vitest";
import { connectWithTimeout } from "./bounded-pool";

afterEach(() => vi.useRealTimers());

it("bounds pool checkout and releases a client granted after timeout", async () => {
  vi.useFakeTimers();
  let resolveConnect!: (client: any) => void;
  const release = vi.fn();
  const pending = new Promise(resolve => { resolveConnect = resolve; });
  const dbPool = { connect: vi.fn(() => pending) };
  const result = connectWithTimeout(dbPool as any, 2_000);
  const rejected = expect(result).rejects.toThrow("checkout timed out");
  await vi.advanceTimersByTimeAsync(2_000);
  await rejected;
  resolveConnect({ release });
  await Promise.resolve();
  await Promise.resolve();
  expect(release).toHaveBeenCalledOnce();
});

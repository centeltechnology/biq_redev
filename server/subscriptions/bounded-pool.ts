import type { Pool, PoolClient } from "pg";

// Bound pool checkout for the synchronous HTTP trigger. If the pool grants the
// client after the caller has timed out, release it immediately instead of
// leaking an unused connection.
export async function connectWithTimeout(
  dbPool: Pick<Pool, "connect">,
  timeoutMs: number,
): Promise<PoolClient> {
  let timedOut = false;
  let timer: NodeJS.Timeout | undefined;
  const pending = dbPool.connect();
  void pending.then(client => {
    if (timedOut) client.release();
  }, () => {});
  try {
    return await Promise.race([
      pending,
      new Promise<never>((_resolve, reject) => {
        timer = setTimeout(() => {
          timedOut = true;
          reject(new Error("Database connection checkout timed out"));
        }, timeoutMs);
      }),
    ]);
  } catch (error) {
    timedOut = true;
    throw error;
  } finally {
    if (timer) clearTimeout(timer);
  }
}

import { expect, it, vi } from "vitest";
import { triggerOnce } from "../../script/trigger-subscription-sync-once";

const env = { CLOUDFLARE_SUBSCRIPTION_TRIGGER_SECRET: "synthetic-secret-32-or-more-bytes-long" };

it("requires explicit operator mode and never sends without it or without a secret", async () => {
  const send = vi.fn();
  await expect(triggerOnce([], env, send)).rejects.toThrow("Choose");
  await expect(triggerOnce(["--single-run"], env, send)).rejects.toThrow("Choose");
  await expect(triggerOnce(["--disabled-check"], {}, send)).rejects.toThrow("secret");
  expect(send).not.toHaveBeenCalled();
});

it("performs exactly one authenticated disabled check using the shared signer", async () => {
  const send = vi.fn(async () => new Response(JSON.stringify({
    message: "Subscription synchronization is disabled",
  }), { status: 503 }));
  await triggerOnce(["--disabled-check"], env, send);
  expect(send).toHaveBeenCalledOnce();
  expect(send.mock.calls[0][0]).toMatchObject({ SUBSCRIPTION_CRON_ENABLED: "false" });
  expect(send.mock.calls[0][4]).toBe(true);
});

it("allows one approved account request and never automatically retries a failure", async () => {
  const send = vi.fn(async () => new Response("{}", { status: 503 }));
  await expect(triggerOnce(["--single-run", "--confirm-entitlement-write"], env, send))
    .rejects.toThrow("do not retry blindly");
  expect(send).toHaveBeenCalledOnce();
  send.mockResolvedValueOnce(new Response(JSON.stringify({ ok: true, processed: 1 })));
  await triggerOnce(["--single-run", "--confirm-entitlement-write"], env, send);
  expect(send).toHaveBeenCalledTimes(2);
});

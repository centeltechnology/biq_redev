import webpush from "web-push";
import { storage } from "./storage";

const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY;
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY;
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || "mailto:support@bakeriq.app";

let configured = false;
if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
  try {
    webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
    configured = true;
  } catch (err) {
    console.error("[Push] Failed to configure VAPID details:", err);
  }
} else {
  console.warn("[Push] VAPID keys not set — push notifications disabled.");
}

export function isPushConfigured(): boolean {
  return configured;
}

export function getVapidPublicKey(): string | null {
  return VAPID_PUBLIC_KEY || null;
}

export interface PushPayload {
  title: string;
  body: string;
  url?: string;
  tag?: string;
}

/**
 * Send a push notification to every device a baker has registered.
 * Dead subscriptions (404/410) are pruned automatically. Fire-and-forget safe.
 */
export async function sendPushToBaker(bakerId: string, payload: PushPayload): Promise<void> {
  if (!configured) return;

  let subs;
  try {
    subs = await storage.getPushSubscriptionsByBaker(bakerId);
  } catch (err) {
    console.error("[Push] Failed to load subscriptions:", err);
    return;
  }
  if (!subs.length) return;

  const body = JSON.stringify({
    title: payload.title,
    body: payload.body,
    url: payload.url || "/dashboard",
    tag: payload.tag,
  });

  await Promise.all(
    subs.map(async (sub) => {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          body
        );
      } catch (err: any) {
        const status = err?.statusCode;
        if (status === 404 || status === 410) {
          // Subscription expired or was revoked on the device — clean it up.
          await storage.deletePushSubscriptionByEndpoint(sub.endpoint).catch(() => {});
        } else {
          console.error("[Push] Send failed:", status, err?.body || err?.message);
        }
      }
    })
  );
}

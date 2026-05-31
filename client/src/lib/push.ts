import { apiRequest } from "./queryClient";

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

/** Browser supports Service Workers + the Push API. */
export function isPushSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window
  );
}

/** True when running as an installed PWA (standalone display mode). */
export function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia?.("(display-mode: standalone)").matches ||
    // iOS Safari exposes this non-standard flag for home-screen apps.
    (window.navigator as any).standalone === true
  );
}

/** Rough iOS detection (covers iPadOS reporting as Mac with touch). */
export function isIOS(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent || "";
  const iOSDevice = /iPad|iPhone|iPod/.test(ua);
  const iPadOS = navigator.platform === "MacIntel" && (navigator as any).maxTouchPoints > 1;
  return iOSDevice || iPadOS;
}

/**
 * On iOS, Web Push only works when the app has been added to the home screen.
 * Returns true when we should show the "install first" hint instead of a toggle.
 */
export function needsIOSInstall(): boolean {
  return isIOS() && !isStandalone();
}

export async function getCurrentSubscription(): Promise<globalThis.PushSubscription | null> {
  if (!isPushSupported()) return null;
  const reg = await navigator.serviceWorker.ready;
  return reg.pushManager.getSubscription();
}

export async function isSubscribed(): Promise<boolean> {
  const sub = await getCurrentSubscription();
  return !!sub;
}

/**
 * Ask for permission, subscribe via the SW, and persist on the server.
 * Throws on permission denial or any failure so the caller can surface it.
 */
export async function subscribeToPush(): Promise<void> {
  if (!isPushSupported()) {
    throw new Error("Push notifications aren't supported on this device.");
  }

  const permission = await Notification.requestPermission();
  if (permission !== "granted") {
    throw new Error("Notification permission was not granted.");
  }

  const keyRes = await apiRequest("GET", "/api/push/public-key");
  const { publicKey } = await keyRes.json();
  if (!publicKey) {
    throw new Error("Push notifications aren't configured on the server.");
  }

  const reg = await navigator.serviceWorker.ready;
  const existing = await reg.pushManager.getSubscription();
  const subscription =
    existing ||
    (await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey),
    }));

  const json = subscription.toJSON();
  await apiRequest("POST", "/api/push/subscribe", {
    endpoint: subscription.endpoint,
    keys: {
      p256dh: json.keys?.p256dh,
      auth: json.keys?.auth,
    },
  });
}

/** Unsubscribe on the device and remove the record from the server. */
export async function unsubscribeFromPush(): Promise<void> {
  const subscription = await getCurrentSubscription();
  if (!subscription) return;

  const endpoint = subscription.endpoint;
  try {
    await subscription.unsubscribe();
  } finally {
    await apiRequest("POST", "/api/push/unsubscribe", { endpoint });
  }
}

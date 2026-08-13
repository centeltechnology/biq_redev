// Activation journey event tracking.
// - trackActivationEvent: authenticated baker actions (sent once per session per key)
// - trackPublicActivationEvent: public calculator page events attributed to the
//   baker who owns the page (server distinguishes baker-own vs external visits)

const PUBLIC_SESSION_KEY = "bakeriq_session_id";

function getPublicSessionId(): string {
  try {
    let id = localStorage.getItem(PUBLIC_SESSION_KEY);
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem(PUBLIC_SESSION_KEY, id);
    }
    return id;
  } catch {
    try {
      return crypto.randomUUID();
    } catch {
      return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    }
  }
}

function dedupeKey(name: string): string {
  return `bakeriq_activation:${name}`;
}

// Fire an authenticated activation event at most once per browser session
// (guards against re-renders and refreshes).
export function trackActivationEvent(eventType: string, dedupeSuffix?: string) {
  const key = dedupeKey(`${eventType}${dedupeSuffix ? `:${dedupeSuffix}` : ""}`);
  try {
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, "1");
  } catch {
    // continue without dedupe if sessionStorage unavailable
  }
  fetch("/api/activity/track", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ eventType }),
  }).catch(() => {});
}

// Fire a public calculator activation event (visit / inquiry started).
// Client-side dedupe: once per slug+event per 30 minutes; server also dedupes.
export function trackPublicActivationEvent(
  slug: string,
  eventType: "calculator_visited" | "inquiry_started"
) {
  if (!slug) return;
  const key = dedupeKey(`public:${eventType}:${slug}`);
  const now = Date.now();
  try {
    const last = Number(localStorage.getItem(key) || 0);
    if (last && now - last < 30 * 60 * 1000) return;
    localStorage.setItem(key, String(now));
  } catch {
    // continue without dedupe
  }
  fetch("/api/public/activation-event", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ slug, sessionId: getPublicSessionId(), eventType }),
  }).catch(() => {});
}

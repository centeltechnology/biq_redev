const SESSION_KEY = "bakeriq_session_id";
const CALC_TRACKED_KEY = "bakeriq_calc_tracked";
const CALC_VISIBLE_KEY = "bakeriq_calc_visible";

function generateId(): string {
  try {
    return crypto.randomUUID();
  } catch {
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
    });
  }
}

function getSessionId(): string {
  try {
    let id = localStorage.getItem(SESSION_KEY);
    if (!id) {
      id = generateId();
      localStorage.setItem(SESSION_KEY, id);
    }
    return id;
  } catch {
    return generateId();
  }
}

function trackEvent(eventType: string, pagePath?: string) {
  try {
    const body = {
      eventType,
      pagePath: pagePath ?? window.location.pathname,
      sessionId: getSessionId(),
      referrer: document.referrer || null,
      userAgent: navigator.userAgent,
    };
    fetch("/api/analytics/event", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }).catch(() => {});
  } catch {
  }
}

export function trackPageView() {
  trackEvent("page_view");
}

export function trackCalculatorUsed() {
  try {
    const sid = getSessionId();
    const key = `${CALC_TRACKED_KEY}:${sid}`;
    if (localStorage.getItem(key)) return;
    localStorage.setItem(key, "1");
  } catch {
  }
  trackEvent("calculator_used");
}

export function trackSignupClick(pagePath?: string) {
  trackEvent("signup_click", pagePath);
}

export function trackAccountCreated() {
  trackEvent("account_created");
}

let servingsDebounceTimer: ReturnType<typeof setTimeout> | null = null;
export function trackServingsChanged() {
  if (servingsDebounceTimer) return;
  trackEvent("servings_changed");
  servingsDebounceTimer = setTimeout(() => {
    servingsDebounceTimer = null;
  }, 2000);
}

let designDebounceTimer: ReturnType<typeof setTimeout> | null = null;
export function trackDesignLevelChanged() {
  if (designDebounceTimer) return;
  trackEvent("design_level_changed");
  designDebounceTimer = setTimeout(() => {
    designDebounceTimer = null;
  }, 2000);
}

export function trackCalculatorVisible() {
  try {
    const sid = getSessionId();
    const key = `${CALC_VISIBLE_KEY}:${sid}`;
    if (localStorage.getItem(key)) return;
    localStorage.setItem(key, "1");
  } catch {
  }
  trackEvent("calculator_visible");
}

export function trackCtaClick(label: string) {
  trackEvent("cta_click", `${window.location.pathname}#${label}`);
}

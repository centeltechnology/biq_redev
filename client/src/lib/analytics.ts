const SESSION_KEY = "bakeriq_session_id";
const CALC_TRACKED_KEY = "bakeriq_calc_tracked";
const CALC_VISIBLE_KEY = "bakeriq_calc_visible";

const INTERNAL_ROUTE_PREFIXES = ["/admin", "/dashboard", "/login", "/settings", "/app", "/onboarding", "/payments", "/pricing", "/share", "/quotes", "/leads", "/customers", "/orders", "/signup"];

function isMarketingRoute(path?: string): boolean {
  const p = path ?? window.location.pathname;
  return !INTERNAL_ROUTE_PREFIXES.some(prefix => p === prefix || p.startsWith(prefix + "/"));
}

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
  if (!isMarketingRoute()) return;
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

export function trackExampleButtonUsed(label: string) {
  trackEvent("example_button_used", `${window.location.pathname}#${label}`);
}

let priceRecalcDebounce: ReturnType<typeof setTimeout> | null = null;
export function trackPriceRecalculated() {
  if (priceRecalcDebounce) return;
  trackEvent("price_recalculated");
  priceRecalcDebounce = setTimeout(() => {
    priceRecalcDebounce = null;
  }, 2000);
}

export function trackDmReplyCopied() {
  trackEvent("dm_reply_copied");
}

export function trackOrderLinkCopied() {
  trackEvent("order_link_copied");
}

export function trackOrderPagePreviewed() {
  trackEvent("order_page_previewed");
}

export function trackStripeEnableClicked() {
  trackEvent("stripe_enable_clicked");
}

export function trackPricingReviewClicked() {
  trackEvent("pricing_review_clicked");
}

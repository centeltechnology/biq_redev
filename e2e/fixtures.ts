export const TEST_BAKER = {
  email: "e2e-responsive@bakeriq.test",
  password: "E2eResp!2026",
  businessName: "E2E Responsive Bakery",
  slug: "e2e-responsive-bakery",
};

export const LIST_PAGES = [
  { path: "/quotes", card: "quote-card", row: "quote-row" },
  { path: "/leads", card: "lead-card", row: "lead-row" },
  { path: "/customers", card: "customer-card", row: "customer-row" },
  { path: "/payments", card: "payment-card", row: "payment-row" },
] as const;

export const MOBILE = { width: 375, height: 720 };
export const DESKTOP = { width: 1280, height: 800 };

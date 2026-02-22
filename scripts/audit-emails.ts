import { getConditionalOnboardingTemplate } from "../server/email";
import { buildAppUrl, getCanonicalAppUrl, validateEmailUrls } from "../server/url";

const KNOWN_ROUTE_PREFIXES = [
  "/", "/login", "/signup", "/dashboard", "/leads", "/quotes", "/customers",
  "/calendar", "/pricing", "/pricing-calculator", "/payments", "/referrals",
  "/refer", "/share", "/settings", "/admin", "/c/", "/q/", "/verify-email",
  "/terms", "/privacy", "/feedback", "/partners", "/email-preferences/",
  "/help", "/faq", "/onboarding", "/forgot-password", "/reset-password",
  "/join/", "/unsubscribe",
];

function extractUrls(text: string): string[] {
  const urlRegex = /https?:\/\/[^\s"'<>]+/g;
  return [...new Set(text.match(urlRegex) || [])];
}

function isKnownPath(pathname: string): boolean {
  const clean = pathname.replace(/\/$/, "") || "/";
  return KNOWN_ROUTE_PREFIXES.some(prefix => clean === prefix || clean.startsWith(prefix));
}

interface AuditResult {
  template: string;
  urls: { url: string; host: string; path: string; hostOk: boolean; pathOk: boolean }[];
  pass: boolean;
}

function auditTemplate(name: string, rendered: string): AuditResult {
  const urls = extractUrls(rendered);
  const canonicalHost = (() => {
    try { return new URL(getCanonicalAppUrl()).host; } catch { return "bakeriq.app"; }
  })();

  const results = urls.map(url => {
    try {
      const parsed = new URL(url);
      const host = parsed.host.toLowerCase();
      const hostOk = host === canonicalHost || host === "bakeriq.app";
      const pathOk = isKnownPath(parsed.pathname);
      return { url, host, path: parsed.pathname, hostOk, pathOk };
    } catch {
      return { url, host: "INVALID", path: "INVALID", hostOk: false, pathOk: false };
    }
  });

  const validation = validateEmailUrls(rendered, name);
  const pass = validation.valid && results.every(r => r.hostOk && r.pathOk);

  return { template: name, urls: results, pass };
}

function printReport(results: AuditResult[]) {
  const canonicalUrl = getCanonicalAppUrl();
  console.log("\n========================================");
  console.log("  BakerIQ Email Link Audit Report");
  console.log(`  Canonical URL: ${canonicalUrl}`);
  console.log("========================================\n");

  let totalTemplates = 0;
  let passedTemplates = 0;
  let totalUrls = 0;
  let badUrls = 0;

  for (const result of results) {
    totalTemplates++;
    if (result.pass) passedTemplates++;

    const status = result.pass ? "PASS" : "FAIL";
    console.log(`[${status}] ${result.template}`);

    for (const u of result.urls) {
      totalUrls++;
      const hostIcon = u.hostOk ? "OK" : "BAD";
      const pathIcon = u.pathOk ? "OK" : "BAD";
      if (!u.hostOk || !u.pathOk) badUrls++;
      console.log(`  ${u.url}`);
      console.log(`    Host: ${hostIcon} (${u.host})  Path: ${pathIcon} (${u.path})`);
    }

    if (result.urls.length === 0) {
      console.log("  (no URLs found)");
    }
    console.log("");
  }

  console.log("========================================");
  console.log(`  Templates: ${passedTemplates}/${totalTemplates} passed`);
  console.log(`  URLs: ${totalUrls - badUrls}/${totalUrls} valid`);
  console.log("========================================\n");

  if (badUrls > 0) {
    process.exit(1);
  }
}

function runAudit() {
  const results: AuditResult[] = [];
  const mockBaseUrl = getCanonicalAppUrl();

  const onboardingDays = [0, 1, 2, 3, 4, 5, 6];
  for (const day of onboardingDays) {
    for (const stripeConnected of [true, false]) {
      const template = getConditionalOnboardingTemplate(day, stripeConnected);
      if (!template) continue;

      const rendered = template.content
        .replace(/\{\{baseUrl\}\}/g, mockBaseUrl)
        + ` <a href="${mockBaseUrl}${template.ctaUrl}">${template.ctaText}</a>`;

      const name = `onboarding/${template.emailKey}`;
      results.push(auditTemplate(name, rendered));
    }
  }

  const mockFooterHtml = `
    <a href="${buildAppUrl("/email-preferences/test-token")}">Manage</a>
    <a href="${buildAppUrl("/")}">BakerIQ</a>
  `;
  results.push(auditTemplate("footer/baker_email", mockFooterHtml));

  const mockCustomerFooter = `<a href="${buildAppUrl("/")}">BakerIQ</a>`;
  results.push(auditTemplate("footer/customer_email", mockCustomerFooter));

  const milestones = ["pricing_live", "first_lead", "first_quote", "first_payment"];
  const milestonePaths: Record<string, string> = {
    pricing_live: "/share",
    first_lead: "/leads",
    first_quote: "/quotes",
    first_payment: "/dashboard",
  };
  for (const m of milestones) {
    const rendered = `<a href="${buildAppUrl(milestonePaths[m])}">${m}</a>`;
    results.push(auditTemplate(`milestone/${m}`, rendered));
  }

  const announcementRendered = `
    <a href="${buildAppUrl("/login")}">Log In</a>
  `;
  results.push(auditTemplate("announcement/feature_update", announcementRendered));

  const adminEmailRendered = `
    <a href="${buildAppUrl("/login")}">Log In</a>
    <a href="${buildAppUrl("/c/test-baker")}">Calculator</a>
    <a href="${buildAppUrl("/join/r/abc123")}">Referral</a>
  `;
  results.push(auditTemplate("admin/dynamic_email", adminEmailRendered));

  const partnerRendered = `
    <a href="${buildAppUrl("/")}">BakerIQ</a>
    <a href="${buildAppUrl("/admin")}">Admin</a>
  `;
  results.push(auditTemplate("partner/application_confirmation", partnerRendered));
  results.push(auditTemplate("partner/admin_notification", partnerRendered));

  const retentionTemplateLinks = [
    { name: "retention/configured_not_shared", path: "/pricing" },
    { name: "retention/configured_not_shared_2", path: "/settings" },
    { name: "retention/leads_no_quotes", path: "/leads" },
    { name: "retention/quotes_no_orders", path: "/calendar" },
    { name: "retention/active_power_user", path: "/dashboard" },
    { name: "retention/at_risk_we_miss_you", path: "/login" },
    { name: "retention/at_risk_check_in", path: "/help" },
    { name: "retention/survey_invitation", path: "/feedback" },
  ];
  for (const t of retentionTemplateLinks) {
    const rendered = `<a href="${buildAppUrl(t.path)}">${t.name}</a>`;
    results.push(auditTemplate(t.name, rendered));
  }

  printReport(results);
}

runAudit();

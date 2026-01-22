import { db } from "./db";
import { retentionEmailTemplates, retentionEmailSends, type RetentionEmailTemplate } from "@shared/schema";
import { eq, and, desc } from "drizzle-orm";
import { getBakersEligibleForRetentionEmail, type UserSegmentResult } from "./segmentation";
import { sendRetentionEmail } from "./email";

interface PersonalizationTokens {
  first_name: string;
  business_name: string;
  quick_quote_url: string;
  dashboard_url: string;
  login_url: string;
  unsubscribe_url: string;
}

export function renderTemplate(
  template: string,
  tokens: PersonalizationTokens
): string {
  let result = template;
  result = result.replace(/\{\{first_name\}\}/g, tokens.first_name);
  result = result.replace(/\{\{business_name\}\}/g, tokens.business_name);
  result = result.replace(/\{\{quick_quote_url\}\}/g, tokens.quick_quote_url);
  result = result.replace(/\{\{dashboard_url\}\}/g, tokens.dashboard_url);
  result = result.replace(/\{\{login_url\}\}/g, tokens.login_url);
  result = result.replace(/\{\{unsubscribe_url\}\}/g, tokens.unsubscribe_url);
  return result;
}

export async function getTemplateForSegment(segment: string): Promise<RetentionEmailTemplate | null> {
  const [template] = await db
    .select()
    .from(retentionEmailTemplates)
    .where(and(
      eq(retentionEmailTemplates.segment, segment),
      eq(retentionEmailTemplates.isActive, true)
    ))
    .orderBy(desc(retentionEmailTemplates.priority))
    .limit(1);
  return template || null;
}

export async function sendRetentionEmailToUser(
  user: UserSegmentResult,
  template: RetentionEmailTemplate,
  baseUrl: string
): Promise<{ success: boolean; error?: string }> {
  const tokens: PersonalizationTokens = {
    first_name: user.firstName,
    business_name: user.businessName,
    quick_quote_url: `${baseUrl}/c/${user.slug}`,
    dashboard_url: `${baseUrl}/dashboard`,
    login_url: `${baseUrl}/login`,
    unsubscribe_url: `${baseUrl}/unsubscribe?email=${encodeURIComponent(user.email)}`,
  };

  const subject = renderTemplate(template.subject, tokens);
  const bodyHtml = renderTemplate(template.bodyHtml, tokens);
  const bodyText = renderTemplate(template.bodyText, tokens);
  const ctaUrl = `${baseUrl}${template.ctaRoute}`;

  try {
    await sendRetentionEmail(
      user.email,
      subject,
      bodyHtml,
      bodyText
    );

    await db.insert(retentionEmailSends).values({
      bakerId: user.bakerId,
      templateId: template.id,
      segment: user.segment,
      status: "sent",
    });

    return { success: true };
  } catch (error: any) {
    console.error(`Failed to send retention email to ${user.email}:`, error);

    await db.insert(retentionEmailSends).values({
      bakerId: user.bakerId,
      templateId: template.id,
      segment: user.segment,
      status: "failed",
      error: error.message || "Unknown error",
    });

    return { success: false, error: error.message };
  }
}

export async function runRetentionEmailScheduler(): Promise<{
  processed: number;
  sent: number;
  failed: number;
  skipped: number;
}> {
  console.log("[Retention Scheduler] Starting weekly retention email run...");

  const baseUrl = process.env.NODE_ENV === "production"
    ? (process.env.REPLIT_DOMAINS
        ? `https://${process.env.REPLIT_DOMAINS.split(",")[0]}`
        : "https://bakeriq.app")
    : (process.env.REPLIT_DEV_DOMAIN
        ? `https://${process.env.REPLIT_DEV_DOMAIN}`
        : "https://bakeriq.app");

  const eligibleUsers = await getBakersEligibleForRetentionEmail();
  console.log(`[Retention Scheduler] Found ${eligibleUsers.length} eligible users`);

  let sent = 0;
  let failed = 0;
  let skipped = 0;

  for (const user of eligibleUsers) {
    const template = await getTemplateForSegment(user.segment);
    if (!template) {
      console.log(`[Retention Scheduler] No template for segment "${user.segment}", skipping ${user.email}`);
      skipped++;
      continue;
    }

    const result = await sendRetentionEmailToUser(user, template, baseUrl);
    if (result.success) {
      sent++;
      console.log(`[Retention Scheduler] Sent "${template.name}" to ${user.email} (segment: ${user.segment})`);
    } else {
      failed++;
      console.error(`[Retention Scheduler] Failed to send to ${user.email}: ${result.error}`);
    }

    await new Promise(resolve => setTimeout(resolve, 100));
  }

  console.log(`[Retention Scheduler] Completed: ${sent} sent, ${failed} failed, ${skipped} skipped`);

  return {
    processed: eligibleUsers.length,
    sent,
    failed,
    skipped,
  };
}

const RETENTION_INTERVAL_MS = 7 * 24 * 60 * 60 * 1000; // Weekly (7 days)
const INITIAL_DELAY_MS = 60 * 60 * 1000; // 1 hour after server start

export function startRetentionScheduler(baseUrl: string) {
  console.log("[Retention] Starting retention email scheduler");
  
  // Run once after initial delay
  setTimeout(async () => {
    console.log("[Retention] Running initial retention email check...");
    try {
      const result = await runRetentionEmailScheduler(baseUrl);
      console.log(`[Retention] Initial check completed: ${result.processed} processed, ${result.sent} sent`);
    } catch (error) {
      console.error("[Retention] Initial check failed:", error);
    }
    
    // Then run on weekly interval
    setInterval(async () => {
      console.log("[Retention] Running weekly retention email check...");
      try {
        const result = await runRetentionEmailScheduler(baseUrl);
        console.log(`[Retention] Weekly check completed: ${result.processed} processed, ${result.sent} sent`);
      } catch (error) {
        console.error("[Retention] Weekly check failed:", error);
      }
    }, RETENTION_INTERVAL_MS);
  }, INITIAL_DELAY_MS);
}

export async function getRetentionEmailStats(): Promise<{
  totalSent: number;
  sentLast7Days: number;
  sentLast30Days: number;
  openRate: number;
  clickRate: number;
  bySegment: Record<string, { sent: number; opened: number; clicked: number }>;
}> {
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const allSends = await db.select().from(retentionEmailSends);

  const sentEmails = allSends.filter(s => s.status === "sent");
  const totalSent = sentEmails.length;
  const sentLast7Days = sentEmails.filter(s => s.sentAt >= sevenDaysAgo).length;
  const sentLast30Days = sentEmails.filter(s => s.sentAt >= thirtyDaysAgo).length;

  const opened = sentEmails.filter(s => s.openedAt).length;
  const clicked = sentEmails.filter(s => s.clickedAt).length;

  const openRate = totalSent > 0 ? (opened / totalSent) * 100 : 0;
  const clickRate = totalSent > 0 ? (clicked / totalSent) * 100 : 0;

  const bySegment: Record<string, { sent: number; opened: number; clicked: number }> = {};
  for (const send of sentEmails) {
    if (!bySegment[send.segment]) {
      bySegment[send.segment] = { sent: 0, opened: 0, clicked: 0 };
    }
    bySegment[send.segment].sent++;
    if (send.openedAt) bySegment[send.segment].opened++;
    if (send.clickedAt) bySegment[send.segment].clicked++;
  }

  return {
    totalSent,
    sentLast7Days,
    sentLast30Days,
    openRate,
    clickRate,
    bySegment,
  };
}

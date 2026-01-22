import { db } from "./db";
import { bakers, leads, quotes, orders, userActivityEvents, retentionEmailSends, bakerOnboardingEmails } from "@shared/schema";
import { eq, and, gte, lte, sql, desc, count } from "drizzle-orm";
import type { RetentionSegment } from "@shared/schema";

export interface UserSegmentResult {
  bakerId: string;
  segment: RetentionSegment;
  businessName: string;
  email: string;
  firstName: string;
  slug: string;
  createdAt: Date;
  lastActivityAt: Date | null;
  metrics: {
    loginCount7d: number;
    loginCount14d: number;
    leadCount: number;
    quoteCount: number;
    sentQuoteCount: number;
    orderCount: number;
    hasConfiguredCalculator: boolean;
    hasSharedLink: boolean;
    keyActionCount7d: number;
    keyActionCount14d: number;
  };
}

const KEY_ACTIONS = [
  "quick_quote_configured",
  "quick_quote_link_copied",
  "quick_quote_link_shared",
  "pricing_item_added",
  "pricing_item_updated",
  "lead_status_updated",
  "quote_created",
  "quote_sent",
  "order_scheduled",
  "featured_item_added",
] as const;

export async function getUserMetrics(bakerId: string): Promise<UserSegmentResult["metrics"]> {
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

  const [
    loginCount7d,
    loginCount14d,
    leadCountResult,
    quoteCountResult,
    sentQuoteCountResult,
    orderCountResult,
    calcConfiguredResult,
    sharedLinkResult,
    keyActionCount7dResult,
    keyActionCount14dResult,
  ] = await Promise.all([
    db.select({ count: sql<number>`count(*)` })
      .from(userActivityEvents)
      .where(and(
        eq(userActivityEvents.bakerId, bakerId),
        eq(userActivityEvents.eventType, "login"),
        gte(userActivityEvents.createdAt, sevenDaysAgo)
      )),
    db.select({ count: sql<number>`count(*)` })
      .from(userActivityEvents)
      .where(and(
        eq(userActivityEvents.bakerId, bakerId),
        eq(userActivityEvents.eventType, "login"),
        gte(userActivityEvents.createdAt, fourteenDaysAgo)
      )),
    db.select({ count: sql<number>`count(*)` })
      .from(leads)
      .where(eq(leads.bakerId, bakerId)),
    db.select({ count: sql<number>`count(*)` })
      .from(quotes)
      .where(eq(quotes.bakerId, bakerId)),
    db.select({ count: sql<number>`count(*)` })
      .from(quotes)
      .where(and(
        eq(quotes.bakerId, bakerId),
        eq(quotes.status, "sent")
      )),
    db.select({ count: sql<number>`count(*)` })
      .from(orders)
      .where(eq(orders.bakerId, bakerId)),
    db.select({ count: sql<number>`count(*)` })
      .from(userActivityEvents)
      .where(and(
        eq(userActivityEvents.bakerId, bakerId),
        eq(userActivityEvents.eventType, "quick_quote_configured")
      )),
    db.select({ count: sql<number>`count(*)` })
      .from(userActivityEvents)
      .where(and(
        eq(userActivityEvents.bakerId, bakerId),
        sql`${userActivityEvents.eventType} IN ('quick_quote_link_copied', 'quick_quote_link_shared')`
      )),
    db.select({ count: sql<number>`count(*)` })
      .from(userActivityEvents)
      .where(and(
        eq(userActivityEvents.bakerId, bakerId),
        sql`${userActivityEvents.eventType} IN (${sql.join(KEY_ACTIONS.map(a => sql`${a}`), sql`, `)})`,
        gte(userActivityEvents.createdAt, sevenDaysAgo)
      )),
    db.select({ count: sql<number>`count(*)` })
      .from(userActivityEvents)
      .where(and(
        eq(userActivityEvents.bakerId, bakerId),
        sql`${userActivityEvents.eventType} IN (${sql.join(KEY_ACTIONS.map(a => sql`${a}`), sql`, `)})`,
        gte(userActivityEvents.createdAt, fourteenDaysAgo)
      )),
  ]);

  return {
    loginCount7d: loginCount7d[0]?.count || 0,
    loginCount14d: loginCount14d[0]?.count || 0,
    leadCount: leadCountResult[0]?.count || 0,
    quoteCount: quoteCountResult[0]?.count || 0,
    sentQuoteCount: sentQuoteCountResult[0]?.count || 0,
    orderCount: orderCountResult[0]?.count || 0,
    hasConfiguredCalculator: (calcConfiguredResult[0]?.count || 0) > 0,
    hasSharedLink: (sharedLinkResult[0]?.count || 0) > 0,
    keyActionCount7d: keyActionCount7dResult[0]?.count || 0,
    keyActionCount14d: keyActionCount14dResult[0]?.count || 0,
  };
}

export function determineSegment(
  createdAt: Date,
  metrics: UserSegmentResult["metrics"]
): RetentionSegment {
  const now = new Date();
  const daysSinceSignup = Math.floor((now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24));

  const {
    loginCount7d,
    loginCount14d,
    leadCount,
    quoteCount,
    sentQuoteCount,
    orderCount,
    hasConfiguredCalculator,
    hasSharedLink,
    keyActionCount7d,
    keyActionCount14d,
  } = metrics;

  if (keyActionCount7d >= 3) {
    return "active_power_user";
  }

  if (keyActionCount14d > 0 && keyActionCount7d === 0 && loginCount7d === 0) {
    return "at_risk";
  }

  if (sentQuoteCount > 0 && orderCount === 0) {
    return "quotes_no_orders";
  }

  if (leadCount > 0 && quoteCount === 0) {
    return "leads_no_quotes";
  }

  if (hasConfiguredCalculator && !hasSharedLink) {
    return "configured_not_shared";
  }

  if (daysSinceSignup > 7 && keyActionCount14d === 0 && loginCount14d <= 1) {
    return "new_but_inactive";
  }

  return "new_but_inactive";
}

export async function getLastActivityDate(bakerId: string): Promise<Date | null> {
  const [result] = await db
    .select({ createdAt: userActivityEvents.createdAt })
    .from(userActivityEvents)
    .where(eq(userActivityEvents.bakerId, bakerId))
    .orderBy(desc(userActivityEvents.createdAt))
    .limit(1);
  return result?.createdAt || null;
}

export async function segmentUser(bakerId: string): Promise<UserSegmentResult | null> {
  const [baker] = await db.select().from(bakers).where(eq(bakers.id, bakerId));
  if (!baker || baker.suspended) return null;

  const metrics = await getUserMetrics(bakerId);
  const segment = determineSegment(baker.createdAt, metrics);
  const lastActivityAt = await getLastActivityDate(bakerId);

  const firstName = baker.businessName.split(" ")[0];

  return {
    bakerId: baker.id,
    segment,
    businessName: baker.businessName,
    email: baker.email,
    firstName,
    slug: baker.slug,
    createdAt: baker.createdAt,
    lastActivityAt,
    metrics,
  };
}

export async function getBakersEligibleForRetentionEmail(): Promise<UserSegmentResult[]> {
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const fortyEightHoursAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000);

  const allBakers = await db
    .select()
    .from(bakers)
    .where(eq(bakers.suspended, false));

  const results: UserSegmentResult[] = [];

  for (const baker of allBakers) {
    if (baker.role === "super_admin") continue;

    const [recentOnboarding] = await db
      .select()
      .from(bakerOnboardingEmails)
      .where(and(
        eq(bakerOnboardingEmails.bakerId, baker.id),
        gte(bakerOnboardingEmails.sentAt, fortyEightHoursAgo)
      ))
      .limit(1);

    if (recentOnboarding) continue;

    const [recentRetention] = await db
      .select()
      .from(retentionEmailSends)
      .where(and(
        eq(retentionEmailSends.bakerId, baker.id),
        gte(retentionEmailSends.sentAt, sevenDaysAgo)
      ))
      .limit(1);

    if (recentRetention) continue;

    const segmentResult = await segmentUser(baker.id);
    if (segmentResult) {
      results.push(segmentResult);
    }
  }

  return results;
}

export async function getSegmentDistribution(): Promise<Record<RetentionSegment, number>> {
  const allBakers = await db
    .select()
    .from(bakers)
    .where(and(
      eq(bakers.suspended, false),
      sql`${bakers.role} != 'super_admin'`
    ));

  const distribution: Record<RetentionSegment, number> = {
    new_but_inactive: 0,
    configured_not_shared: 0,
    leads_no_quotes: 0,
    quotes_no_orders: 0,
    active_power_user: 0,
    at_risk: 0,
  };

  for (const baker of allBakers) {
    const segmentResult = await segmentUser(baker.id);
    if (segmentResult) {
      distribution[segmentResult.segment]++;
    }
  }

  return distribution;
}

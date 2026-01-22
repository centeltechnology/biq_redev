import { db } from "./db";
import { retentionEmailTemplates, retentionEmailSends, type RetentionEmailTemplate } from "@shared/schema";
import { eq, desc } from "drizzle-orm";

export async function getRetentionTemplates(): Promise<RetentionEmailTemplate[]> {
  return db
    .select()
    .from(retentionEmailTemplates)
    .orderBy(desc(retentionEmailTemplates.segment), desc(retentionEmailTemplates.priority));
}

export async function getRetentionTemplate(id: string): Promise<RetentionEmailTemplate | null> {
  const [template] = await db
    .select()
    .from(retentionEmailTemplates)
    .where(eq(retentionEmailTemplates.id, id));
  return template || null;
}

export async function updateRetentionTemplate(
  id: string,
  data: Partial<{
    name: string;
    subject: string;
    preheader: string;
    bodyHtml: string;
    bodyText: string;
    ctaText: string;
    ctaRoute: string;
    isActive: boolean;
    priority: number;
  }>
): Promise<RetentionEmailTemplate | null> {
  const [updated] = await db
    .update(retentionEmailTemplates)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(eq(retentionEmailTemplates.id, id))
    .returning();
  return updated || null;
}

export async function getRecentSends(limit: number = 50): Promise<{
  id: string;
  bakerId: string;
  segment: string;
  status: string;
  sentAt: Date;
  openedAt: Date | null;
  clickedAt: Date | null;
}[]> {
  return db
    .select({
      id: retentionEmailSends.id,
      bakerId: retentionEmailSends.bakerId,
      segment: retentionEmailSends.segment,
      status: retentionEmailSends.status,
      sentAt: retentionEmailSends.sentAt,
      openedAt: retentionEmailSends.openedAt,
      clickedAt: retentionEmailSends.clickedAt,
    })
    .from(retentionEmailSends)
    .orderBy(desc(retentionEmailSends.sentAt))
    .limit(limit);
}

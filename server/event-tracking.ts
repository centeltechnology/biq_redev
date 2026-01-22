import { db } from "./db";
import { userActivityEvents, type UserActivityEventType } from "@shared/schema";
import { eq, and, gte, desc, sql } from "drizzle-orm";

export async function trackEvent(
  bakerId: string,
  eventType: UserActivityEventType,
  eventData?: Record<string, unknown>
): Promise<void> {
  try {
    await db.insert(userActivityEvents).values({
      bakerId,
      eventType,
      eventData: eventData || null,
    });
  } catch (error) {
    console.error(`Failed to track event ${eventType} for baker ${bakerId}:`, error);
  }
}

export async function getEventsSince(
  bakerId: string,
  since: Date
): Promise<{ eventType: string; eventData: unknown; createdAt: Date }[]> {
  return db
    .select({
      eventType: userActivityEvents.eventType,
      eventData: userActivityEvents.eventData,
      createdAt: userActivityEvents.createdAt,
    })
    .from(userActivityEvents)
    .where(
      and(
        eq(userActivityEvents.bakerId, bakerId),
        gte(userActivityEvents.createdAt, since)
      )
    )
    .orderBy(desc(userActivityEvents.createdAt));
}

export async function hasEventSince(
  bakerId: string,
  eventType: UserActivityEventType,
  since: Date
): Promise<boolean> {
  const [result] = await db
    .select({ count: sql<number>`count(*)` })
    .from(userActivityEvents)
    .where(
      and(
        eq(userActivityEvents.bakerId, bakerId),
        eq(userActivityEvents.eventType, eventType),
        gte(userActivityEvents.createdAt, since)
      )
    );
  return (result?.count || 0) > 0;
}

export async function countEventsSince(
  bakerId: string,
  since: Date,
  eventTypes?: UserActivityEventType[]
): Promise<number> {
  let query = db
    .select({ count: sql<number>`count(*)` })
    .from(userActivityEvents)
    .where(
      and(
        eq(userActivityEvents.bakerId, bakerId),
        gte(userActivityEvents.createdAt, since)
      )
    );

  if (eventTypes && eventTypes.length > 0) {
    const eventTypeConditions = eventTypes.map(t => eq(userActivityEvents.eventType, t));
    query = db
      .select({ count: sql<number>`count(*)` })
      .from(userActivityEvents)
      .where(
        and(
          eq(userActivityEvents.bakerId, bakerId),
          gte(userActivityEvents.createdAt, since),
          sql`${userActivityEvents.eventType} IN (${sql.join(eventTypes.map(t => sql`${t}`), sql`, `)})`
        )
      );
  }

  const [result] = await query;
  return result?.count || 0;
}

export async function getLastEventOfType(
  bakerId: string,
  eventType: UserActivityEventType
): Promise<{ eventData: unknown; createdAt: Date } | null> {
  const [result] = await db
    .select({
      eventData: userActivityEvents.eventData,
      createdAt: userActivityEvents.createdAt,
    })
    .from(userActivityEvents)
    .where(
      and(
        eq(userActivityEvents.bakerId, bakerId),
        eq(userActivityEvents.eventType, eventType)
      )
    )
    .orderBy(desc(userActivityEvents.createdAt))
    .limit(1);
  return result || null;
}

export async function getLoginCountSince(bakerId: string, since: Date): Promise<number> {
  const [result] = await db
    .select({ count: sql<number>`count(*)` })
    .from(userActivityEvents)
    .where(
      and(
        eq(userActivityEvents.bakerId, bakerId),
        eq(userActivityEvents.eventType, "login"),
        gte(userActivityEvents.createdAt, since)
      )
    );
  return result?.count || 0;
}

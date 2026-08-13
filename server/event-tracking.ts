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

// Track an event only if the baker has never recorded it before.
// Used for once-per-account activation milestones so refreshes/retries
// don't create duplicate rows.
export async function trackEventOnce(
  bakerId: string,
  eventType: UserActivityEventType,
  eventData?: Record<string, unknown>
): Promise<void> {
  try {
    // Single atomic statement (insert-if-absent) to avoid duplicate rows
    // from concurrent requests.
    const dataJson = eventData ? JSON.stringify(eventData) : null;
    await db.execute(sql`
      INSERT INTO user_activity_events (baker_id, event_type, event_data)
      SELECT ${bakerId}, ${eventType}, ${dataJson}::jsonb
      WHERE NOT EXISTS (
        SELECT 1 FROM user_activity_events
        WHERE baker_id = ${bakerId} AND event_type = ${eventType}
      )
    `);
  } catch (error) {
    console.error(`Failed to track once event ${eventType} for baker ${bakerId}:`, error);
  }
}

// Track a repeatable event, skipping duplicates from the same session
// within a debounce window (defends against refreshes/re-renders).
export async function trackEventDeduped(
  bakerId: string,
  eventType: UserActivityEventType,
  sessionId: string,
  windowMinutes: number,
  eventData?: Record<string, unknown>
): Promise<void> {
  try {
    const since = new Date(Date.now() - windowMinutes * 60 * 1000);
    const dataJson = JSON.stringify({ ...(eventData || {}), sessionId });
    // Single atomic statement (insert-if-no-recent-duplicate) to keep
    // concurrent requests from double-writing.
    await db.execute(sql`
      INSERT INTO user_activity_events (baker_id, event_type, event_data)
      SELECT ${bakerId}, ${eventType}, ${dataJson}::jsonb
      WHERE NOT EXISTS (
        SELECT 1 FROM user_activity_events
        WHERE baker_id = ${bakerId}
          AND event_type = ${eventType}
          AND created_at >= ${since.toISOString()}::timestamp
          AND event_data->>'sessionId' = ${sessionId}
      )
    `);
  } catch (error) {
    console.error(`Failed to track deduped event ${eventType} for baker ${bakerId}:`, error);
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

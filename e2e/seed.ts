import bcrypt from "bcrypt";
import { eq } from "drizzle-orm";
import { db, pool } from "../server/db";
import {
  bakers,
  customers,
  leads,
  quotes,
  quotePayments,
} from "@shared/schema";
import { TEST_BAKER } from "./fixtures";

// Tables with a single baker_id column, deleted after the interdependent
// quote/lead/customer chain. Most are empty for the test baker, but the app
// may write rows (e.g. user_activity_events) while the suite runs.
const BAKER_SCOPED_TABLES = [
  "baker_onboarding_emails",
  "email_verification_tokens",
  "onboarding_email_sends",
  "password_reset_tokens",
  "pricing_calculations",
  "retention_email_sends",
  "support_tickets",
  "survey_responses",
  "user_activity_events",
];

export async function cleanupTestData() {
  const existing = await db
    .select({ id: bakers.id })
    .from(bakers)
    .where(eq(bakers.email, TEST_BAKER.email));

  for (const b of existing) {
    const id = b.id;
    await pool.query("DELETE FROM quote_payments WHERE baker_id=$1", [id]);
    await pool.query("DELETE FROM orders WHERE baker_id=$1", [id]);
    await pool.query("DELETE FROM quotes WHERE baker_id=$1", [id]);
    await pool.query("DELETE FROM leads WHERE baker_id=$1", [id]);
    await pool.query("DELETE FROM customers WHERE baker_id=$1", [id]);
    for (const table of BAKER_SCOPED_TABLES) {
      await pool.query(`DELETE FROM ${table} WHERE baker_id=$1`, [id]);
    }
    await pool.query(
      "DELETE FROM affiliate_commissions WHERE affiliate_baker_id=$1 OR referred_baker_id=$1",
      [id],
    );
    await pool.query(
      "DELETE FROM baker_referrals WHERE referred_baker_id=$1 OR referring_baker_id=$1",
      [id],
    );
    await pool.query("DELETE FROM bakers WHERE id=$1", [id]);
  }
}

export async function seedTestData() {
  await cleanupTestData();

  const passwordHash = await bcrypt.hash(TEST_BAKER.password, 10);

  const [baker] = await db
    .insert(bakers)
    .values({
      email: TEST_BAKER.email,
      passwordHash,
      businessName: TEST_BAKER.businessName,
      slug: TEST_BAKER.slug,
      role: "baker",
      onboardingCompleted: true,
    })
    .returning();

  const [customer] = await db
    .insert(customers)
    .values({
      bakerId: baker.id,
      name: "E2E Test Customer",
      email: "e2e-customer@bakeriq.test",
    })
    .returning();

  const [lead] = await db
    .insert(leads)
    .values({
      bakerId: baker.id,
      customerId: customer.id,
      customerName: customer.name,
      customerEmail: customer.email,
      eventType: "birthday",
      estimatedTotal: "250.00",
      status: "new",
    })
    .returning();

  const [quote] = await db
    .insert(quotes)
    .values({
      bakerId: baker.id,
      customerId: customer.id,
      leadId: lead.id,
      quoteNumber: "E2E-0001",
      title: "E2E Responsive Test Cake",
      status: "sent",
      subtotal: "230.00",
      taxAmount: "20.00",
      total: "250.00",
      paymentStatus: "deposit_paid",
    })
    .returning();

  await db.insert(quotePayments).values({
    quoteId: quote.id,
    bakerId: baker.id,
    stripePaymentIntentId: "pi_e2e_test_0001",
    amount: "125.00",
    platformFee: "8.75",
    status: "succeeded",
    paymentType: "deposit",
    currencyCode: "usd",
  });

  return { baker };
}

export async function closeDb() {
  await pool.end();
}

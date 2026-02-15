import {
  bakers,
  customers,
  leads,
  quotes,
  quoteItems,
  orders,
  passwordResetTokens,
  emailVerificationTokens,
  bakerOnboardingEmails,
  onboardingEmailSends,
  pricingCalculations,
  supportTickets,
  ticketMessages,
  surveyResponses,
  quotePayments,
  referralClicks,
  affiliateCommissions,
  bakerReferrals,
  type Baker,
  type InsertBaker,
  type Customer,
  type InsertCustomer,
  type Lead,
  type InsertLead,
  type Quote,
  type InsertQuote,
  type QuoteItem,
  type InsertQuoteItem,
  type Order,
  type InsertOrder,
  type BakerOnboardingEmail,
  type PricingCalculation,
  type InsertPricingCalculation,
  type SupportTicket,
  type InsertSupportTicket,
  type TicketMessage,
  type InsertTicketMessage,
  type SurveyResponse,
  type InsertSurveyResponse,
  type QuotePayment,
  type InsertQuotePayment,
  type ReferralClick,
  type InsertReferralClick,
  type AffiliateCommission,
  type InsertAffiliateCommission,
  type BakerReferral,
  type InsertBakerReferral,
  affiliateRequests,
  type AffiliateRequest,
  type InsertAffiliateRequest,
  invitations,
  type Invitation,
  type InsertInvitation,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, gte, lte, sql, or, ilike, isNull } from "drizzle-orm";

export interface IStorage {
  // Bakers
  getBaker(id: string): Promise<Baker | undefined>;
  getBakerByEmail(email: string): Promise<Baker | undefined>;
  getBakerBySlug(slug: string): Promise<Baker | undefined>;
  createBaker(baker: InsertBaker): Promise<Baker>;
  updateBaker(id: string, data: Partial<InsertBaker>): Promise<Baker | undefined>;

  // Customers
  getCustomer(id: string): Promise<Customer | undefined>;
  getCustomersByBaker(bakerId: string): Promise<Customer[]>;
  getCustomerByEmail(bakerId: string, email: string): Promise<Customer | undefined>;
  createCustomer(customer: InsertCustomer): Promise<Customer>;
  updateCustomer(id: string, data: Partial<InsertCustomer>): Promise<Customer | undefined>;
  getCustomersWithQuotes(bakerId: string): Promise<(Customer & { quotes: Quote[] })[]>;

  // Leads
  getLead(id: string): Promise<Lead | undefined>;
  getLeadsByBaker(bakerId: string): Promise<Lead[]>;
  createLead(lead: InsertLead): Promise<Lead>;
  updateLead(id: string, data: Partial<InsertLead>): Promise<Lead | undefined>;

  // Quotes
  getQuote(id: string): Promise<Quote | undefined>;
  getQuotesByBaker(bakerId: string): Promise<Quote[]>;
  getQuoteWithItems(id: string): Promise<(Quote & { items: QuoteItem[] }) | undefined>;
  getQuotesWithCustomer(bakerId: string): Promise<(Quote & { customer?: { name: string } })[]>;
  createQuote(quote: InsertQuote): Promise<Quote>;
  updateQuote(id: string, data: Partial<InsertQuote>): Promise<Quote | undefined>;
  deleteQuote(id: string): Promise<void>;
  getNextQuoteNumber(bakerId: string): Promise<string>;

  // Quote Items
  createQuoteItem(item: InsertQuoteItem): Promise<QuoteItem>;
  updateQuoteItem(id: string, data: Partial<InsertQuoteItem>): Promise<QuoteItem | undefined>;
  deleteQuoteItem(id: string): Promise<void>;
  deleteQuoteItemsByQuote(quoteId: string): Promise<void>;

  // Dashboard Stats
  getDashboardStats(bakerId: string): Promise<{
    newLeadsCount: number;
    pendingQuotesCount: number;
    totalCustomers: number;
    recentLeads: Lead[];
  }>;

  // Orders
  getOrder(id: string): Promise<Order | undefined>;
  getOrdersByBaker(bakerId: string): Promise<Order[]>;
  getOrdersByMonth(bakerId: string, year: number, month: number): Promise<(Order & { customerName: string; eventType: string | null })[]>;
  getOrdersWithCustomer(bakerId: string): Promise<(Order & { customerName: string; eventType: string | null })[]>;
  createOrder(order: InsertOrder): Promise<Order>;
  updateOrder(id: string, data: Partial<InsertOrder>): Promise<Order | undefined>;
  deleteOrder(id: string): Promise<void>;
  getOrderStats(bakerId: string): Promise<{
    monthlyCount: number;
    monthlyRevenue: number;
    yearlyCount: number;
    yearlyRevenue: number;
  }>;
  getUpcomingOrders(bakerId: string): Promise<(Order & { customerName: string; eventType: string | null })[]>;
  getOrderByQuoteId(quoteId: string): Promise<Order | undefined>;
  getMonthlyLeadCount(bakerId: string): Promise<number>;
  getMonthlyQuoteCount(bakerId: string): Promise<number>;

  // Password Reset Tokens
  createPasswordResetToken(bakerId: string, token: string, expiresAt: Date): Promise<void>;
  getPasswordResetToken(token: string): Promise<{ id: string; bakerId: string; expiresAt: Date; usedAt: Date | null } | undefined>;
  markPasswordResetTokenUsed(token: string): Promise<void>;

  // Email Verification Tokens
  createEmailVerificationToken(bakerId: string, token: string, expiresAt: Date): Promise<void>;
  getEmailVerificationToken(token: string): Promise<{ id: string; bakerId: string; expiresAt: Date; usedAt: Date | null } | undefined>;
  markEmailVerificationTokenUsed(token: string): Promise<void>;
  markBakerEmailVerified(bakerId: string): Promise<void>;

  // Admin
  getAllBakers(): Promise<Baker[]>;
  getAdminPlatformStats(): Promise<{
    totalLeads: number;
    totalQuotes: number;
    totalOrders: number;
    platformRevenue: number;
    quotesThisMonth: number;
    leadsThisMonth: number;
  }>;
  getAdminEmailLogs(): Promise<BakerOnboardingEmail[]>;
  deleteOnboardingEmail(bakerId: string, emailDay: number): Promise<void>;

  // Onboarding Emails
  getOnboardingEmailsSent(bakerId: string): Promise<BakerOnboardingEmail[]>;
  hasOnboardingEmailBeenSent(bakerId: string, emailDay: number): Promise<boolean>;
  recordOnboardingEmail(bakerId: string, emailDay: number, status: string, error?: string, emailKey?: string, stripeConnected?: boolean): Promise<void>;
  getBakersForOnboardingEmails(targetDay: number): Promise<Baker[]>;
  setActivationTimestamp(bakerId: string, field: "stripeConnectedAt" | "firstProductCreatedAt" | "firstQuoteSentAt" | "firstInvoiceCreatedAt" | "firstPaymentProcessedAt"): Promise<void>;
  getOnboardingEmailStats(): Promise<{ totalBakers: number; stripeConnectedWithin7Days: number; emailsSentByKey: Record<string, number> }>;
  hasOnboardingEmailKeyBeenSent(bakerId: string, emailKey: string): Promise<boolean>;
  recordOnboardingEmailSend(bakerId: string, emailKey: string, variant?: string, providerMessageId?: string): Promise<void>;
  deleteOnboardingEmailSend(bakerId: string, emailKey: string): Promise<void>;

  // Pricing Calculations
  getPricingCalculation(id: string): Promise<PricingCalculation | undefined>;
  getPricingCalculationsByBaker(bakerId: string): Promise<PricingCalculation[]>;
  searchPricingCalculations(bakerId: string, query: string): Promise<PricingCalculation[]>;
  getFeaturedItemsByBaker(bakerId: string): Promise<PricingCalculation[]>;
  getPublicFeaturedItems(slug: string): Promise<PricingCalculation[]>;
  createPricingCalculation(calculation: InsertPricingCalculation): Promise<PricingCalculation>;
  updatePricingCalculation(id: string, data: Partial<InsertPricingCalculation>): Promise<PricingCalculation | undefined>;
  deletePricingCalculation(id: string): Promise<void>;

  // Support Tickets
  getSupportTicket(id: string): Promise<SupportTicket | undefined>;
  getSupportTicketsByBaker(bakerId: string): Promise<SupportTicket[]>;
  getAllSupportTickets(): Promise<(SupportTicket & { baker: { businessName: string; email: string }; messages: TicketMessage[] })[]>;
  createSupportTicket(ticket: InsertSupportTicket): Promise<SupportTicket>;
  updateSupportTicket(id: string, data: Partial<SupportTicket>): Promise<SupportTicket | undefined>;
  getUnreadSupportMessageCount(bakerId: string): Promise<number>;
  
  // Ticket Messages
  getTicketMessages(ticketId: string): Promise<TicketMessage[]>;
  createTicketMessage(message: InsertTicketMessage): Promise<TicketMessage>;

  // Survey Responses
  getSurveyResponseByBaker(bakerId: string): Promise<SurveyResponse | undefined>;
  createSurveyResponse(response: InsertSurveyResponse): Promise<SurveyResponse>;
  getAllSurveyResponses(): Promise<(SurveyResponse & { baker: { businessName: string; email: string } })[]>;

  // Quote Payments
  createQuotePayment(payment: InsertQuotePayment): Promise<QuotePayment>;
  getQuotePaymentsByQuote(quoteId: string): Promise<QuotePayment[]>;
  getQuotePaymentsByBaker(bakerId: string): Promise<(QuotePayment & { quoteTitle: string; quoteNumber: string; customerName: string })[]>;
  getAllQuotePayments(): Promise<(QuotePayment & { quoteTitle: string; quoteNumber: string; bakerName: string; customerName: string })[]>;

  // Affiliates
  getAffiliates(): Promise<Baker[]>;
  getAffiliateByCode(code: string): Promise<Baker | undefined>;
  enableAffiliate(bakerId: string, code: string, commissionRate?: string, commissionMonths?: number): Promise<Baker | undefined>;
  disableAffiliate(bakerId: string): Promise<Baker | undefined>;
  
  // Referral clicks
  createReferralClick(click: InsertReferralClick): Promise<ReferralClick>;
  getReferralClickCount(affiliateCode: string): Promise<number>;
  
  // Affiliate commissions
  createAffiliateCommission(commission: InsertAffiliateCommission): Promise<AffiliateCommission>;
  getCommissionsByAffiliate(affiliateBakerId: string): Promise<AffiliateCommission[]>;
  getAllCommissions(): Promise<AffiliateCommission[]>;
  updateCommissionStatus(commissionId: string, status: string, paidAt?: Date): Promise<AffiliateCommission | undefined>;
  getReferralsByAffiliate(affiliateBakerId: string): Promise<Baker[]>;
  getAffiliateStats(affiliateBakerId: string): Promise<{ totalClicks: number; totalConversions: number; totalEarnings: number; pendingEarnings: number }>;
  getAffiliateBySlug(slug: string): Promise<Baker | undefined>;

  // Baker referrals
  createBakerReferral(referral: InsertBakerReferral): Promise<BakerReferral>;
  getBakerReferralsByReferrer(bakerId: string): Promise<BakerReferral[]>;
  getBakerByReferralCode(code: string): Promise<Baker | undefined>;
  awardBakerReferralCredit(referralId: string, creditType: string): Promise<BakerReferral | undefined>;

  // Affiliate requests
  createAffiliateRequest(request: InsertAffiliateRequest): Promise<AffiliateRequest>;
  getAffiliateRequests(status?: string): Promise<AffiliateRequest[]>;
  getAffiliateRequest(id: string): Promise<AffiliateRequest | undefined>;
  updateAffiliateRequest(id: string, updates: Partial<AffiliateRequest>): Promise<AffiliateRequest | undefined>;

  // Invitations
  createInvitation(invitation: InsertInvitation): Promise<Invitation>;
  getInvitations(): Promise<Invitation[]>;
  getInvitationByToken(token: string): Promise<Invitation | undefined>;
  getInvitationByEmail(email: string): Promise<Invitation | undefined>;
  updateInvitation(id: string, data: Partial<Invitation>): Promise<Invitation | undefined>;
}

export class DatabaseStorage implements IStorage {
  // Bakers
  async getBaker(id: string): Promise<Baker | undefined> {
    const [baker] = await db.select().from(bakers).where(eq(bakers.id, id));
    return baker || undefined;
  }

  async getBakerByEmail(email: string): Promise<Baker | undefined> {
    const [baker] = await db.select().from(bakers).where(eq(bakers.email, email));
    return baker || undefined;
  }

  async getBakerBySlug(slug: string): Promise<Baker | undefined> {
    const [baker] = await db.select().from(bakers).where(eq(bakers.slug, slug));
    return baker || undefined;
  }

  async createBaker(insertBaker: InsertBaker): Promise<Baker> {
    const [baker] = await db.insert(bakers).values(insertBaker).returning();
    return baker;
  }

  async updateBaker(id: string, data: Partial<InsertBaker>): Promise<Baker | undefined> {
    const [baker] = await db.update(bakers).set(data).where(eq(bakers.id, id)).returning();
    return baker || undefined;
  }

  // Customers
  async getCustomer(id: string): Promise<Customer | undefined> {
    const [customer] = await db.select().from(customers).where(eq(customers.id, id));
    return customer || undefined;
  }

  async getCustomersByBaker(bakerId: string): Promise<Customer[]> {
    return db.select().from(customers).where(eq(customers.bakerId, bakerId)).orderBy(desc(customers.createdAt));
  }

  async getCustomerByEmail(bakerId: string, email: string): Promise<Customer | undefined> {
    const [customer] = await db
      .select()
      .from(customers)
      .where(and(eq(customers.bakerId, bakerId), eq(customers.email, email)));
    return customer || undefined;
  }

  async createCustomer(insertCustomer: InsertCustomer): Promise<Customer> {
    const [customer] = await db.insert(customers).values(insertCustomer).returning();
    return customer;
  }

  async updateCustomer(id: string, data: Partial<InsertCustomer>): Promise<Customer | undefined> {
    const [customer] = await db.update(customers).set(data).where(eq(customers.id, id)).returning();
    return customer;
  }

  async getCustomersWithQuotes(bakerId: string): Promise<(Customer & { quotes: Quote[] })[]> {
    const customersList = await db
      .select()
      .from(customers)
      .where(eq(customers.bakerId, bakerId))
      .orderBy(desc(customers.createdAt));

    const result = await Promise.all(
      customersList.map(async (customer) => {
        const customerQuotes = await db
          .select()
          .from(quotes)
          .where(eq(quotes.customerId, customer.id))
          .orderBy(desc(quotes.createdAt));
        return { ...customer, quotes: customerQuotes };
      })
    );

    return result;
  }

  // Leads
  async getLead(id: string): Promise<Lead | undefined> {
    const [lead] = await db.select().from(leads).where(eq(leads.id, id));
    return lead || undefined;
  }

  async getLeadsByBaker(bakerId: string): Promise<Lead[]> {
    return db.select().from(leads).where(eq(leads.bakerId, bakerId)).orderBy(desc(leads.createdAt));
  }

  async createLead(insertLead: InsertLead): Promise<Lead> {
    const [lead] = await db.insert(leads).values(insertLead).returning();
    return lead;
  }

  async updateLead(id: string, data: Partial<InsertLead>): Promise<Lead | undefined> {
    const [lead] = await db.update(leads).set(data).where(eq(leads.id, id)).returning();
    return lead || undefined;
  }

  // Quotes
  async getQuote(id: string): Promise<Quote | undefined> {
    const [quote] = await db.select().from(quotes).where(eq(quotes.id, id));
    return quote || undefined;
  }

  async getQuotesByBaker(bakerId: string): Promise<Quote[]> {
    return db.select().from(quotes).where(eq(quotes.bakerId, bakerId)).orderBy(desc(quotes.createdAt));
  }

  async getQuoteWithItems(id: string): Promise<(Quote & { items: QuoteItem[] }) | undefined> {
    const [quote] = await db.select().from(quotes).where(eq(quotes.id, id));
    if (!quote) return undefined;

    const items = await db
      .select()
      .from(quoteItems)
      .where(eq(quoteItems.quoteId, id))
      .orderBy(quoteItems.sortOrder);

    return { ...quote, items };
  }

  async getQuotesWithCustomer(bakerId: string): Promise<(Quote & { customer?: { name: string } })[]> {
    const quotesList = await db
      .select()
      .from(quotes)
      .where(eq(quotes.bakerId, bakerId))
      .orderBy(desc(quotes.createdAt));

    const result = await Promise.all(
      quotesList.map(async (quote) => {
        const [customer] = await db
          .select({ name: customers.name })
          .from(customers)
          .where(eq(customers.id, quote.customerId));
        return { ...quote, customer };
      })
    );

    return result;
  }

  async createQuote(insertQuote: InsertQuote): Promise<Quote> {
    const [quote] = await db.insert(quotes).values(insertQuote).returning();
    return quote;
  }

  async updateQuote(id: string, data: Partial<InsertQuote>): Promise<Quote | undefined> {
    const [quote] = await db
      .update(quotes)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(quotes.id, id))
      .returning();
    return quote || undefined;
  }

  async deleteQuote(id: string): Promise<void> {
    await db.delete(quotes).where(eq(quotes.id, id));
  }

  async getNextQuoteNumber(bakerId: string): Promise<string> {
    const year = new Date().getFullYear();
    const [result] = await db
      .select({ count: sql<number>`count(*)` })
      .from(quotes)
      .where(eq(quotes.bakerId, bakerId));
    const count = (result?.count || 0) + 1;
    return `Q-${year}-${String(count).padStart(3, "0")}`;
  }

  // Quote Items
  async createQuoteItem(insertItem: InsertQuoteItem): Promise<QuoteItem> {
    const [item] = await db.insert(quoteItems).values(insertItem).returning();
    return item;
  }

  async updateQuoteItem(id: string, data: Partial<InsertQuoteItem>): Promise<QuoteItem | undefined> {
    const [item] = await db.update(quoteItems).set(data).where(eq(quoteItems.id, id)).returning();
    return item || undefined;
  }

  async deleteQuoteItem(id: string): Promise<void> {
    await db.delete(quoteItems).where(eq(quoteItems.id, id));
  }

  async deleteQuoteItemsByQuote(quoteId: string): Promise<void> {
    await db.delete(quoteItems).where(eq(quoteItems.quoteId, quoteId));
  }

  // Dashboard Stats
  async getDashboardStats(bakerId: string): Promise<{
    newLeadsCount: number;
    pendingQuotesCount: number;
    totalCustomers: number;
    recentLeads: Lead[];
  }> {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const [newLeadsResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(leads)
      .where(and(eq(leads.bakerId, bakerId), gte(leads.createdAt, sevenDaysAgo)));

    const [pendingQuotesResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(quotes)
      .where(and(eq(quotes.bakerId, bakerId), eq(quotes.status, "draft")));

    // Only count customers who have at least one approved or sent quote (not just new leads)
    const [customersResult] = await db
      .select({ count: sql<number>`count(distinct ${customers.id})` })
      .from(customers)
      .innerJoin(quotes, eq(customers.id, quotes.customerId))
      .where(
        and(
          eq(customers.bakerId, bakerId),
          sql`${quotes.status} IN ('approved', 'sent')`
        )
      );

    const recentLeads = await db
      .select()
      .from(leads)
      .where(eq(leads.bakerId, bakerId))
      .orderBy(desc(leads.createdAt))
      .limit(5);

    return {
      newLeadsCount: Number(newLeadsResult?.count || 0),
      pendingQuotesCount: Number(pendingQuotesResult?.count || 0),
      totalCustomers: Number(customersResult?.count || 0),
      recentLeads,
    };
  }

  // Orders
  async getOrder(id: string): Promise<Order | undefined> {
    const [order] = await db.select().from(orders).where(eq(orders.id, id));
    return order || undefined;
  }

  async getOrdersByBaker(bakerId: string): Promise<Order[]> {
    return db.select().from(orders).where(eq(orders.bakerId, bakerId)).orderBy(desc(orders.eventDate));
  }

  async getOrdersByMonth(bakerId: string, year: number, month: number): Promise<(Order & { customerName: string; eventType: string | null })[]> {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);
    const startStr = startDate.toISOString().split('T')[0];
    const endStr = endDate.toISOString().split('T')[0];
    
    const ordersList = await db
      .select()
      .from(orders)
      .where(
        and(
          eq(orders.bakerId, bakerId),
          gte(orders.eventDate, startStr),
          lte(orders.eventDate, endStr)
        )
      )
      .orderBy(orders.eventDate);
    
    const result = await Promise.all(
      ordersList.map(async (order) => {
        const [customer] = await db
          .select({ name: customers.name })
          .from(customers)
          .where(eq(customers.id, order.customerId));
        
        // Get event type from linked quote if available
        let eventType: string | null = null;
        if (order.quoteId) {
          const [quote] = await db
            .select({ title: quotes.title })
            .from(quotes)
            .where(eq(quotes.id, order.quoteId));
          eventType = quote?.title || null;
        }
        
        return { 
          ...order, 
          customerName: customer?.name || 'Unknown',
          eventType
        };
      })
    );
    
    return result;
  }

  async getOrdersWithCustomer(bakerId: string): Promise<(Order & { customerName: string; eventType: string | null })[]> {
    const ordersList = await db
      .select()
      .from(orders)
      .where(eq(orders.bakerId, bakerId))
      .orderBy(desc(orders.eventDate));

    const result = await Promise.all(
      ordersList.map(async (order) => {
        const [customer] = await db
          .select({ name: customers.name })
          .from(customers)
          .where(eq(customers.id, order.customerId));
        
        // Get event type from linked quote if available
        let eventType: string | null = null;
        if (order.quoteId) {
          const [quote] = await db
            .select({ title: quotes.title })
            .from(quotes)
            .where(eq(quotes.id, order.quoteId));
          eventType = quote?.title || null;
        }
        
        return { 
          ...order, 
          customerName: customer?.name || 'Unknown',
          eventType
        };
      })
    );

    return result;
  }

  async createOrder(insertOrder: InsertOrder): Promise<Order> {
    const [order] = await db.insert(orders).values(insertOrder).returning();
    return order;
  }

  async updateOrder(id: string, data: Partial<InsertOrder>): Promise<Order | undefined> {
    const [order] = await db.update(orders).set(data).where(eq(orders.id, id)).returning();
    return order || undefined;
  }

  async deleteOrder(id: string): Promise<void> {
    await db.delete(orders).where(eq(orders.id, id));
  }

  async getOrderStats(bakerId: string): Promise<{
    monthlyCount: number;
    monthlyRevenue: number;
    yearlyCount: number;
    yearlyRevenue: number;
  }> {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    const startOfMonthStr = startOfMonth.toISOString().split('T')[0];
    const startOfYearStr = startOfYear.toISOString().split('T')[0];

    const [monthlyResult] = await db
      .select({
        count: sql<number>`count(*)`,
        revenue: sql<number>`coalesce(sum(amount::numeric), 0)`,
      })
      .from(orders)
      .where(
        and(
          eq(orders.bakerId, bakerId),
          gte(orders.createdAt, startOfMonth)
        )
      );

    const [yearlyResult] = await db
      .select({
        count: sql<number>`count(*)`,
        revenue: sql<number>`coalesce(sum(amount::numeric), 0)`,
      })
      .from(orders)
      .where(
        and(
          eq(orders.bakerId, bakerId),
          gte(orders.createdAt, startOfYear)
        )
      );

    return {
      monthlyCount: Number(monthlyResult?.count || 0),
      monthlyRevenue: Number(monthlyResult?.revenue || 0),
      yearlyCount: Number(yearlyResult?.count || 0),
      yearlyRevenue: Number(yearlyResult?.revenue || 0),
    };
  }

  async getUpcomingOrders(bakerId: string): Promise<(Order & { customerName: string; eventType: string | null })[]> {
    const today = new Date();
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    const todayStr = today.toISOString().split('T')[0];
    const nextWeekStr = nextWeek.toISOString().split('T')[0];

    const ordersList = await db
      .select()
      .from(orders)
      .where(
        and(
          eq(orders.bakerId, bakerId),
          gte(orders.eventDate, todayStr),
          lte(orders.eventDate, nextWeekStr),
          sql`${orders.fulfillmentStatus} NOT IN ('completed', 'cancelled')`
        )
      )
      .orderBy(orders.eventDate);

    const result = await Promise.all(
      ordersList.map(async (order) => {
        const [customer] = await db
          .select({ name: customers.name })
          .from(customers)
          .where(eq(customers.id, order.customerId));
        
        // Get event type from linked quote if available
        let eventType: string | null = null;
        if (order.quoteId) {
          const [quote] = await db
            .select({ title: quotes.title })
            .from(quotes)
            .where(eq(quotes.id, order.quoteId));
          eventType = quote?.title || null;
        }
        
        return { 
          ...order, 
          customerName: customer?.name || 'Unknown',
          eventType
        };
      })
    );

    return result;
  }

  async getOrderByQuoteId(quoteId: string): Promise<Order | undefined> {
    const [order] = await db.select().from(orders).where(eq(orders.quoteId, quoteId));
    return order || undefined;
  }

  async getMonthlyLeadCount(bakerId: string): Promise<number> {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const result = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(leads)
      .where(
        and(
          eq(leads.bakerId, bakerId),
          gte(leads.createdAt, startOfMonth)
        )
      );
    return result[0]?.count || 0;
  }

  async getMonthlyQuoteCount(bakerId: string): Promise<number> {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const result = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(quotes)
      .where(
        and(
          eq(quotes.bakerId, bakerId),
          gte(quotes.createdAt, startOfMonth)
        )
      );
    return result[0]?.count || 0;
  }

  // Password Reset Tokens
  async createPasswordResetToken(bakerId: string, token: string, expiresAt: Date): Promise<void> {
    await db.insert(passwordResetTokens).values({ bakerId, token, expiresAt });
  }

  async getPasswordResetToken(token: string): Promise<{ id: string; bakerId: string; expiresAt: Date; usedAt: Date | null } | undefined> {
    const [result] = await db.select().from(passwordResetTokens).where(eq(passwordResetTokens.token, token));
    return result || undefined;
  }

  async markPasswordResetTokenUsed(token: string): Promise<void> {
    await db.update(passwordResetTokens).set({ usedAt: new Date() }).where(eq(passwordResetTokens.token, token));
  }

  // Email Verification Tokens
  async createEmailVerificationToken(bakerId: string, token: string, expiresAt: Date): Promise<void> {
    await db.insert(emailVerificationTokens).values({ bakerId, token, expiresAt });
  }

  async getEmailVerificationToken(token: string): Promise<{ id: string; bakerId: string; expiresAt: Date; usedAt: Date | null } | undefined> {
    const [result] = await db.select().from(emailVerificationTokens).where(eq(emailVerificationTokens.token, token));
    return result || undefined;
  }

  async markEmailVerificationTokenUsed(token: string): Promise<void> {
    await db.update(emailVerificationTokens).set({ usedAt: new Date() }).where(eq(emailVerificationTokens.token, token));
  }

  async markBakerEmailVerified(bakerId: string): Promise<void> {
    await db.update(bakers).set({ emailVerified: new Date() }).where(eq(bakers.id, bakerId));
  }

  // Admin
  async getAllBakers(): Promise<Baker[]> {
    return db.select().from(bakers).orderBy(desc(bakers.createdAt));
  }

  async getAdminPlatformStats(): Promise<{
    totalLeads: number;
    totalQuotes: number;
    totalOrders: number;
    platformRevenue: number;
    quotesThisMonth: number;
    leadsThisMonth: number;
  }> {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    const [leadsResult] = await db.select({ count: sql<number>`count(*)::int` }).from(leads);
    const [quotesResult] = await db.select({ count: sql<number>`count(*)::int` }).from(quotes);
    const [ordersResult] = await db.select({ count: sql<number>`count(*)::int` }).from(orders);
    const [revenueResult] = await db.select({ total: sql<string>`COALESCE(sum(amount), 0)` }).from(orders);
    
    const [quotesThisMonthResult] = await db.select({ count: sql<number>`count(*)::int` })
      .from(quotes)
      .where(gte(quotes.createdAt, startOfMonth));
    
    const [leadsThisMonthResult] = await db.select({ count: sql<number>`count(*)::int` })
      .from(leads)
      .where(gte(leads.createdAt, startOfMonth));
    
    return {
      totalLeads: leadsResult?.count || 0,
      totalQuotes: quotesResult?.count || 0,
      totalOrders: ordersResult?.count || 0,
      platformRevenue: Number(revenueResult?.total || 0),
      quotesThisMonth: quotesThisMonthResult?.count || 0,
      leadsThisMonth: leadsThisMonthResult?.count || 0,
    };
  }

  async getAdminEmailLogs(): Promise<BakerOnboardingEmail[]> {
    return db.select().from(bakerOnboardingEmails).orderBy(desc(bakerOnboardingEmails.sentAt)).limit(100);
  }

  async deleteOnboardingEmail(bakerId: string, emailDay: number): Promise<void> {
    await db.delete(bakerOnboardingEmails).where(
      and(
        eq(bakerOnboardingEmails.bakerId, bakerId),
        eq(bakerOnboardingEmails.emailDay, emailDay)
      )
    );
  }

  // Onboarding Emails
  async getOnboardingEmailsSent(bakerId: string): Promise<BakerOnboardingEmail[]> {
    return db.select().from(bakerOnboardingEmails).where(eq(bakerOnboardingEmails.bakerId, bakerId));
  }

  async hasOnboardingEmailBeenSent(bakerId: string, emailDay: number): Promise<boolean> {
    const [result] = await db.select().from(bakerOnboardingEmails).where(
      and(
        eq(bakerOnboardingEmails.bakerId, bakerId),
        eq(bakerOnboardingEmails.emailDay, emailDay)
      )
    );
    return !!result;
  }

  async recordOnboardingEmail(bakerId: string, emailDay: number, status: string, error?: string, emailKey?: string, stripeConnected?: boolean): Promise<void> {
    await db.insert(bakerOnboardingEmails).values({
      bakerId,
      emailDay,
      emailKey: emailKey || null,
      stripeConnected: stripeConnected ?? false,
      status,
      error: error || null,
    }).onConflictDoUpdate({
      target: [bakerOnboardingEmails.bakerId, bakerOnboardingEmails.emailDay],
      set: {
        status,
        emailKey: emailKey || null,
        stripeConnected: stripeConnected ?? false,
        error: error || null,
        sentAt: new Date(),
      },
    });
  }

  async getBakersForOnboardingEmails(targetDay: number): Promise<Baker[]> {
    // Get bakers who signed up at least targetDay days ago and haven't successfully received this email yet
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() - targetDay);
    
    // Get all bakers who signed up on or before the target date
    const eligibleBakers = await db.select().from(bakers).where(
      lte(bakers.createdAt, targetDate)
    );

    // Filter out bakers who have already successfully received this day's email
    const result: Baker[] = [];
    for (const baker of eligibleBakers) {
      // Check if there's a successful send for this day
      const successfullySent = await this.hasOnboardingEmailSucceeded(baker.id, targetDay);
      if (!successfullySent) {
        result.push(baker);
      }
    }

    return result;
  }

  async hasOnboardingEmailSucceeded(bakerId: string, emailDay: number): Promise<boolean> {
    const [result] = await db.select().from(bakerOnboardingEmails).where(
      and(
        eq(bakerOnboardingEmails.bakerId, bakerId),
        eq(bakerOnboardingEmails.emailDay, emailDay),
        eq(bakerOnboardingEmails.status, "sent")
      )
    );
    return !!result;
  }

  async setActivationTimestamp(bakerId: string, field: "stripeConnectedAt" | "firstProductCreatedAt" | "firstQuoteSentAt" | "firstInvoiceCreatedAt" | "firstPaymentProcessedAt"): Promise<void> {
    const baker = await this.getBaker(bakerId);
    if (!baker || baker[field]) return;
    await db.update(bakers).set({ [field]: new Date() } as any).where(eq(bakers.id, bakerId));
  }

  async getOnboardingEmailStats(): Promise<{ totalBakers: number; stripeConnectedWithin7Days: number; emailsSentByKey: Record<string, number> }> {
    const allBakersList = await db.select().from(bakers);
    const totalBakers = allBakersList.length;

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const stripeConnectedWithin7Days = allBakersList.filter(b => {
      if (!b.stripeConnectedAt || !b.createdAt) return false;
      const diff = b.stripeConnectedAt.getTime() - b.createdAt.getTime();
      return diff <= 7 * 24 * 60 * 60 * 1000;
    }).length;

    const allEmails = await db.select().from(bakerOnboardingEmails).where(eq(bakerOnboardingEmails.status, "sent"));
    const emailsSentByKey: Record<string, number> = {};
    for (const email of allEmails) {
      const key = email.emailKey || `day${email.emailDay}`;
      emailsSentByKey[key] = (emailsSentByKey[key] || 0) + 1;
    }

    return { totalBakers, stripeConnectedWithin7Days, emailsSentByKey };
  }

  async hasOnboardingEmailKeyBeenSent(bakerId: string, emailKey: string): Promise<boolean> {
    const [result] = await db.select().from(onboardingEmailSends).where(
      and(
        eq(onboardingEmailSends.bakerId, bakerId),
        eq(onboardingEmailSends.emailKey, emailKey)
      )
    );
    return !!result;
  }

  async recordOnboardingEmailSend(bakerId: string, emailKey: string, variant?: string, providerMessageId?: string): Promise<void> {
    await db.insert(onboardingEmailSends).values({
      bakerId,
      emailKey,
      variant: variant || null,
      providerMessageId: providerMessageId || null,
    }).onConflictDoNothing();
  }

  async deleteOnboardingEmailSend(bakerId: string, emailKey: string): Promise<void> {
    await db.delete(onboardingEmailSends).where(
      and(
        eq(onboardingEmailSends.bakerId, bakerId),
        eq(onboardingEmailSends.emailKey, emailKey)
      )
    );
  }

  // Pricing Calculations
  async getPricingCalculation(id: string): Promise<PricingCalculation | undefined> {
    const [calculation] = await db.select().from(pricingCalculations).where(eq(pricingCalculations.id, id));
    return calculation || undefined;
  }

  async getPricingCalculationsByBaker(bakerId: string): Promise<PricingCalculation[]> {
    return db.select().from(pricingCalculations)
      .where(eq(pricingCalculations.bakerId, bakerId))
      .orderBy(desc(pricingCalculations.createdAt));
  }

  async searchPricingCalculations(bakerId: string, query: string): Promise<PricingCalculation[]> {
    const searchPattern = `%${query.toLowerCase()}%`;
    return db.select().from(pricingCalculations)
      .where(and(
        eq(pricingCalculations.bakerId, bakerId),
        or(
          ilike(pricingCalculations.name, searchPattern),
          ilike(pricingCalculations.category, searchPattern),
          ilike(pricingCalculations.notes, searchPattern)
        )
      ))
      .orderBy(desc(pricingCalculations.createdAt));
  }

  async getFeaturedItemsByBaker(bakerId: string): Promise<PricingCalculation[]> {
    return db.select().from(pricingCalculations)
      .where(and(
        eq(pricingCalculations.bakerId, bakerId),
        eq(pricingCalculations.isFeatured, true)
      ))
      .orderBy(desc(pricingCalculations.createdAt));
  }

  async getPublicFeaturedItems(slug: string): Promise<PricingCalculation[]> {
    const baker = await this.getBakerBySlug(slug);
    if (!baker) return [];
    
    const now = new Date();
    return db.select().from(pricingCalculations)
      .where(and(
        eq(pricingCalculations.bakerId, baker.id),
        eq(pricingCalculations.isFeatured, true),
        or(
          isNull(pricingCalculations.featuredStartDate),
          lte(pricingCalculations.featuredStartDate, now)
        ),
        or(
          isNull(pricingCalculations.featuredEndDate),
          gte(pricingCalculations.featuredEndDate, now)
        )
      ))
      .orderBy(desc(pricingCalculations.createdAt));
  }

  async createPricingCalculation(calculation: InsertPricingCalculation): Promise<PricingCalculation> {
    const [created] = await db.insert(pricingCalculations).values(calculation).returning();
    return created;
  }

  async updatePricingCalculation(id: string, data: Partial<InsertPricingCalculation>): Promise<PricingCalculation | undefined> {
    const [updated] = await db.update(pricingCalculations)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(pricingCalculations.id, id))
      .returning();
    return updated || undefined;
  }

  async deletePricingCalculation(id: string): Promise<void> {
    await db.delete(pricingCalculations).where(eq(pricingCalculations.id, id));
  }

  // Support Tickets
  async getSupportTicket(id: string): Promise<SupportTicket | undefined> {
    const [ticket] = await db.select().from(supportTickets).where(eq(supportTickets.id, id));
    return ticket || undefined;
  }

  async getSupportTicketsByBaker(bakerId: string): Promise<SupportTicket[]> {
    return db.select().from(supportTickets)
      .where(eq(supportTickets.bakerId, bakerId))
      .orderBy(desc(supportTickets.createdAt));
  }

  async getAllSupportTickets(): Promise<(SupportTicket & { baker: { businessName: string; email: string }; messages: TicketMessage[] })[]> {
    const results = await db.select({
      ticket: supportTickets,
      baker: {
        businessName: bakers.businessName,
        email: bakers.email,
      }
    })
      .from(supportTickets)
      .leftJoin(bakers, eq(supportTickets.bakerId, bakers.id))
      .where(sql`${supportTickets.status} != 'archived'`)
      .orderBy(desc(supportTickets.createdAt));
    
    // Fetch messages for each ticket
    const ticketsWithMessages = await Promise.all(
      results.map(async r => {
        const messages = await this.getTicketMessages(r.ticket.id);
        return {
          ...r.ticket,
          baker: {
            businessName: r.baker?.businessName || 'Unknown',
            email: r.baker?.email || '',
          },
          messages,
        };
      })
    );
    
    return ticketsWithMessages;
  }

  async createSupportTicket(ticket: InsertSupportTicket): Promise<SupportTicket> {
    const [created] = await db.insert(supportTickets).values(ticket).returning();
    return created;
  }

  async updateSupportTicket(id: string, data: Partial<SupportTicket>): Promise<SupportTicket | undefined> {
    const [updated] = await db.update(supportTickets)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(supportTickets.id, id))
      .returning();
    return updated || undefined;
  }

  async getUnreadSupportMessageCount(bakerId: string): Promise<number> {
    // Get all baker's tickets
    const tickets = await db.select().from(supportTickets)
      .where(eq(supportTickets.bakerId, bakerId));
    
    let unreadCount = 0;
    
    for (const ticket of tickets) {
      // Get messages from admin or AI after baker's last read time
      const messages = await db.select().from(ticketMessages)
        .where(eq(ticketMessages.ticketId, ticket.id));
      
      const adminOrAiMessages = messages.filter(m => 
        m.senderType === "admin" || m.senderType === "ai"
      );
      
      if (!ticket.bakerLastReadAt) {
        // Baker has never read - count all admin/AI messages
        unreadCount += adminOrAiMessages.length;
      } else {
        // Count messages after last read
        unreadCount += adminOrAiMessages.filter(m => 
          new Date(m.createdAt) > new Date(ticket.bakerLastReadAt!)
        ).length;
      }
    }
    
    return unreadCount;
  }

  // Ticket Messages
  async getTicketMessages(ticketId: string): Promise<TicketMessage[]> {
    return db.select().from(ticketMessages)
      .where(eq(ticketMessages.ticketId, ticketId))
      .orderBy(ticketMessages.createdAt);
  }

  async createTicketMessage(message: InsertTicketMessage): Promise<TicketMessage> {
    const [created] = await db.insert(ticketMessages).values(message).returning();
    return created;
  }

  // Survey Responses
  async getSurveyResponseByBaker(bakerId: string): Promise<SurveyResponse | undefined> {
    const [response] = await db.select().from(surveyResponses).where(eq(surveyResponses.bakerId, bakerId));
    return response || undefined;
  }

  async createSurveyResponse(response: InsertSurveyResponse): Promise<SurveyResponse> {
    const [created] = await db.insert(surveyResponses).values(response).returning();
    return created;
  }

  async getAllSurveyResponses(): Promise<(SurveyResponse & { baker: { businessName: string; email: string } })[]> {
    const responses = await db.select().from(surveyResponses).orderBy(desc(surveyResponses.submittedAt));
    const result = [];
    for (const response of responses) {
      const baker = await this.getBaker(response.bakerId);
      if (baker) {
        result.push({
          ...response,
          baker: { businessName: baker.businessName, email: baker.email }
        });
      }
    }
    return result;
  }

  // Quote Payments
  async createQuotePayment(payment: InsertQuotePayment): Promise<QuotePayment> {
    const [created] = await db.insert(quotePayments).values(payment).returning();
    return created;
  }

  async getQuotePaymentsByQuote(quoteId: string): Promise<QuotePayment[]> {
    return db.select().from(quotePayments).where(eq(quotePayments.quoteId, quoteId)).orderBy(desc(quotePayments.createdAt));
  }

  async getQuotePaymentsByBaker(bakerId: string): Promise<(QuotePayment & { quoteTitle: string; quoteNumber: string; customerName: string })[]> {
    const results = await db
      .select({
        id: quotePayments.id,
        quoteId: quotePayments.quoteId,
        bakerId: quotePayments.bakerId,
        stripePaymentIntentId: quotePayments.stripePaymentIntentId,
        stripeChargeId: quotePayments.stripeChargeId,
        amount: quotePayments.amount,
        platformFee: quotePayments.platformFee,
        status: quotePayments.status,
        paymentType: quotePayments.paymentType,
        createdAt: quotePayments.createdAt,
        quoteTitle: quotes.title,
        quoteNumber: quotes.quoteNumber,
        customerName: customers.name,
      })
      .from(quotePayments)
      .innerJoin(quotes, eq(quotePayments.quoteId, quotes.id))
      .innerJoin(customers, eq(quotes.customerId, customers.id))
      .where(eq(quotePayments.bakerId, bakerId))
      .orderBy(desc(quotePayments.createdAt));
    return results;
  }

  async getAllQuotePayments(): Promise<(QuotePayment & { quoteTitle: string; quoteNumber: string; bakerName: string; customerName: string })[]> {
    const results = await db
      .select({
        id: quotePayments.id,
        quoteId: quotePayments.quoteId,
        bakerId: quotePayments.bakerId,
        stripePaymentIntentId: quotePayments.stripePaymentIntentId,
        stripeChargeId: quotePayments.stripeChargeId,
        amount: quotePayments.amount,
        platformFee: quotePayments.platformFee,
        status: quotePayments.status,
        paymentType: quotePayments.paymentType,
        createdAt: quotePayments.createdAt,
        quoteTitle: quotes.title,
        quoteNumber: quotes.quoteNumber,
        bakerName: bakers.businessName,
        customerName: customers.name,
      })
      .from(quotePayments)
      .innerJoin(quotes, eq(quotePayments.quoteId, quotes.id))
      .innerJoin(bakers, eq(quotePayments.bakerId, bakers.id))
      .innerJoin(customers, eq(quotes.customerId, customers.id))
      .orderBy(desc(quotePayments.createdAt));
    return results;
  }

  // Affiliates
  async getAffiliates(): Promise<Baker[]> {
    return await db.select().from(bakers).where(eq(bakers.isAffiliate, true));
  }

  async getAffiliateByCode(code: string): Promise<Baker | undefined> {
    const [baker] = await db.select().from(bakers).where(eq(bakers.affiliateCode, code));
    return baker;
  }

  async enableAffiliate(bakerId: string, code: string, commissionRate: string = "20.00", commissionMonths: number = 3): Promise<Baker | undefined> {
    const [updated] = await db.update(bakers).set({
      isAffiliate: true,
      affiliateCode: code,
      affiliateCommissionRate: commissionRate,
      affiliateCommissionMonths: commissionMonths,
    }).where(eq(bakers.id, bakerId)).returning();
    return updated;
  }

  async disableAffiliate(bakerId: string): Promise<Baker | undefined> {
    const [updated] = await db.update(bakers).set({
      isAffiliate: false,
    }).where(eq(bakers.id, bakerId)).returning();
    return updated;
  }

  // Referral clicks
  async createReferralClick(click: InsertReferralClick): Promise<ReferralClick> {
    const [created] = await db.insert(referralClicks).values(click).returning();
    return created;
  }

  async getReferralClickCount(affiliateCode: string): Promise<number> {
    const result = await db.select({ count: sql<number>`count(*)::int` }).from(referralClicks).where(eq(referralClicks.affiliateCode, affiliateCode));
    return result[0]?.count ?? 0;
  }

  // Affiliate commissions
  async createAffiliateCommission(commission: InsertAffiliateCommission): Promise<AffiliateCommission> {
    const [created] = await db.insert(affiliateCommissions).values(commission).returning();
    return created;
  }

  async getCommissionsByAffiliate(affiliateBakerId: string): Promise<AffiliateCommission[]> {
    return await db.select().from(affiliateCommissions).where(eq(affiliateCommissions.affiliateBakerId, affiliateBakerId)).orderBy(desc(affiliateCommissions.createdAt));
  }

  async getReferralsByAffiliate(affiliateBakerId: string): Promise<Baker[]> {
    return await db.select().from(bakers).where(eq(bakers.referredByAffiliateId, affiliateBakerId)).orderBy(desc(bakers.createdAt));
  }

  async getAllCommissions(): Promise<AffiliateCommission[]> {
    return await db.select().from(affiliateCommissions).orderBy(desc(affiliateCommissions.createdAt));
  }

  async updateCommissionStatus(commissionId: string, status: string, paidAt?: Date): Promise<AffiliateCommission | undefined> {
    const updateData: any = { status };
    if (paidAt) updateData.paidAt = paidAt;
    const [updated] = await db.update(affiliateCommissions).set(updateData).where(eq(affiliateCommissions.id, commissionId)).returning();
    return updated;
  }

  async getAffiliateStats(affiliateBakerId: string): Promise<{ totalClicks: number; totalConversions: number; totalEarnings: number; pendingEarnings: number }> {
    const baker = await this.getBaker(affiliateBakerId);
    if (!baker?.affiliateCode) return { totalClicks: 0, totalConversions: 0, totalEarnings: 0, pendingEarnings: 0 };

    const clicks = await this.getReferralClickCount(baker.affiliateCode);
    const referrals = await this.getReferralsByAffiliate(affiliateBakerId);
    const commissions = await this.getCommissionsByAffiliate(affiliateBakerId);

    const totalEarnings = commissions
      .filter(c => c.status === "paid" || c.status === "approved")
      .reduce((sum, c) => sum + parseFloat(c.commissionAmount), 0);
    const pendingEarnings = commissions
      .filter(c => c.status === "pending")
      .reduce((sum, c) => sum + parseFloat(c.commissionAmount), 0);

    return {
      totalClicks: clicks,
      totalConversions: referrals.length,
      totalEarnings,
      pendingEarnings,
    };
  }

  async getAffiliateBySlug(slug: string): Promise<Baker | undefined> {
    const [baker] = await db.select().from(bakers).where(eq(bakers.affiliateSlug, slug));
    return baker || undefined;
  }

  // Baker referrals
  async createBakerReferral(referral: InsertBakerReferral): Promise<BakerReferral> {
    const [created] = await db.insert(bakerReferrals).values(referral).returning();
    return created;
  }

  async getBakerReferralsByReferrer(bakerId: string): Promise<BakerReferral[]> {
    return await db.select().from(bakerReferrals).where(eq(bakerReferrals.referringBakerId, bakerId)).orderBy(desc(bakerReferrals.createdAt));
  }

  async getBakerByReferralCode(code: string): Promise<Baker | undefined> {
    const [baker] = await db.select().from(bakers).where(eq(bakers.referralCode, code));
    return baker || undefined;
  }

  async awardBakerReferralCredit(referralId: string, creditType: string): Promise<BakerReferral | undefined> {
    const [updated] = await db.update(bakerReferrals).set({
      creditAwarded: true,
      creditType,
      awardedAt: new Date(),
    }).where(eq(bakerReferrals.id, referralId)).returning();
    return updated;
  }

  async createAffiliateRequest(request: InsertAffiliateRequest): Promise<AffiliateRequest> {
    const [created] = await db.insert(affiliateRequests).values(request).returning();
    return created;
  }

  async getAffiliateRequests(status?: string): Promise<AffiliateRequest[]> {
    if (status) {
      return db.select().from(affiliateRequests).where(eq(affiliateRequests.status, status)).orderBy(desc(affiliateRequests.createdAt));
    }
    return db.select().from(affiliateRequests).orderBy(desc(affiliateRequests.createdAt));
  }

  async getAffiliateRequest(id: string): Promise<AffiliateRequest | undefined> {
    const [request] = await db.select().from(affiliateRequests).where(eq(affiliateRequests.id, id));
    return request || undefined;
  }

  async updateAffiliateRequest(id: string, updates: Partial<AffiliateRequest>): Promise<AffiliateRequest | undefined> {
    const [updated] = await db.update(affiliateRequests).set(updates).where(eq(affiliateRequests.id, id)).returning();
    return updated;
  }

  // Invitations
  async createInvitation(invitation: InsertInvitation): Promise<Invitation> {
    const [created] = await db.insert(invitations).values(invitation).returning();
    return created;
  }

  async getInvitations(): Promise<Invitation[]> {
    return db.select().from(invitations).orderBy(desc(invitations.createdAt));
  }

  async getInvitationByToken(token: string): Promise<Invitation | undefined> {
    const [invitation] = await db.select().from(invitations).where(eq(invitations.token, token));
    return invitation || undefined;
  }

  async getInvitationByEmail(email: string): Promise<Invitation | undefined> {
    const [invitation] = await db.select().from(invitations).where(eq(invitations.email, email));
    return invitation || undefined;
  }

  async updateInvitation(id: string, data: Partial<Invitation>): Promise<Invitation | undefined> {
    const [updated] = await db.update(invitations).set(data).where(eq(invitations.id, id)).returning();
    return updated || undefined;
  }
}

export const storage = new DatabaseStorage();

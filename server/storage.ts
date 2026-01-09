import {
  bakers,
  customers,
  leads,
  quotes,
  quoteItems,
  orders,
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
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, gte, lte, sql } from "drizzle-orm";

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
}

export const storage = new DatabaseStorage();

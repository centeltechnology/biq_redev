import { sql, relations } from "drizzle-orm";
import { pgTable, text, varchar, integer, decimal, date, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Bakers table
export const bakers = pgTable("bakers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  businessName: text("business_name").notNull(),
  slug: text("slug").notNull().unique(),
  phone: text("phone"),
  address: text("address"),
  // Payment options
  paymentZelle: text("payment_zelle"),
  paymentPaypal: text("payment_paypal"),
  paymentCashapp: text("payment_cashapp"),
  paymentVenmo: text("payment_venmo"),
  depositPercentage: integer("deposit_percentage").default(50),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const bakersRelations = relations(bakers, ({ many }) => ({
  customers: many(customers),
  leads: many(leads),
  quotes: many(quotes),
}));

// Customers table
export const customers = pgTable("customers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  bakerId: varchar("baker_id").notNull().references(() => bakers.id),
  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: text("phone"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const customersRelations = relations(customers, ({ one, many }) => ({
  baker: one(bakers, {
    fields: [customers.bakerId],
    references: [bakers.id],
  }),
  leads: many(leads),
  quotes: many(quotes),
}));

// Leads table
export const leads = pgTable("leads", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  bakerId: varchar("baker_id").notNull().references(() => bakers.id),
  customerId: varchar("customer_id").references(() => customers.id),
  customerName: text("customer_name").notNull(),
  customerEmail: text("customer_email").notNull(),
  customerPhone: text("customer_phone"),
  eventDate: date("event_date"),
  eventType: text("event_type"),
  guestCount: integer("guest_count"),
  calculatorPayload: jsonb("calculator_payload"),
  estimatedTotal: decimal("estimated_total", { precision: 10, scale: 2 }).notNull(),
  status: text("status").notNull().default("new"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const leadsRelations = relations(leads, ({ one }) => ({
  baker: one(bakers, {
    fields: [leads.bakerId],
    references: [bakers.id],
  }),
  customer: one(customers, {
    fields: [leads.customerId],
    references: [customers.id],
  }),
}));

// Quotes table
export const quotes = pgTable("quotes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  bakerId: varchar("baker_id").notNull().references(() => bakers.id),
  customerId: varchar("customer_id").notNull().references(() => customers.id),
  leadId: varchar("lead_id").references(() => leads.id),
  quoteNumber: text("quote_number").notNull(),
  title: text("title").notNull(),
  eventDate: date("event_date"),
  status: text("status").notNull().default("draft"),
  subtotal: decimal("subtotal", { precision: 10, scale: 2 }).notNull(),
  taxRate: decimal("tax_rate", { precision: 5, scale: 4 }).notNull().default("0.08"),
  taxAmount: decimal("tax_amount", { precision: 10, scale: 2 }).notNull(),
  total: decimal("total", { precision: 10, scale: 2 }).notNull(),
  notes: text("notes"),
  acceptedAt: timestamp("accepted_at"),
  paidAt: timestamp("paid_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const quotesRelations = relations(quotes, ({ one, many }) => ({
  baker: one(bakers, {
    fields: [quotes.bakerId],
    references: [bakers.id],
  }),
  customer: one(customers, {
    fields: [quotes.customerId],
    references: [customers.id],
  }),
  lead: one(leads, {
    fields: [quotes.leadId],
    references: [leads.id],
  }),
  items: many(quoteItems),
}));

// Quote Items table
export const quoteItems = pgTable("quote_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  quoteId: varchar("quote_id").notNull().references(() => quotes.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description"),
  quantity: integer("quantity").notNull().default(1),
  unitPrice: decimal("unit_price", { precision: 10, scale: 2 }).notNull(),
  totalPrice: decimal("total_price", { precision: 10, scale: 2 }).notNull(),
  category: text("category").notNull().default("other"),
  sortOrder: integer("sort_order").notNull().default(0),
});

export const quoteItemsRelations = relations(quoteItems, ({ one }) => ({
  quote: one(quotes, {
    fields: [quoteItems.quoteId],
    references: [quotes.id],
  }),
}));

// Orders table - for accepted/paid quotes
export const orders = pgTable("orders", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  bakerId: varchar("baker_id").notNull().references(() => bakers.id),
  quoteId: varchar("quote_id").notNull().references(() => quotes.id),
  customerId: varchar("customer_id").notNull().references(() => customers.id),
  eventDate: date("event_date"),
  title: text("title").notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  paymentMethod: text("payment_method").notNull(), // cash, zelle, paypal, cashapp, venmo
  paymentStatus: text("payment_status").notNull().default("paid"), // paid, partial, pending
  fulfillmentStatus: text("fulfillment_status").notNull().default("booked"), // booked, in_progress, completed, cancelled
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const ordersRelations = relations(orders, ({ one }) => ({
  baker: one(bakers, {
    fields: [orders.bakerId],
    references: [bakers.id],
  }),
  quote: one(quotes, {
    fields: [orders.quoteId],
    references: [quotes.id],
  }),
  customer: one(customers, {
    fields: [orders.customerId],
    references: [customers.id],
  }),
}));

// Insert Schemas
export const insertBakerSchema = createInsertSchema(bakers).omit({
  id: true,
  createdAt: true,
});

export const insertCustomerSchema = createInsertSchema(customers).omit({
  id: true,
  createdAt: true,
});

export const insertLeadSchema = createInsertSchema(leads).omit({
  id: true,
  createdAt: true,
});

export const insertQuoteSchema = createInsertSchema(quotes).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertQuoteItemSchema = createInsertSchema(quoteItems).omit({
  id: true,
});

export const insertOrderSchema = createInsertSchema(orders).omit({
  id: true,
  createdAt: true,
});

// Types
export type Baker = typeof bakers.$inferSelect;
export type InsertBaker = z.infer<typeof insertBakerSchema>;
export type Customer = typeof customers.$inferSelect;
export type InsertCustomer = z.infer<typeof insertCustomerSchema>;
export type Lead = typeof leads.$inferSelect;
export type InsertLead = z.infer<typeof insertLeadSchema>;
export type Quote = typeof quotes.$inferSelect;
export type InsertQuote = z.infer<typeof insertQuoteSchema>;
export type QuoteItem = typeof quoteItems.$inferSelect;
export type InsertQuoteItem = z.infer<typeof insertQuoteItemSchema>;
export type Order = typeof orders.$inferSelect;
export type InsertOrder = z.infer<typeof insertOrderSchema>;

// Calculator Configuration Types
export interface CakeTier {
  size: string;
  shape: string;
  flavor: string;
  frosting: string;
}

export interface CalculatorPayload {
  tiers: CakeTier[];
  decorations: string[];
  deliveryOption: string;
  deliveryAddress?: string;
  specialRequests?: string;
}

// Calculator Pricing Config
export const CAKE_SIZES = [
  { id: "6-round", label: '6" Round', servings: "10-12", basePrice: 45 },
  { id: "8-round", label: '8" Round', servings: "20-24", basePrice: 65 },
  { id: "10-round", label: '10" Round', servings: "35-40", basePrice: 95 },
  { id: "12-round", label: '12" Round', servings: "50-56", basePrice: 125 },
  { id: "quarter-sheet", label: "Quarter Sheet", servings: "20-24", basePrice: 55 },
  { id: "half-sheet", label: "Half Sheet", servings: "40-48", basePrice: 85 },
  { id: "full-sheet", label: "Full Sheet", servings: "80-96", basePrice: 145 },
] as const;

export const CAKE_SHAPES = [
  { id: "round", label: "Round", priceModifier: 0 },
  { id: "square", label: "Square", priceModifier: 10 },
  { id: "heart", label: "Heart", priceModifier: 15 },
  { id: "custom", label: "Custom", priceModifier: 25 },
] as const;

export const CAKE_FLAVORS = [
  { id: "vanilla", label: "Vanilla", priceModifier: 0 },
  { id: "chocolate", label: "Chocolate", priceModifier: 0 },
  { id: "red-velvet", label: "Red Velvet", priceModifier: 10 },
  { id: "lemon", label: "Lemon", priceModifier: 5 },
  { id: "marble", label: "Marble", priceModifier: 5 },
  { id: "carrot", label: "Carrot", priceModifier: 10 },
  { id: "funfetti", label: "Funfetti", priceModifier: 5 },
] as const;

export const FROSTING_TYPES = [
  { id: "buttercream", label: "Buttercream", priceModifier: 0 },
  { id: "cream-cheese", label: "Cream Cheese", priceModifier: 10 },
  { id: "fondant", label: "Fondant", priceModifier: 25 },
  { id: "ganache", label: "Ganache", priceModifier: 15 },
  { id: "whipped-cream", label: "Whipped Cream", priceModifier: 5 },
] as const;

export const DECORATIONS = [
  { id: "fresh-flowers", label: "Fresh Flowers", price: 35 },
  { id: "edible-flowers", label: "Edible Flowers", price: 25 },
  { id: "custom-topper", label: "Custom Cake Topper", price: 20 },
  { id: "edible-image", label: "Edible Image", price: 15 },
  { id: "gold-leaf", label: "Gold/Silver Leaf", price: 30 },
  { id: "sprinkles", label: "Sprinkles", price: 5 },
  { id: "fruit-topping", label: "Fruit Topping", price: 20 },
  { id: "chocolate-drip", label: "Chocolate Drip", price: 15 },
  { id: "macarons", label: "Macarons (6)", price: 18 },
  { id: "meringue-kisses", label: "Meringue Kisses", price: 12 },
] as const;

export const DELIVERY_OPTIONS = [
  { id: "pickup", label: "Pickup", price: 0 },
  { id: "local", label: "Local Delivery (within 15 miles)", price: 25 },
  { id: "extended", label: "Extended Delivery (15-30 miles)", price: 45 },
] as const;

export const EVENT_TYPES = [
  { id: "wedding", label: "Wedding" },
  { id: "birthday", label: "Birthday" },
  { id: "anniversary", label: "Anniversary" },
  { id: "corporate", label: "Corporate" },
  { id: "other", label: "Other" },
] as const;

export const LEAD_STATUSES = [
  { id: "new", label: "New", color: "blue" },
  { id: "contacted", label: "Contacted", color: "yellow" },
  { id: "quoted", label: "Quoted", color: "purple" },
  { id: "converted", label: "Converted", color: "green" },
  { id: "lost", label: "Lost", color: "gray" },
] as const;

export const QUOTE_STATUSES = [
  { id: "draft", label: "Draft", color: "gray" },
  { id: "sent", label: "Sent", color: "blue" },
  { id: "approved", label: "Approved", color: "green" },
  { id: "declined", label: "Declined", color: "red" },
] as const;

export const ORDER_PAYMENT_METHODS = [
  { id: "cash", label: "Cash" },
  { id: "zelle", label: "Zelle" },
  { id: "paypal", label: "PayPal" },
  { id: "cashapp", label: "Cash App" },
  { id: "venmo", label: "Venmo" },
] as const;

export const ORDER_PAYMENT_STATUSES = [
  { id: "paid", label: "Paid", color: "green" },
  { id: "partial", label: "Partial", color: "yellow" },
  { id: "pending", label: "Pending", color: "gray" },
] as const;

export const ORDER_FULFILLMENT_STATUSES = [
  { id: "booked", label: "Booked", color: "blue" },
  { id: "in_progress", label: "In Progress", color: "yellow" },
  { id: "completed", label: "Completed", color: "green" },
  { id: "cancelled", label: "Cancelled", color: "red" },
] as const;

export const DEFAULT_TAX_RATE = 0.08;

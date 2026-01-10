import { sql, relations } from "drizzle-orm";
import { pgTable, text, varchar, integer, decimal, date, timestamp, jsonb, uniqueIndex } from "drizzle-orm/pg-core";
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
  // Social media
  socialFacebook: text("social_facebook"),
  socialInstagram: text("social_instagram"),
  socialTiktok: text("social_tiktok"),
  socialPinterest: text("social_pinterest"),
  // Payment options
  paymentZelle: text("payment_zelle"),
  paymentPaypal: text("payment_paypal"),
  paymentCashapp: text("payment_cashapp"),
  paymentVenmo: text("payment_venmo"),
  depositPercentage: integer("deposit_percentage").default(50),
  // Calculator configuration - custom pricing overrides
  calculatorConfig: jsonb("calculator_config"),
  // Email verification
  emailVerified: timestamp("email_verified"),
  // Role for admin access
  role: text("role").notNull().default("baker"), // "baker" or "super_admin"
  // Subscription
  plan: text("plan").notNull().default("free"), // "free" or "pro"
  stripeCustomerId: text("stripe_customer_id"),
  stripeSubscriptionId: text("stripe_subscription_id"),
  // Email notification preferences
  notifyNewLead: integer("notify_new_lead").notNull().default(1),
  notifyQuoteViewed: integer("notify_quote_viewed").notNull().default(1),
  notifyQuoteAccepted: integer("notify_quote_accepted").notNull().default(1),
  // Onboarding tour status: "pending", "completed", "skipped"
  onboardingTourStatus: text("onboarding_tour_status").notNull().default("pending"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Password reset tokens table
export const passwordResetTokens = pgTable("password_reset_tokens", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  bakerId: varchar("baker_id").notNull().references(() => bakers.id),
  token: text("token").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  usedAt: timestamp("used_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Email verification tokens table
export const emailVerificationTokens = pgTable("email_verification_tokens", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  bakerId: varchar("baker_id").notNull().references(() => bakers.id),
  token: text("token").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  usedAt: timestamp("used_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Onboarding email tracking - tracks which onboarding emails have been sent to each baker
export const bakerOnboardingEmails = pgTable("baker_onboarding_emails", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  bakerId: varchar("baker_id").notNull().references(() => bakers.id),
  emailDay: integer("email_day").notNull(), // 0 = welcome, 1-7 = onboarding series
  sentAt: timestamp("sent_at").defaultNow().notNull(),
  status: text("status").notNull().default("sent"), // "sent", "failed"
  error: text("error"),
}, (table) => [
  uniqueIndex("baker_email_day_unique").on(table.bakerId, table.emailDay),
]);

export const bakerOnboardingEmailsRelations = relations(bakerOnboardingEmails, ({ one }) => ({
  baker: one(bakers, {
    fields: [bakerOnboardingEmails.bakerId],
    references: [bakers.id],
  }),
}));

export type BakerOnboardingEmail = typeof bakerOnboardingEmails.$inferSelect;
export type InsertBakerOnboardingEmail = typeof bakerOnboardingEmails.$inferInsert;

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

// Pricing Calculations table - for bakers to calculate and track their cost-based pricing
export const pricingCalculations = pgTable("pricing_calculations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  bakerId: varchar("baker_id").notNull().references(() => bakers.id),
  name: text("name").notNull(),
  category: text("category").notNull(), // "cake", "treat", "addon", "delivery"
  materialCost: decimal("material_cost", { precision: 10, scale: 2 }).notNull(),
  laborHours: decimal("labor_hours", { precision: 5, scale: 2 }).notNull(),
  hourlyRate: decimal("hourly_rate", { precision: 10, scale: 2 }).notNull(),
  overheadPercent: decimal("overhead_percent", { precision: 5, scale: 2 }).notNull().default("15"),
  suggestedPrice: decimal("suggested_price", { precision: 10, scale: 2 }).notNull(),
  appliedToItem: text("applied_to_item"), // e.g., "8-round" for cake size or "cupcakes-standard" for treat
  appliedToCategory: text("applied_to_category"), // "size", "treat", "addon", "delivery"
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const pricingCalculationsRelations = relations(pricingCalculations, ({ one }) => ({
  baker: one(bakers, {
    fields: [pricingCalculations.bakerId],
    references: [bakers.id],
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

export const insertPricingCalculationSchema = createInsertSchema(pricingCalculations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
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
export type PricingCalculation = typeof pricingCalculations.$inferSelect;
export type InsertPricingCalculation = z.infer<typeof insertPricingCalculationSchema>;

// Calculator Configuration Types
export interface CalculatorConfig {
  sizes?: { id: string; label: string; servings: string; basePrice: number; enabled?: boolean }[];
  shapes?: { id: string; label: string; priceModifier: number; enabled?: boolean }[];
  flavors?: { id: string; label: string; priceModifier: number; enabled?: boolean }[];
  frostings?: { id: string; label: string; priceModifier: number; enabled?: boolean }[];
  decorations?: { id: string; label: string; price: number; enabled?: boolean }[];
  deliveryOptions?: { id: string; label: string; price: number; enabled?: boolean }[];
  addons?: { id: string; label: string; price: number; pricingType: "flat" | "per-attendee"; minAttendees?: number; enabled?: boolean }[];
  treats?: { id: string; label: string; description: string; unitPrice: number; minQuantity: number; enabled?: boolean }[];
}

export interface CakeTier {
  size: string;
  shape: string;
  flavor: string;
  frosting: string;
}

export interface TreatSelection {
  id: string;
  quantity: number;
}

export interface CalculatorPayload {
  category: "cake" | "treat";
  // Cake-specific fields
  tiers?: CakeTier[];
  decorations?: string[];
  addons?: { id: string; quantity?: number; attendees?: number }[];
  // Treat-specific fields
  treats?: TreatSelection[];
  // Common fields
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
  { id: "setup", label: "Delivery + Setup", price: 75 },
] as const;

export const ADDONS = [
  { id: "dipped-strawberries", label: "Dipped Strawberries (dozen)", price: 35, pricingType: "flat" as const },
  { id: "chocolate-apples", label: "Chocolate Apples (6)", price: 30, pricingType: "flat" as const },
  { id: "candied-apples", label: "Candied Apples (6)", price: 28, pricingType: "flat" as const },
  { id: "full-sweets-table", label: "Full Sweets Table", price: 5, pricingType: "per-attendee" as const, minAttendees: 20 },
] as const;

// Treats - standalone treat items (not cake add-ons)
export const TREATS = [
  { id: "dipped-strawberries-dozen", label: "Chocolate Dipped Strawberries", description: "Per dozen", unitPrice: 35, minQuantity: 1 },
  { id: "dipped-strawberries-half", label: "Chocolate Dipped Strawberries", description: "Half dozen", unitPrice: 20, minQuantity: 1 },
  { id: "chocolate-apples", label: "Chocolate Covered Apples", description: "Per apple", unitPrice: 8, minQuantity: 3 },
  { id: "candied-apples", label: "Candied Apples", description: "Per apple", unitPrice: 6, minQuantity: 3 },
  { id: "cake-pops", label: "Cake Pops", description: "Per dozen", unitPrice: 30, minQuantity: 1 },
  { id: "cupcakes-standard", label: "Standard Cupcakes", description: "Per dozen", unitPrice: 36, minQuantity: 1 },
  { id: "cupcakes-gourmet", label: "Gourmet Cupcakes", description: "Per dozen", unitPrice: 48, minQuantity: 1 },
  { id: "cookies-decorated", label: "Decorated Sugar Cookies", description: "Per dozen", unitPrice: 42, minQuantity: 1 },
  { id: "cookies-plain", label: "Assorted Cookies", description: "Per dozen", unitPrice: 24, minQuantity: 1 },
  { id: "brownies", label: "Brownies", description: "Per dozen", unitPrice: 30, minQuantity: 1 },
  { id: "rice-treats", label: "Rice Crispy Treats", description: "Per dozen", unitPrice: 24, minQuantity: 1 },
  { id: "pretzel-rods", label: "Chocolate Pretzel Rods", description: "Per dozen", unitPrice: 18, minQuantity: 1 },
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

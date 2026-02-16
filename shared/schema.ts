import { sql, relations } from "drizzle-orm";
import { pgTable, text, varchar, integer, decimal, date, timestamp, jsonb, uniqueIndex, boolean } from "drizzle-orm/pg-core";
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
  customPaymentOptions: jsonb("custom_payment_options").$type<Array<{id: string; name: string; details: string}>>(),
  depositPercentage: integer("deposit_percentage").default(50),
  // Currency for all monetary displays (ISO 4217 code)
  currency: text("currency").notNull().default("USD"),
  // Default deposit type for Quick Order items: "full" = require full payment, "percentage" = use depositPercentage, "fixed" = use depositFixedAmount
  defaultDepositType: text("default_deposit_type").notNull().default("full"),
  depositFixedAmount: decimal("deposit_fixed_amount", { precision: 10, scale: 2 }),
  // Calculator configuration - custom pricing overrides
  calculatorConfig: jsonb("calculator_config"),
  // Email verification
  emailVerified: timestamp("email_verified"),
  // Role for admin access: "baker", "admin" (support/ops), or "super_admin"
  role: text("role").notNull().default("baker"),
  // Subscription
  plan: text("plan").notNull().default("free"), // "free" or "pro"
  stripeCustomerId: text("stripe_customer_id"),
  stripeSubscriptionId: text("stripe_subscription_id"),
  // Stripe Connect - for receiving payments from customers
  stripeConnectAccountId: text("stripe_connect_account_id"),
  stripeConnectOnboarded: boolean("stripe_connect_onboarded").default(false).notNull(),
  stripeConnectPayoutsEnabled: boolean("stripe_connect_payouts_enabled").default(false).notNull(),
  // Platform fee percentage (default 7% for free plan, computed dynamically by plan)
  platformFeePercent: decimal("platform_fee_percent", { precision: 5, scale: 2 }).default("7.00"),
  // Email notification preferences
  notifyNewLead: integer("notify_new_lead").notNull().default(1),
  notifyQuoteViewed: integer("notify_quote_viewed").notNull().default(1),
  notifyQuoteAccepted: integer("notify_quote_accepted").notNull().default(1),
  notifyOnboarding: integer("notify_onboarding").notNull().default(1),
  notifyRetention: integer("notify_retention").notNull().default(1),
  notifyAnnouncements: integer("notify_announcements").notNull().default(1),
  // Token for email preferences page (no login required)
  emailPrefsToken: text("email_prefs_token"),
  // Onboarding tour status: "pending", "completed", "skipped"
  onboardingTourStatus: text("onboarding_tour_status").notNull().default("pending"),
  // Quick Order item limit (null = unlimited)
  quickOrderItemLimit: integer("quick_order_item_limit"),
  // Account status
  suspended: boolean("suspended").default(false).notNull(),
  suspendedAt: timestamp("suspended_at"),
  suspendedReason: text("suspended_reason"),
  // Quote usage tracking
  quotesSentThisMonth: integer("quotes_sent_this_month").default(0).notNull(),
  quotesResetDate: timestamp("quotes_reset_date"),
  // Profile and portfolio images
  profilePhoto: text("profile_photo"),
  portfolioImages: text("portfolio_images").array(),
  calculatorHeaderImage: text("calculator_header_image"),
  socialBannerUrl: text("social_banner_url"),
  // Survey trial - free Pro access for completing feedback survey
  surveyTrialEndDate: timestamp("survey_trial_end_date"),
  // Affiliate program (influencer tier)
  isAffiliate: boolean("is_affiliate").default(false).notNull(),
  affiliateCode: text("affiliate_code").unique(),
  affiliateSlug: text("affiliate_slug").unique(),
  affiliateCommissionRate: decimal("affiliate_commission_rate", { precision: 5, scale: 2 }).default("20.00"),
  affiliateCommissionMonths: integer("affiliate_commission_months").default(3),
  affiliateStripeConnectId: text("affiliate_stripe_connect_id"),
  affiliateStripeConnectOnboarded: boolean("affiliate_stripe_connect_onboarded").default(false).notNull(),
  referredByAffiliateId: varchar("referred_by_affiliate_id"),
  referredAt: timestamp("referred_at"),
  // Baker referral program (all bakers)
  referralCode: text("referral_code").unique(),
  referralCredits: integer("referral_credits").default(0).notNull(),
  quickQuoteCredits: integer("quick_quote_credits").default(0).notNull(),
  referredByBakerId: varchar("referred_by_baker_id"),
  bakerReferredAt: timestamp("baker_referred_at"),
  // Stripe onboarding prompt tracking
  stripePromptLastShownAt: timestamp("stripe_prompt_last_shown_at"),
  // Activation tracking timestamps (set once on first occurrence)
  stripeConnectedAt: timestamp("stripe_connected_at"),
  firstProductCreatedAt: timestamp("first_product_created_at"),
  firstQuoteSentAt: timestamp("first_quote_sent_at"),
  firstInvoiceCreatedAt: timestamp("first_invoice_created_at"),
  firstPaymentProcessedAt: timestamp("first_payment_processed_at"),
  giftedPlan: text("gifted_plan"),
  giftedPlanExpiresAt: timestamp("gifted_plan_expires_at"),
  invitedByAdminId: varchar("invited_by_admin_id"),
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
  emailDay: integer("email_day").notNull(), // 0-6 onboarding series
  emailKey: text("email_key"), // e.g. "day0_welcome", "day4_stripe_reminder", "day4_deposit"
  stripeConnected: boolean("stripe_connected").default(false).notNull(), // Stripe status at time of send
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

export const onboardingEmailSends = pgTable("onboarding_email_sends", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  bakerId: varchar("baker_id").notNull().references(() => bakers.id),
  emailKey: text("email_key").notNull(),
  sentAt: timestamp("sent_at").defaultNow().notNull(),
  variant: text("variant"),
  providerMessageId: text("provider_message_id"),
}, (table) => [
  uniqueIndex("baker_email_key_unique").on(table.bakerId, table.emailKey),
]);

export type OnboardingEmailSend = typeof onboardingEmailSends.$inferSelect;
export type InsertOnboardingEmailSend = typeof onboardingEmailSends.$inferInsert;

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
  archivedAt: timestamp("archived_at"),
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
  source: text("source").default("calculator"),
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
  // Deposit override: "full" = require full payment (no deposit), "percentage" = use depositPercent, "fixed" = use depositAmount
  depositType: text("deposit_type"), // null = use baker default depositPercentage
  depositPercent: integer("deposit_percent"), // Percentage of total (e.g., 50)
  depositAmount: decimal("deposit_amount", { precision: 10, scale: 2 }), // Fixed deposit amount (e.g., 50.00)
  acceptedAt: timestamp("accepted_at"),
  paidAt: timestamp("paid_at"),
  // Stripe Connect payment tracking
  paymentStatus: text("payment_status").default("unpaid"), // unpaid, deposit_paid, paid
  stripePaymentIntentId: text("stripe_payment_intent_id"),
  amountPaid: decimal("amount_paid", { precision: 10, scale: 2 }).default("0"),
  archivedAt: timestamp("archived_at"),
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
  pricingCalculationId: varchar("pricing_calculation_id"),
  pricingSnapshot: jsonb("pricing_snapshot"),
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

// Quote Payments table - tracks individual payment transactions via Stripe Connect
export const quotePayments = pgTable("quote_payments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  quoteId: varchar("quote_id").notNull().references(() => quotes.id),
  bakerId: varchar("baker_id").notNull().references(() => bakers.id),
  stripePaymentIntentId: text("stripe_payment_intent_id").notNull(),
  stripeChargeId: text("stripe_charge_id"),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  platformFee: decimal("platform_fee", { precision: 10, scale: 2 }).notNull(),
  status: text("status").notNull().default("pending"), // pending, succeeded, failed, refunded
  paymentType: text("payment_type").notNull().default("deposit"), // deposit, full, remaining
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const quotePaymentsRelations = relations(quotePayments, ({ one }) => ({
  quote: one(quotes, {
    fields: [quotePayments.quoteId],
    references: [quotes.id],
  }),
  baker: one(bakers, {
    fields: [quotePayments.bakerId],
    references: [bakers.id],
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
  // Featured Items (Fast Quote) - Pro plan feature
  isFeatured: boolean("is_featured").default(false).notNull(),
  showOnQuickOrder: boolean("show_on_quick_order").default(true).notNull(), // Control visibility on public Quick Order menu
  featuredLabel: text("featured_label"), // Display label for public calculator (e.g., "Valentine's Special!")
  featuredDescription: text("featured_description"), // Public description
  featuredPrice: decimal("featured_price", { precision: 10, scale: 2 }), // Optional override price for featured item
  featuredImageUrl: text("featured_image_url"), // Optional image URL
  featuredStartDate: timestamp("featured_start_date"), // When to start showing
  featuredEndDate: timestamp("featured_end_date"), // When to stop showing
  // Deposit override for Quick Order: "full" = require full payment, "percentage" = use depositPercent, "fixed" = use depositAmount
  depositType: text("deposit_type"), // null = use baker default
  depositPercent: integer("deposit_percent"), // Percentage of featured price (e.g., 50)
  depositAmount: decimal("deposit_amount", { precision: 10, scale: 2 }), // Fixed deposit amount (e.g., 50.00)
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

export const insertQuotePaymentSchema = createInsertSchema(quotePayments).omit({
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
export type QuotePayment = typeof quotePayments.$inferSelect;
export type InsertQuotePayment = z.infer<typeof insertQuotePaymentSchema>;
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
  { id: "card", label: "Card (Stripe)" },
  { id: "cash", label: "Cash" },
  { id: "pending", label: "Pending" },
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

// Support Tickets table
export const supportTickets = pgTable("support_tickets", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  bakerId: varchar("baker_id").notNull().references(() => bakers.id),
  subject: text("subject").notNull(),
  status: text("status").notNull().default("open"), // "open", "in_progress", "resolved", "archived"
  priority: text("priority").notNull().default("normal"), // "low", "normal", "high"
  bakerLastReadAt: timestamp("baker_last_read_at"), // tracks when baker last read messages
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const supportTicketsRelations = relations(supportTickets, ({ one, many }) => ({
  baker: one(bakers, {
    fields: [supportTickets.bakerId],
    references: [bakers.id],
  }),
  messages: many(ticketMessages),
}));

// Ticket Messages table
export const ticketMessages = pgTable("ticket_messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  ticketId: varchar("ticket_id").notNull().references(() => supportTickets.id),
  senderType: text("sender_type").notNull(), // "baker", "admin", "ai"
  senderId: varchar("sender_id"), // bakerId for baker, null for AI, admin id for admin
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const ticketMessagesRelations = relations(ticketMessages, ({ one }) => ({
  ticket: one(supportTickets, {
    fields: [ticketMessages.ticketId],
    references: [supportTickets.id],
  }),
}));

export const insertSupportTicketSchema = createInsertSchema(supportTickets).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertTicketMessageSchema = createInsertSchema(ticketMessages).omit({
  id: true,
  createdAt: true,
});

export type SupportTicket = typeof supportTickets.$inferSelect;
export type InsertSupportTicket = z.infer<typeof insertSupportTicketSchema>;
export type TicketMessage = typeof ticketMessages.$inferSelect;
export type InsertTicketMessage = z.infer<typeof insertTicketMessageSchema>;

export const SUPPORT_TICKET_STATUSES = [
  { id: "open", label: "Open", color: "blue" },
  { id: "in_progress", label: "In Progress", color: "yellow" },
  { id: "resolved", label: "Resolved", color: "green" },
  { id: "archived", label: "Archived", color: "gray" },
] as const;

// ============================================
// RETENTION EMAIL SYSTEM
// ============================================

// User activity events - tracks all user actions for segmentation
export const userActivityEvents = pgTable("user_activity_events", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  bakerId: varchar("baker_id").notNull().references(() => bakers.id),
  eventType: text("event_type").notNull(), // e.g., "login", "quick_quote_configured", "lead_created", "quote_sent"
  eventData: jsonb("event_data"), // Optional additional data about the event
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const userActivityEventsRelations = relations(userActivityEvents, ({ one }) => ({
  baker: one(bakers, {
    fields: [userActivityEvents.bakerId],
    references: [bakers.id],
  }),
}));

// User activity event types
export const USER_ACTIVITY_EVENT_TYPES = [
  "login",
  "quick_quote_configured",
  "quick_quote_link_copied",
  "quick_quote_link_shared",
  "pricing_item_added",
  "pricing_item_updated",
  "lead_created",
  "lead_status_updated",
  "quote_created",
  "quote_sent",
  "quote_accepted",
  "quote_declined",
  "order_scheduled",
  "order_completed",
  "featured_item_added",
  "featured_item_updated",
  "onboarding_checklist_seen",
  "first_quote_cta_used",
] as const;

export type UserActivityEventType = typeof USER_ACTIVITY_EVENT_TYPES[number];

// Retention email templates - DB-backed editable templates
export const retentionEmailTemplates = pgTable("retention_email_templates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  segment: text("segment").notNull(), // e.g., "new_but_inactive", "configured_not_shared"
  name: text("name").notNull(), // Human-readable name
  subject: text("subject").notNull(), // Email subject (max 45 chars recommended)
  preheader: text("preheader"), // Email preheader text
  bodyHtml: text("body_html").notNull(), // HTML body with personalization tokens
  bodyText: text("body_text").notNull(), // Plain text fallback
  ctaText: text("cta_text").notNull(), // Call-to-action button text
  ctaRoute: text("cta_route").notNull(), // Deep link route (e.g., "/dashboard/pricing")
  isActive: boolean("is_active").notNull().default(true),
  priority: integer("priority").notNull().default(0), // Higher = sent first if multiple templates match
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertRetentionEmailTemplateSchema = createInsertSchema(retentionEmailTemplates).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type RetentionEmailTemplate = typeof retentionEmailTemplates.$inferSelect;
export type InsertRetentionEmailTemplate = z.infer<typeof insertRetentionEmailTemplateSchema>;

// Retention segments
export const RETENTION_SEGMENTS = [
  { id: "new_but_inactive", label: "New but Inactive", description: "Signed up >7 days ago, no key actions, low logins" },
  { id: "configured_not_shared", label: "Configured but Not Shared", description: "Quick quote configured but no link share events" },
  { id: "leads_no_quotes", label: "Leads but No Quotes", description: "Has leads but no quotes created/sent" },
  { id: "quotes_no_orders", label: "Quotes but No Orders", description: "Quotes sent but no orders/calendar usage" },
  { id: "active_power_user", label: "Active Power User", description: "Consistent weekly actions" },
  { id: "at_risk", label: "At Risk", description: "Previously active, no activity in last 14 days" },
] as const;

export type RetentionSegment = typeof RETENTION_SEGMENTS[number]["id"];

// Retention email sends - tracks sent emails for analytics
export const retentionEmailSends = pgTable("retention_email_sends", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  bakerId: varchar("baker_id").notNull().references(() => bakers.id),
  templateId: varchar("template_id").notNull().references(() => retentionEmailTemplates.id),
  segment: text("segment").notNull(), // Segment at time of send
  status: text("status").notNull().default("sent"), // "sent", "failed", "bounced"
  error: text("error"), // Error message if failed
  openedAt: timestamp("opened_at"), // When email was opened (via tracking pixel)
  clickedAt: timestamp("clicked_at"), // When CTA was clicked
  convertedAt: timestamp("converted_at"), // When target action was completed within 7 days
  conversionEventType: text("conversion_event_type"), // The event that counted as conversion
  sentAt: timestamp("sent_at").defaultNow().notNull(),
});

export const retentionEmailSendsRelations = relations(retentionEmailSends, ({ one }) => ({
  baker: one(bakers, {
    fields: [retentionEmailSends.bakerId],
    references: [bakers.id],
  }),
  template: one(retentionEmailTemplates, {
    fields: [retentionEmailSends.templateId],
    references: [retentionEmailTemplates.id],
  }),
}));

export const insertRetentionEmailSendSchema = createInsertSchema(retentionEmailSends).omit({
  id: true,
  sentAt: true,
});

export type RetentionEmailSend = typeof retentionEmailSends.$inferSelect;
export type InsertRetentionEmailSend = z.infer<typeof insertRetentionEmailSendSchema>;

// Survey responses - tracks feedback survey submissions
export const surveyResponses = pgTable("survey_responses", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  bakerId: varchar("baker_id").notNull().references(() => bakers.id),
  // Multiple choice questions
  signupReason: text("signup_reason"), // Why did you sign up?
  setupBlocker: text("setup_blocker"), // What stopped you from setting up?
  mostValuableFeature: text("most_valuable_feature"), // Which feature interests you most?
  businessStage: text("business_stage"), // Where is your business at?
  // Open-ended feedback
  additionalFeedback: text("additional_feedback"),
  // Metadata
  trialGranted: boolean("trial_granted").default(false).notNull(),
  submittedAt: timestamp("submitted_at").defaultNow().notNull(),
});

export const surveyResponsesRelations = relations(surveyResponses, ({ one }) => ({
  baker: one(bakers, {
    fields: [surveyResponses.bakerId],
    references: [bakers.id],
  }),
}));

export const insertSurveyResponseSchema = createInsertSchema(surveyResponses).omit({
  id: true,
  submittedAt: true,
});

export type SurveyResponse = typeof surveyResponses.$inferSelect;
export type InsertSurveyResponse = z.infer<typeof insertSurveyResponseSchema>;

// ============================================
// BAKER REFERRAL PROGRAM
// ============================================

// Baker referrals - tracks when a baker refers another baker
export const bakerReferrals = pgTable("baker_referrals", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  referringBakerId: varchar("referring_baker_id").notNull().references(() => bakers.id),
  referredBakerId: varchar("referred_baker_id").notNull().references(() => bakers.id),
  creditAwarded: boolean("credit_awarded").default(false).notNull(),
  creditType: text("credit_type"), // "subscription" or "quick_quote"
  awardedAt: timestamp("awarded_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertBakerReferralSchema = createInsertSchema(bakerReferrals).omit({
  id: true,
  createdAt: true,
});

export type BakerReferral = typeof bakerReferrals.$inferSelect;
export type InsertBakerReferral = z.infer<typeof insertBakerReferralSchema>;

// ============================================
// AFFILIATE PROGRAM (INFLUENCER TIER)
// ============================================

// Referral clicks - tracks when someone clicks an affiliate link
export const referralClicks = pgTable("referral_clicks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  affiliateCode: text("affiliate_code").notNull(),
  ipHash: text("ip_hash"),
  referrerUrl: text("referrer_url"),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Affiliate commissions - tracks commission earned on referred baker subscriptions
export const affiliateCommissions = pgTable("affiliate_commissions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  affiliateBakerId: varchar("affiliate_baker_id").notNull().references(() => bakers.id),
  referredBakerId: varchar("referred_baker_id").notNull().references(() => bakers.id),
  stripeInvoiceId: text("stripe_invoice_id"),
  subscriptionAmount: decimal("subscription_amount", { precision: 10, scale: 2 }).notNull(),
  commissionRate: decimal("commission_rate", { precision: 5, scale: 2 }).notNull(),
  commissionAmount: decimal("commission_amount", { precision: 10, scale: 2 }).notNull(),
  monthNumber: integer("month_number").notNull(), // 1, 2, or 3
  status: text("status").notNull().default("pending"), // pending, approved, paid
  paidAt: timestamp("paid_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const affiliateCommissionsRelations = relations(affiliateCommissions, ({ one }) => ({
  affiliate: one(bakers, {
    fields: [affiliateCommissions.affiliateBakerId],
    references: [bakers.id],
    relationName: "affiliateCommissions",
  }),
  referredBaker: one(bakers, {
    fields: [affiliateCommissions.referredBakerId],
    references: [bakers.id],
    relationName: "referredCommissions",
  }),
}));

export const insertReferralClickSchema = createInsertSchema(referralClicks).omit({
  id: true,
  createdAt: true,
});

export const insertAffiliateCommissionSchema = createInsertSchema(affiliateCommissions).omit({
  id: true,
  createdAt: true,
});

export type ReferralClick = typeof referralClicks.$inferSelect;
export type InsertReferralClick = z.infer<typeof insertReferralClickSchema>;
export type AffiliateCommission = typeof affiliateCommissions.$inferSelect;
export type InsertAffiliateCommission = z.infer<typeof insertAffiliateCommissionSchema>;

export const affiliateRequests = pgTable("affiliate_requests", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  email: text("email").notNull(),
  socialMedia: text("social_media").notNull(),
  followers: text("followers"),
  niche: text("niche"),
  message: text("message"),
  status: text("status").notNull().default("pending"),
  adminNotes: text("admin_notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  reviewedAt: timestamp("reviewed_at"),
});

export const insertAffiliateRequestSchema = createInsertSchema(affiliateRequests).omit({
  id: true,
  status: true,
  adminNotes: true,
  createdAt: true,
  reviewedAt: true,
});

export type AffiliateRequest = typeof affiliateRequests.$inferSelect;
export type InsertAffiliateRequest = z.infer<typeof insertAffiliateRequestSchema>;

export const adminAuditLogs = pgTable("admin_audit_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  adminUserId: varchar("admin_user_id").notNull(),
  actionKey: text("action_key").notNull(),
  targetId: text("target_id"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type AdminAuditLog = typeof adminAuditLogs.$inferSelect;

export const invitations = pgTable("invitations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull(),
  role: text("role").notNull().default("baker"),
  giftedPlan: text("gifted_plan"),
  giftedPlanDurationMonths: integer("gifted_plan_duration_months"),
  token: text("token").notNull().unique(),
  status: text("status").notNull().default("pending"),
  invitedByAdminId: varchar("invited_by_admin_id").notNull(),
  acceptedByBakerId: varchar("accepted_by_baker_id"),
  acceptedAt: timestamp("accepted_at"),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertInvitationSchema = createInsertSchema(invitations).omit({
  id: true,
  status: true,
  acceptedByBakerId: true,
  acceptedAt: true,
  createdAt: true,
});

export type Invitation = typeof invitations.$inferSelect;
export type InsertInvitation = z.infer<typeof insertInvitationSchema>;

export const adminEmails = pgTable("admin_emails", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  subject: text("subject").notNull(),
  bodyContent: text("body_content").notNull(),
  status: text("status").notNull().default("draft"),
  targetAudience: jsonb("target_audience").$type<string[]>(),
  sentAt: timestamp("sent_at"),
  sentCount: integer("sent_count").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertAdminEmailSchema = createInsertSchema(adminEmails).omit({
  id: true,
  sentAt: true,
  sentCount: true,
  createdAt: true,
  updatedAt: true,
});

export type AdminEmail = typeof adminEmails.$inferSelect;
export type InsertAdminEmail = z.infer<typeof insertAdminEmailSchema>;

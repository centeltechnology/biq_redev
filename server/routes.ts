import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import session from "express-session";
import bcrypt from "bcrypt";
import { storage } from "./storage";
import { z } from "zod";
import { pool } from "./db";
import connectPgSimple from "connect-pg-simple";
import { sendNewLeadNotification, sendLeadConfirmationToCustomer, sendPasswordResetEmail, sendEmailVerification, sendQuoteNotification } from "./email";
import crypto from "crypto";
import { getUncachableStripeClient, getStripePublishableKey } from "./stripeClient";
import { db } from "./db";
import { sql } from "drizzle-orm";

const FREE_LEAD_LIMIT = 10;

const PgSession = connectPgSimple(session);

declare module "express-session" {
  interface SessionData {
    bakerId?: string;
  }
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
}

function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.session.bakerId) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  next();
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Session setup
  app.use(
    session({
      store: new PgSession({
        pool,
        tableName: "session",
        createTableIfMissing: true,
      }),
      secret: process.env.SESSION_SECRET || "bakeriq-secret-key-dev",
      resave: false,
      saveUninitialized: false,
      cookie: {
        secure: process.env.NODE_ENV === "production",
        httpOnly: true,
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      },
    })
  );

  // Auth Routes
  app.post("/api/auth/register", async (req, res) => {
    try {
      const schema = z.object({
        email: z.string().email(),
        password: z.string().min(8),
        businessName: z.string().min(2),
      });

      const data = schema.parse(req.body);

      const existingBaker = await storage.getBakerByEmail(data.email);
      if (existingBaker) {
        return res.status(400).json({ message: "Email already registered" });
      }

      let slug = slugify(data.businessName);
      let slugExists = await storage.getBakerBySlug(slug);
      let suffix = 1;
      while (slugExists) {
        slug = `${slugify(data.businessName)}-${suffix}`;
        slugExists = await storage.getBakerBySlug(slug);
        suffix++;
      }

      const passwordHash = await bcrypt.hash(data.password, 10);

      const baker = await storage.createBaker({
        email: data.email,
        passwordHash,
        businessName: data.businessName,
        slug,
      });

      // Send email verification
      const verifyToken = crypto.randomBytes(32).toString("hex");
      const verifyExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
      await storage.createEmailVerificationToken(baker.id, verifyToken, verifyExpiresAt);
      
      const baseUrl = `https://${req.get("host")}`;
      try {
        await sendEmailVerification(baker.email, verifyToken, baseUrl);
      } catch (emailError) {
        console.error("Failed to send verification email:", emailError);
      }

      req.session.bakerId = baker.id;
      res.json({ baker: { ...baker, passwordHash: undefined } });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      res.status(500).json({ message: "Registration failed" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const schema = z.object({
        email: z.string().email(),
        password: z.string(),
      });

      const data = schema.parse(req.body);

      const baker = await storage.getBakerByEmail(data.email);
      if (!baker) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      const validPassword = await bcrypt.compare(data.password, baker.passwordHash);
      if (!validPassword) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      req.session.bakerId = baker.id;
      res.json({ baker: { ...baker, passwordHash: undefined } });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      res.status(500).json({ message: "Login failed" });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: "Logout failed" });
      }
      res.clearCookie("connect.sid");
      res.json({ message: "Logged out" });
    });
  });

  // Forgot Password
  app.post("/api/auth/forgot-password", async (req, res) => {
    try {
      const { email } = z.object({ email: z.string().email() }).parse(req.body);
      
      const baker = await storage.getBakerByEmail(email);
      if (!baker) {
        return res.json({ message: "If an account exists, a reset link has been sent" });
      }

      const token = crypto.randomBytes(32).toString("hex");
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      await storage.createPasswordResetToken(baker.id, token, expiresAt);

      const baseUrl = `https://${req.get("host")}`;
      await sendPasswordResetEmail(email, token, baseUrl);

      res.json({ message: "If an account exists, a reset link has been sent" });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      res.status(500).json({ message: "Failed to process request" });
    }
  });

  // Reset Password
  app.post("/api/auth/reset-password", async (req, res) => {
    try {
      const schema = z.object({
        token: z.string(),
        password: z.string().min(8, "Password must be at least 8 characters"),
      });
      const { token, password } = schema.parse(req.body);

      const resetToken = await storage.getPasswordResetToken(token);
      if (!resetToken || resetToken.usedAt || new Date() > resetToken.expiresAt) {
        return res.status(400).json({ message: "Invalid or expired reset link" });
      }

      const passwordHash = await bcrypt.hash(password, 10);
      await storage.updateBaker(resetToken.bakerId, { passwordHash });
      await storage.markPasswordResetTokenUsed(token);

      res.json({ message: "Password has been reset successfully" });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      res.status(500).json({ message: "Failed to reset password" });
    }
  });

  // Verify Email
  app.get("/api/auth/verify-email", async (req, res) => {
    try {
      const token = req.query.token as string;
      if (!token) {
        return res.status(400).json({ message: "Verification token is required" });
      }

      const verifyToken = await storage.getEmailVerificationToken(token);
      if (!verifyToken || verifyToken.usedAt || new Date() > verifyToken.expiresAt) {
        return res.status(400).json({ message: "Invalid or expired verification link" });
      }

      await storage.markBakerEmailVerified(verifyToken.bakerId);
      await storage.markEmailVerificationTokenUsed(token);

      res.json({ message: "Email verified successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to verify email" });
    }
  });

  // Resend verification email
  app.post("/api/auth/resend-verification", requireAuth, async (req, res) => {
    try {
      const baker = await storage.getBaker(req.session.bakerId!);
      if (!baker) {
        return res.status(404).json({ message: "Baker not found" });
      }

      if (baker.emailVerified) {
        return res.json({ message: "Email is already verified" });
      }

      const token = crypto.randomBytes(32).toString("hex");
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

      await storage.createEmailVerificationToken(baker.id, token, expiresAt);

      const baseUrl = `https://${req.get("host")}`;
      await sendEmailVerification(baker.email, token, baseUrl);

      res.json({ message: "Verification email sent" });
    } catch (error) {
      res.status(500).json({ message: "Failed to send verification email" });
    }
  });

  app.get("/api/auth/session", async (req, res) => {
    if (!req.session.bakerId) {
      return res.json(null);
    }

    const baker = await storage.getBaker(req.session.bakerId);
    if (!baker) {
      return res.json(null);
    }

    res.json({ baker: { ...baker, passwordHash: undefined } });
  });

  app.post("/api/auth/change-password", requireAuth, async (req, res) => {
    try {
      const schema = z.object({
        currentPassword: z.string(),
        newPassword: z.string().min(8),
      });

      const data = schema.parse(req.body);
      const baker = await storage.getBaker(req.session.bakerId!);

      if (!baker) {
        return res.status(404).json({ message: "Baker not found" });
      }

      const validPassword = await bcrypt.compare(data.currentPassword, baker.passwordHash);
      if (!validPassword) {
        return res.status(400).json({ message: "Current password is incorrect" });
      }

      const passwordHash = await bcrypt.hash(data.newPassword, 10);
      await storage.updateBaker(baker.id, { passwordHash });

      res.json({ message: "Password changed successfully" });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      res.status(500).json({ message: "Password change failed" });
    }
  });

  // Baker Profile
  app.get("/api/bakers/me", requireAuth, async (req, res) => {
    const baker = await storage.getBaker(req.session.bakerId!);
    if (!baker) {
      return res.status(404).json({ message: "Baker not found" });
    }
    res.json({ ...baker, passwordHash: undefined });
  });

  app.patch("/api/bakers/me", requireAuth, async (req, res) => {
    try {
      const schema = z.object({
        businessName: z.string().min(2).optional(),
        email: z.string().email().optional(),
        phone: z.string().optional(),
        address: z.string().optional(),
        paymentZelle: z.string().optional().nullable(),
        paymentPaypal: z.string().optional().nullable(),
        paymentCashapp: z.string().optional().nullable(),
        paymentVenmo: z.string().optional().nullable(),
        depositPercentage: z.number().min(0).max(100).optional().nullable(),
        socialFacebook: z.string().optional().nullable(),
        socialInstagram: z.string().optional().nullable(),
        socialTiktok: z.string().optional().nullable(),
        socialPinterest: z.string().optional().nullable(),
        notifyNewLead: z.number().min(0).max(1).optional(),
        notifyQuoteViewed: z.number().min(0).max(1).optional(),
        notifyQuoteAccepted: z.number().min(0).max(1).optional(),
      });

      const data = schema.parse(req.body);
      const baker = await storage.updateBaker(req.session.bakerId!, data);

      if (!baker) {
        return res.status(404).json({ message: "Baker not found" });
      }

      res.json({ ...baker, passwordHash: undefined });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      res.status(500).json({ message: "Update failed" });
    }
  });

  // Dashboard Stats
  app.get("/api/dashboard/stats", requireAuth, async (req, res) => {
    const stats = await storage.getDashboardStats(req.session.bakerId!);
    res.json(stats);
  });

  // Leads
  app.get("/api/leads", requireAuth, async (req, res) => {
    const leads = await storage.getLeadsByBaker(req.session.bakerId!);
    res.json(leads);
  });

  app.get("/api/leads/:id", requireAuth, async (req, res) => {
    const lead = await storage.getLead(req.params.id);
    if (!lead || lead.bakerId !== req.session.bakerId) {
      return res.status(404).json({ message: "Lead not found" });
    }
    res.json(lead);
  });

  app.patch("/api/leads/:id", requireAuth, async (req, res) => {
    try {
      const existingLead = await storage.getLead(req.params.id);
      if (!existingLead || existingLead.bakerId !== req.session.bakerId) {
        return res.status(404).json({ message: "Lead not found" });
      }

      const schema = z.object({
        status: z.string().optional(),
        notes: z.string().optional(),
      });

      const data = schema.parse(req.body);
      const lead = await storage.updateLead(req.params.id, data);

      res.json(lead);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      res.status(500).json({ message: "Update failed" });
    }
  });

  // Quotes
  app.get("/api/quotes", requireAuth, async (req, res) => {
    const quotes = await storage.getQuotesWithCustomer(req.session.bakerId!);
    res.json(quotes);
  });

  app.get("/api/quotes/:id", requireAuth, async (req, res) => {
    const quote = await storage.getQuoteWithItems(req.params.id);
    if (!quote || quote.bakerId !== req.session.bakerId) {
      return res.status(404).json({ message: "Quote not found" });
    }
    res.json(quote);
  });

  app.post("/api/quotes", requireAuth, async (req, res) => {
    try {
      const schema = z.object({
        title: z.string().min(1),
        customerId: z.string(),
        eventDate: z.string().optional(),
        status: z.string().default("draft"),
        taxRate: z.number().default(0.08),
        notes: z.string().optional(),
        items: z.array(
          z.object({
            name: z.string(),
            description: z.string().optional(),
            quantity: z.number().default(1),
            unitPrice: z.number(),
            category: z.string().default("other"),
          })
        ).default([]),
      });

      const data = schema.parse(req.body);
      const bakerId = req.session.bakerId!;

      // Calculate totals
      const subtotal = data.items.reduce(
        (sum, item) => sum + item.quantity * item.unitPrice,
        0
      );
      const taxAmount = subtotal * data.taxRate;
      const total = subtotal + taxAmount;

      const quoteNumber = await storage.getNextQuoteNumber(bakerId);

      const quote = await storage.createQuote({
        bakerId,
        customerId: data.customerId,
        quoteNumber,
        title: data.title,
        eventDate: data.eventDate || null,
        status: data.status,
        subtotal: subtotal.toFixed(2),
        taxRate: data.taxRate.toFixed(4),
        taxAmount: taxAmount.toFixed(2),
        total: total.toFixed(2),
        notes: data.notes || null,
      });

      // Create quote items
      for (let i = 0; i < data.items.length; i++) {
        const item = data.items[i];
        await storage.createQuoteItem({
          quoteId: quote.id,
          name: item.name,
          description: item.description || null,
          quantity: item.quantity,
          unitPrice: item.unitPrice.toFixed(2),
          totalPrice: (item.quantity * item.unitPrice).toFixed(2),
          category: item.category,
          sortOrder: i,
        });
      }

      const quoteWithItems = await storage.getQuoteWithItems(quote.id);
      res.json(quoteWithItems);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      console.error("Quote creation error:", error);
      res.status(500).json({ message: "Failed to create quote" });
    }
  });

  app.patch("/api/quotes/:id", requireAuth, async (req, res) => {
    try {
      const existingQuote = await storage.getQuote(req.params.id);
      if (!existingQuote || existingQuote.bakerId !== req.session.bakerId) {
        return res.status(404).json({ message: "Quote not found" });
      }

      const schema = z.object({
        title: z.string().min(1).optional(),
        customerId: z.string().optional(),
        eventDate: z.string().optional().nullable(),
        status: z.string().optional(),
        taxRate: z.number().optional(),
        notes: z.string().optional().nullable(),
        items: z.array(
          z.object({
            id: z.string().optional(),
            name: z.string(),
            description: z.string().optional(),
            quantity: z.number().default(1),
            unitPrice: z.number(),
            category: z.string().default("other"),
          })
        ).optional(),
      });

      const data = schema.parse(req.body);

      // Calculate totals if items are provided
      let subtotal = Number(existingQuote.subtotal);
      let taxRate = data.taxRate ?? Number(existingQuote.taxRate);

      if (data.items) {
        subtotal = data.items.reduce(
          (sum, item) => sum + item.quantity * item.unitPrice,
          0
        );
      }

      const taxAmount = subtotal * taxRate;
      const total = subtotal + taxAmount;

      // Check if status is being changed to "approved"
      const isBeingApproved = data.status === "approved" && existingQuote.status !== "approved";
      
      const quote = await storage.updateQuote(req.params.id, {
        title: data.title,
        customerId: data.customerId,
        eventDate: data.eventDate,
        status: data.status,
        subtotal: subtotal.toFixed(2),
        taxRate: taxRate.toFixed(4),
        taxAmount: taxAmount.toFixed(2),
        total: total.toFixed(2),
        notes: data.notes,
        // Set timestamps when approving
        ...(isBeingApproved ? { acceptedAt: new Date(), paidAt: new Date() } : {}),
      });

      // Auto-create order when quote is approved (if no order exists for this quote)
      if (isBeingApproved) {
        const existingOrder = await storage.getOrderByQuoteId(req.params.id);
        if (!existingOrder) {
          // Use updated values if provided, otherwise fall back to existing quote values
          const orderTitle = data.title || existingQuote.title;
          const orderEventDate = data.eventDate !== undefined ? data.eventDate : existingQuote.eventDate;
          const orderCustomerId = data.customerId || existingQuote.customerId;
          
          await storage.createOrder({
            bakerId: req.session.bakerId!,
            quoteId: req.params.id,
            customerId: orderCustomerId,
            eventDate: orderEventDate,
            title: orderTitle,
            amount: total.toFixed(2),
            paymentMethod: "cash", // Default payment method
            paymentStatus: "paid",
            fulfillmentStatus: "booked",
            notes: null,
          });
        }
      }

      // Update items if provided
      if (data.items) {
        await storage.deleteQuoteItemsByQuote(req.params.id);
        for (let i = 0; i < data.items.length; i++) {
          const item = data.items[i];
          await storage.createQuoteItem({
            quoteId: req.params.id,
            name: item.name,
            description: item.description || null,
            quantity: item.quantity,
            unitPrice: item.unitPrice.toFixed(2),
            totalPrice: (item.quantity * item.unitPrice).toFixed(2),
            category: item.category,
            sortOrder: i,
          });
        }
      }

      const quoteWithItems = await storage.getQuoteWithItems(req.params.id);
      res.json(quoteWithItems);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      console.error("Quote update error:", error);
      res.status(500).json({ message: "Failed to update quote" });
    }
  });

  app.delete("/api/quotes/:id", requireAuth, async (req, res) => {
    const quote = await storage.getQuote(req.params.id);
    if (!quote || quote.bakerId !== req.session.bakerId) {
      return res.status(404).json({ message: "Quote not found" });
    }

    await storage.deleteQuote(req.params.id);
    res.json({ message: "Quote deleted" });
  });

  app.post("/api/quotes/:id/duplicate", requireAuth, async (req, res) => {
    try {
      const existingQuote = await storage.getQuoteWithItems(req.params.id);
      if (!existingQuote || existingQuote.bakerId !== req.session.bakerId) {
        return res.status(404).json({ message: "Quote not found" });
      }

      const bakerId = req.session.bakerId!;
      const quoteNumber = await storage.getNextQuoteNumber(bakerId);

      const newQuote = await storage.createQuote({
        bakerId,
        customerId: existingQuote.customerId,
        quoteNumber,
        title: `${existingQuote.title} (Copy)`,
        eventDate: existingQuote.eventDate,
        status: "draft",
        subtotal: existingQuote.subtotal,
        taxRate: existingQuote.taxRate,
        taxAmount: existingQuote.taxAmount,
        total: existingQuote.total,
        notes: existingQuote.notes,
      });

      for (const item of existingQuote.items) {
        await storage.createQuoteItem({
          quoteId: newQuote.id,
          name: item.name,
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          totalPrice: item.totalPrice,
          category: item.category,
          sortOrder: item.sortOrder,
        });
      }

      const quoteWithItems = await storage.getQuoteWithItems(newQuote.id);
      res.json(quoteWithItems);
    } catch (error) {
      console.error("Quote duplicate error:", error);
      res.status(500).json({ message: "Failed to duplicate quote" });
    }
  });

  // Send quote via email
  app.post("/api/quotes/:id/send", requireAuth, async (req, res) => {
    try {
      const quote = await storage.getQuoteWithItems(req.params.id);
      if (!quote || quote.bakerId !== req.session.bakerId) {
        return res.status(404).json({ message: "Quote not found" });
      }

      const customer = await storage.getCustomer(quote.customerId);
      if (!customer) {
        return res.status(400).json({ message: "Customer not found" });
      }

      const baker = await storage.getBaker(req.session.bakerId!);
      if (!baker) {
        return res.status(400).json({ message: "Baker not found" });
      }

      await sendQuoteNotification(
        customer.email,
        customer.name,
        baker.businessName,
        {
          quoteNumber: quote.quoteNumber,
          total: parseFloat(quote.total || "0"),
          notes: quote.notes || undefined,
        }
      );

      await storage.updateQuote(quote.id, { status: "sent" });

      const updatedQuote = await storage.getQuoteWithItems(quote.id);
      res.json(updatedQuote);
    } catch (error) {
      console.error("Send quote error:", error);
      res.status(500).json({ message: "Failed to send quote" });
    }
  });

  // Customers
  app.get("/api/customers", requireAuth, async (req, res) => {
    const customers = await storage.getCustomersWithQuotes(req.session.bakerId!);
    res.json(customers);
  });

  app.post("/api/customers", requireAuth, async (req, res) => {
    try {
      const schema = z.object({
        name: z.string().min(1),
        email: z.string().email(),
        phone: z.string().optional(),
      });

      const data = schema.parse(req.body);
      const bakerId = req.session.bakerId!;

      const existingCustomer = await storage.getCustomerByEmail(bakerId, data.email);
      if (existingCustomer) {
        return res.status(400).json({ message: "Customer with this email already exists" });
      }

      const customer = await storage.createCustomer({
        bakerId,
        name: data.name,
        email: data.email,
        phone: data.phone || null,
      });

      res.json(customer);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      res.status(500).json({ message: "Failed to create customer" });
    }
  });

  // Orders Routes
  app.get("/api/orders", requireAuth, async (req, res) => {
    try {
      const { month, year } = req.query;
      let ordersList;
      
      if (month && year) {
        ordersList = await storage.getOrdersByMonth(
          req.session.bakerId!,
          parseInt(year as string),
          parseInt(month as string)
        );
      } else {
        ordersList = await storage.getOrdersWithCustomer(req.session.bakerId!);
      }
      
      res.json(ordersList);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch orders" });
    }
  });

  app.get("/api/orders/stats", requireAuth, async (req, res) => {
    try {
      const stats = await storage.getOrderStats(req.session.bakerId!);
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch order stats" });
    }
  });

  app.get("/api/orders/upcoming", requireAuth, async (req, res) => {
    try {
      const upcomingOrders = await storage.getUpcomingOrders(req.session.bakerId!);
      res.json(upcomingOrders);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch upcoming orders" });
    }
  });

  app.get("/api/orders/:id", requireAuth, async (req, res) => {
    const order = await storage.getOrder(req.params.id);
    if (!order || order.bakerId !== req.session.bakerId) {
      return res.status(404).json({ message: "Order not found" });
    }
    res.json(order);
  });

  app.post("/api/orders", requireAuth, async (req, res) => {
    try {
      const schema = z.object({
        quoteId: z.string(),
        paymentMethod: z.string(),
        paymentStatus: z.string().optional(),
        notes: z.string().optional(),
      });

      const data = schema.parse(req.body);

      // Get the quote to copy details
      const quote = await storage.getQuote(data.quoteId);
      if (!quote || quote.bakerId !== req.session.bakerId) {
        return res.status(404).json({ message: "Quote not found" });
      }

      // Determine the effective payment status (defaults to "paid")
      const effectivePaymentStatus = data.paymentStatus || "paid";
      
      // Update quote status to approved and set timestamps
      await storage.updateQuote(data.quoteId, { 
        status: "approved",
        acceptedAt: new Date(),
        ...(effectivePaymentStatus === "paid" ? { paidAt: new Date() } : {})
      });

      const order = await storage.createOrder({
        bakerId: req.session.bakerId!,
        quoteId: data.quoteId,
        customerId: quote.customerId,
        eventDate: quote.eventDate,
        title: quote.title,
        amount: quote.total,
        paymentMethod: data.paymentMethod,
        paymentStatus: effectivePaymentStatus,
        fulfillmentStatus: "booked",
        notes: data.notes || null,
      });

      res.json(order);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      console.error("Order creation error:", error);
      res.status(500).json({ message: "Failed to create order" });
    }
  });

  app.patch("/api/orders/:id", requireAuth, async (req, res) => {
    try {
      const existingOrder = await storage.getOrder(req.params.id);
      if (!existingOrder || existingOrder.bakerId !== req.session.bakerId) {
        return res.status(404).json({ message: "Order not found" });
      }

      const schema = z.object({
        paymentStatus: z.string().optional(),
        fulfillmentStatus: z.string().optional(),
        notes: z.string().optional(),
      });

      const data = schema.parse(req.body);
      
      // Update paidAt on the quote when payment status changes to paid
      if (data.paymentStatus === "paid" && existingOrder.paymentStatus !== "paid") {
        await storage.updateQuote(existingOrder.quoteId, { paidAt: new Date() });
      }
      
      const order = await storage.updateOrder(req.params.id, data);
      res.json(order);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      res.status(500).json({ message: "Failed to update order" });
    }
  });

  app.delete("/api/orders/:id", requireAuth, async (req, res) => {
    const order = await storage.getOrder(req.params.id);
    if (!order || order.bakerId !== req.session.bakerId) {
      return res.status(404).json({ message: "Order not found" });
    }
    await storage.deleteOrder(req.params.id);
    res.json({ success: true });
  });

  // Public Routes
  app.get("/api/public/baker/:slug", async (req, res) => {
    const baker = await storage.getBakerBySlug(req.params.slug);
    if (!baker) {
      return res.status(404).json({ message: "Baker not found" });
    }
    res.json({
      id: baker.id,
      businessName: baker.businessName,
      phone: baker.phone,
      address: baker.address,
      slug: baker.slug,
      socialFacebook: baker.socialFacebook,
      socialInstagram: baker.socialInstagram,
      socialTiktok: baker.socialTiktok,
      socialPinterest: baker.socialPinterest,
    });
  });

  app.post("/api/public/calculator/submit", async (req, res) => {
    try {
      const tenant = req.query.tenant as string;
      if (!tenant) {
        return res.status(400).json({ message: "Tenant slug is required" });
      }

      const baker = await storage.getBakerBySlug(tenant);
      if (!baker) {
        return res.status(404).json({ message: "Baker not found" });
      }

      // Check lead limit for free plan
      if (baker.plan === "free" || !baker.plan) {
        const monthlyLeadCount = await storage.getMonthlyLeadCount(baker.id);
        if (monthlyLeadCount >= FREE_LEAD_LIMIT) {
          return res.status(403).json({ 
            message: "Lead limit reached", 
            limitReached: true,
            limit: FREE_LEAD_LIMIT,
            count: monthlyLeadCount
          });
        }
      }

      const schema = z.object({
        customerName: z.string().min(2),
        customerEmail: z.string().email(),
        customerPhone: z.string().min(10),
        eventType: z.string().optional(),
        eventDate: z.string().optional().nullable(),
        guestCount: z.number().optional().nullable(),
        calculatorPayload: z.any(),
        estimatedTotal: z.string(),
      });

      const data = schema.parse(req.body);

      // Check if customer exists, create if not
      let customer = await storage.getCustomerByEmail(baker.id, data.customerEmail);
      if (!customer) {
        customer = await storage.createCustomer({
          bakerId: baker.id,
          name: data.customerName,
          email: data.customerEmail,
          phone: data.customerPhone,
        });
      }

      const lead = await storage.createLead({
        bakerId: baker.id,
        customerId: customer.id,
        customerName: data.customerName,
        customerEmail: data.customerEmail,
        customerPhone: data.customerPhone,
        eventType: data.eventType || null,
        eventDate: data.eventDate || null,
        guestCount: data.guestCount || null,
        calculatorPayload: data.calculatorPayload,
        estimatedTotal: data.estimatedTotal,
        status: "new",
      });

      // Send email notifications (non-blocking)
      const estimatedTotal = parseFloat(data.estimatedTotal);
      Promise.all([
        sendNewLeadNotification(baker.email, baker.businessName, {
          customerName: data.customerName,
          customerEmail: data.customerEmail,
          customerPhone: data.customerPhone,
          eventType: data.eventType,
          eventDate: data.eventDate || undefined,
          estimatedTotal,
        }),
        sendLeadConfirmationToCustomer(data.customerEmail, data.customerName, baker.businessName, {
          eventType: data.eventType,
          eventDate: data.eventDate || undefined,
          estimatedTotal,
        }),
      ]).catch((err) => console.error("Email notification error:", err));

      res.json({ success: true, leadId: lead.id });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      console.error("Calculator submit error:", error);
      res.status(500).json({ message: "Failed to submit calculator" });
    }
  });

  // Stripe Subscription Routes
  app.get("/api/stripe/publishable-key", async (req, res) => {
    try {
      const key = await getStripePublishableKey();
      res.json({ publishableKey: key });
    } catch (error) {
      res.status(500).json({ message: "Failed to get Stripe key" });
    }
  });

  app.get("/api/subscription/status", requireAuth, async (req, res) => {
    const baker = await storage.getBaker(req.session.bakerId!);
    if (!baker) {
      return res.status(404).json({ message: "Baker not found" });
    }

    const monthlyLeadCount = await storage.getMonthlyLeadCount(baker.id);
    
    res.json({
      plan: baker.plan || "free",
      monthlyLeadCount,
      leadLimit: FREE_LEAD_LIMIT,
      isAtLimit: (baker.plan === "free" || !baker.plan) && monthlyLeadCount >= FREE_LEAD_LIMIT,
    });
  });

  app.post("/api/subscription/checkout", requireAuth, async (req, res) => {
    try {
      const baker = await storage.getBaker(req.session.bakerId!);
      if (!baker) {
        return res.status(404).json({ message: "Baker not found" });
      }

      const stripe = await getUncachableStripeClient();

      // Create or get Stripe customer
      let customerId = baker.stripeCustomerId;
      if (!customerId) {
        const customer = await stripe.customers.create({
          email: baker.email,
          metadata: { bakerId: baker.id },
        });
        await storage.updateBaker(baker.id, { stripeCustomerId: customer.id });
        customerId = customer.id;
      }

      // Get the Pro price from Stripe
      const prices = await stripe.prices.list({
        lookup_keys: ["bakeriq_pro_monthly"],
        active: true,
        limit: 1,
      });

      let priceId: string;
      if (prices.data.length > 0) {
        priceId = prices.data[0].id;
      } else {
        // Fallback: search for any active BakerIQ Pro price
        const products = await stripe.products.search({ query: "name:'BakerIQ Pro'" });
        if (products.data.length === 0) {
          return res.status(400).json({ message: "No subscription product found. Please run the seed script." });
        }
        const productPrices = await stripe.prices.list({
          product: products.data[0].id,
          active: true,
          limit: 1,
        });
        if (productPrices.data.length === 0) {
          return res.status(400).json({ message: "No price found for subscription." });
        }
        priceId = productPrices.data[0].id;
      }

      // Create checkout session
      const baseUrl = `https://${req.get("host")}`;
      const session = await stripe.checkout.sessions.create({
        customer: customerId,
        payment_method_types: ["card"],
        line_items: [{ price: priceId, quantity: 1 }],
        mode: "subscription",
        success_url: `${baseUrl}/settings?subscription=success`,
        cancel_url: `${baseUrl}/settings?subscription=cancelled`,
        metadata: { bakerId: baker.id },
      });

      res.json({ url: session.url });
    } catch (error: any) {
      console.error("Checkout error:", error);
      res.status(500).json({ message: "Failed to create checkout session" });
    }
  });

  app.post("/api/subscription/portal", requireAuth, async (req, res) => {
    try {
      const baker = await storage.getBaker(req.session.bakerId!);
      if (!baker?.stripeCustomerId) {
        return res.status(400).json({ message: "No subscription found" });
      }

      const stripe = await getUncachableStripeClient();
      const baseUrl = `https://${req.get("host")}`;
      
      const session = await stripe.billingPortal.sessions.create({
        customer: baker.stripeCustomerId,
        return_url: `${baseUrl}/settings`,
      });

      res.json({ url: session.url });
    } catch (error: any) {
      console.error("Portal error:", error);
      res.status(500).json({ message: "Failed to create billing portal session" });
    }
  });

  // Webhook handling for subscription updates (called by stripe-replit-sync)
  app.post("/api/subscription/webhook-update", async (req, res) => {
    try {
      const { customerId, subscriptionId, status } = req.body;
      
      // Find baker by Stripe customer ID
      const allBakers = await storage.getAllBakers();
      const baker = allBakers.find(b => b.stripeCustomerId === customerId);
      
      if (baker) {
        const plan = status === "active" || status === "trialing" ? "pro" : "free";
        await storage.updateBaker(baker.id, {
          stripeSubscriptionId: subscriptionId,
          plan,
        });
      }
      
      res.json({ received: true });
    } catch (error) {
      console.error("Webhook update error:", error);
      res.status(500).json({ message: "Failed to process webhook" });
    }
  });

  // Super Admin Routes
  async function requireAdmin(req: Request, res: Response, next: NextFunction) {
    if (!req.session.bakerId) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const baker = await storage.getBaker(req.session.bakerId);
    if (!baker || baker.role !== "super_admin") {
      return res.status(403).json({ message: "Admin access required" });
    }
    next();
  }

  app.get("/api/admin/bakers", requireAdmin, async (req, res) => {
    const allBakers = await storage.getAllBakers();
    res.json(allBakers.map(b => ({ ...b, passwordHash: undefined })));
  });

  app.patch("/api/admin/bakers/:id", requireAdmin, async (req, res) => {
    try {
      const schema = z.object({
        role: z.enum(["baker", "super_admin"]).optional(),
        businessName: z.string().optional(),
        email: z.string().email().optional(),
      });
      const data = schema.parse(req.body);
      
      const updated = await storage.updateBaker(req.params.id, data);
      if (!updated) {
        return res.status(404).json({ message: "Baker not found" });
      }
      res.json({ ...updated, passwordHash: undefined });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      res.status(500).json({ message: "Failed to update baker" });
    }
  });

  app.delete("/api/admin/bakers/:id", requireAdmin, async (req, res) => {
    const baker = await storage.getBaker(req.params.id);
    if (!baker) {
      return res.status(404).json({ message: "Baker not found" });
    }
    if (baker.id === req.session.bakerId) {
      return res.status(400).json({ message: "Cannot delete your own account" });
    }
    // Note: In production, you'd want to handle cascading deletes properly
    res.json({ message: "Baker deleted" });
  });

  app.get("/api/admin/stats", requireAdmin, async (req, res) => {
    const allBakers = await storage.getAllBakers();
    const totalBakers = allBakers.length;
    const verifiedBakers = allBakers.filter(b => b.emailVerified).length;
    res.json({ totalBakers, verifiedBakers });
  });

  // Seed demo baker on startup
  const existingDemo = await storage.getBakerByEmail("demo@bakeriq.app");
  if (!existingDemo) {
    const passwordHash = await bcrypt.hash("demo123", 10);
    await storage.createBaker({
      email: "demo@bakeriq.app",
      passwordHash,
      businessName: "Sweet Dreams Bakery",
      slug: "sweet-dreams-bakery",
      phone: "(555) 123-4567",
      address: "123 Bakery Lane, Sweet Town, CA 90210",
    });
    console.log("Demo baker created: demo@bakeriq.app / demo123");
  }

  return httpServer;
}

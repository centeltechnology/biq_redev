import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import session from "express-session";
import bcrypt from "bcrypt";
import { storage } from "./storage";
import { z } from "zod";
import { pool } from "./db";
import connectPgSimple from "connect-pg-simple";
import { sendNewLeadNotification, sendLeadConfirmationToCustomer, sendPasswordResetEmail, sendEmailVerification, sendQuoteNotification, sendOnboardingEmail, sendQuoteResponseNotification, sendAdminPasswordReset } from "./email";
import crypto from "crypto";
import { getUncachableStripeClient, getStripePublishableKey } from "./stripeClient";
import { db } from "./db";
import { sql } from "drizzle-orm";
import { CAKE_SIZES, CAKE_SHAPES, CAKE_FLAVORS, FROSTING_TYPES, DECORATIONS, DELIVERY_OPTIONS, ADDONS } from "@shared/schema";

// Quote limits per plan (monthly)
const FREE_QUOTE_LIMIT = 5;
const BASIC_QUOTE_LIMIT = 15;
// Pro plan has unlimited quotes

const PgSession = connectPgSimple(session);

declare module "express-session" {
  interface SessionData {
    bakerId?: string;
    impersonatedBy?: string;
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
  // Trust proxy for production (Replit runs behind a reverse proxy)
  if (process.env.NODE_ENV === "production") {
    app.set("trust proxy", 1);
  }

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
        sameSite: "lax",
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

      // Send welcome onboarding email (day 0)
      try {
        const welcomeSent = await sendOnboardingEmail(baker.email, baker.businessName, 0, baseUrl);
        if (welcomeSent) {
          await storage.recordOnboardingEmail(baker.id, 0, "sent");
        } else {
          await storage.recordOnboardingEmail(baker.id, 0, "failed", "Email send returned false");
        }
      } catch (emailError: any) {
        console.error("Failed to send welcome email:", emailError);
        await storage.recordOnboardingEmail(baker.id, 0, "failed", emailError?.message || "Unknown error");
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
        defaultDepositType: z.enum(["full", "percentage", "fixed"]).optional(),
        depositFixedAmount: z.string().optional().nullable(),
        socialFacebook: z.string().optional().nullable(),
        socialInstagram: z.string().optional().nullable(),
        socialTiktok: z.string().optional().nullable(),
        socialPinterest: z.string().optional().nullable(),
        notifyNewLead: z.number().min(0).max(1).optional(),
        notifyQuoteViewed: z.number().min(0).max(1).optional(),
        notifyQuoteAccepted: z.number().min(0).max(1).optional(),
        calculatorConfig: z.any().optional(),
        quickOrderItemLimit: z.number().min(1).max(100).optional().nullable(),
      }).refine((data) => {
        // Validate fixed deposit amount when fixed type is selected
        if (data.defaultDepositType === "fixed") {
          const amount = parseFloat(data.depositFixedAmount || "0");
          return amount > 0;
        }
        return true;
      }, {
        message: "Fixed deposit amount must be greater than 0",
        path: ["depositFixedAmount"],
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

  // Onboarding Tour Status
  app.patch("/api/baker/onboarding-tour", requireAuth, async (req, res) => {
    try {
      const schema = z.object({
        status: z.enum(["pending", "completed", "skipped"]),
      });

      const data = schema.parse(req.body);
      const baker = await storage.updateBaker(req.session.bakerId!, {
        onboardingTourStatus: data.status,
      });

      if (!baker) {
        return res.status(404).json({ message: "Baker not found" });
      }

      res.json({ success: true });
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
        leadId: z.string().optional().nullable(),
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
        leadId: data.leadId || null,
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

      // Check if status is being changed to "approved" or "rejected"
      const isBeingApproved = data.status === "approved" && existingQuote.status !== "approved";
      const isBeingRejected = data.status === "rejected" && existingQuote.status !== "rejected";
      
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
        // Auto-update linked lead status to "converted"
        if (existingQuote.leadId) {
          await storage.updateLead(existingQuote.leadId, { status: "converted" });
        }
        
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

      // Auto-update linked lead status to "lost" when quote is rejected
      if (isBeingRejected && existingQuote.leadId) {
        await storage.updateLead(existingQuote.leadId, { status: "lost" });
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
      const bakerId = req.session.bakerId!;
      const baker = await storage.getBaker(bakerId);
      if (!baker) {
        return res.status(400).json({ message: "Baker not found" });
      }

      // Check quote limit for the baker's plan
      const plan = baker.plan || "free";
      let quoteLimit: number | null = FREE_QUOTE_LIMIT;
      if (plan === "basic") {
        quoteLimit = BASIC_QUOTE_LIMIT;
      } else if (plan === "pro") {
        quoteLimit = null; // unlimited
      }
      
      if (quoteLimit !== null) {
        const monthlyQuoteCount = await storage.getMonthlyQuoteCount(bakerId);
        if (monthlyQuoteCount >= quoteLimit) {
          return res.status(403).json({
            message: "Quote limit reached",
            limitReached: true,
            limit: quoteLimit,
            count: monthlyQuoteCount,
            plan,
          });
        }
      }

      const quote = await storage.getQuoteWithItems(req.params.id);
      if (!quote || quote.bakerId !== bakerId) {
        return res.status(404).json({ message: "Quote not found" });
      }

      const customer = await storage.getCustomer(quote.customerId);
      if (!customer) {
        return res.status(400).json({ message: "Customer not found" });
      }

      const baseUrl = process.env.REPLIT_DEV_DOMAIN 
        ? `https://${process.env.REPLIT_DEV_DOMAIN}`
        : process.env.REPLIT_DOMAINS 
          ? `https://${process.env.REPLIT_DOMAINS.split(",")[0]}`
          : "https://bakeriq.app";
      
      await sendQuoteNotification(
        customer.email,
        customer.name,
        baker.businessName,
        {
          email: baker.email,
          phone: baker.phone,
          address: baker.address,
        },
        {
          quoteNumber: quote.quoteNumber,
          total: parseFloat(quote.total || "0"),
          subtotal: parseFloat(quote.subtotal || "0"),
          taxAmount: parseFloat(quote.taxAmount || "0"),
          taxRate: parseFloat(quote.taxRate || "0"),
          eventDate: quote.eventDate || undefined,
          notes: quote.notes || undefined,
          items: quote.items || [],
          depositPercentage: baker.depositPercentage || undefined,
          viewUrl: `${baseUrl}/q/${quote.id}`,
        }
      );

      await storage.updateQuote(quote.id, { status: "sent" });

      // Auto-update linked lead status to "quoted"
      if (quote.leadId) {
        await storage.updateLead(quote.leadId, { status: "quoted" });
      }

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

  app.post("/api/customers/with-lead", requireAuth, async (req, res) => {
    try {
      const schema = z.object({
        customer: z.object({
          name: z.string().min(1),
          email: z.string().email(),
          phone: z.string().optional(),
          eventType: z.string().optional(),
          eventDate: z.string().optional(),
        }),
        cakeDetails: z.object({
          tiers: z.array(z.object({
            size: z.string(),
            shape: z.string(),
            flavor: z.string(),
            frosting: z.string(),
          })),
          decorations: z.array(z.string()),
          addons: z.array(z.object({
            id: z.string(),
            quantity: z.number().optional(),
            attendees: z.number().optional(),
          })),
          deliveryOption: z.string(),
          deliveryAddress: z.string().optional(),
          specialRequests: z.string().optional(),
        }).optional(),
      });

      const data = schema.parse(req.body);
      const bakerId = req.session.bakerId!;

      let customer = await storage.getCustomerByEmail(bakerId, data.customer.email);
      if (!customer) {
        customer = await storage.createCustomer({
          bakerId,
          name: data.customer.name,
          email: data.customer.email,
          phone: data.customer.phone || null,
        });
      } else if (data.customer.name !== customer.name || (data.customer.phone || null) !== customer.phone) {
        customer = await storage.updateCustomer(customer.id, {
          name: data.customer.name,
          phone: data.customer.phone || null,
        });
      }

      let leadId: string | undefined;
      if (data.cakeDetails) {
        let total = 0;
        for (const tier of data.cakeDetails.tiers) {
          const size = CAKE_SIZES.find(s => s.id === tier.size);
          const shape = CAKE_SHAPES.find(s => s.id === tier.shape);
          const flavor = CAKE_FLAVORS.find(f => f.id === tier.flavor);
          const frosting = FROSTING_TYPES.find(f => f.id === tier.frosting);
          total += (size?.basePrice || 0) + (shape?.priceModifier || 0) + (flavor?.priceModifier || 0) + (frosting?.priceModifier || 0);
        }
        for (const decId of data.cakeDetails.decorations) {
          const dec = DECORATIONS.find(d => d.id === decId);
          total += dec?.price || 0;
        }
        for (const addon of data.cakeDetails.addons) {
          const addonDef = ADDONS.find(a => a.id === addon.id);
          if (addonDef) total += addonDef.price * (addon.quantity || 1);
        }
        const delivery = DELIVERY_OPTIONS.find(d => d.id === data.cakeDetails!.deliveryOption);
        total += delivery?.price || 0;
        
        const lead = await storage.createLead({
          bakerId,
          customerId: customer.id,
          customerName: data.customer.name,
          customerEmail: data.customer.email,
          customerPhone: data.customer.phone || null,
          eventType: data.customer.eventType || null,
          eventDate: data.customer.eventDate || null,
          calculatorPayload: data.cakeDetails,
          estimatedTotal: total.toFixed(2),
          status: "new",
        });
        leadId = lead.id;
      }

      res.json({ customerId: customer.id, leadId });
    } catch (error: any) {
      console.error("Create customer with lead error:", error);
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

  // Pricing Calculator Routes
  app.get("/api/pricing-calculations", requireAuth, async (req, res) => {
    try {
      const calculations = await storage.getPricingCalculationsByBaker(req.session.bakerId!);
      res.json(calculations);
    } catch (error) {
      console.error("Error fetching pricing calculations:", error);
      res.status(500).json({ message: "Failed to fetch pricing calculations" });
    }
  });

  app.get("/api/pricing-calculations/search", requireAuth, async (req, res) => {
    try {
      const query = (req.query.q as string) || "";
      const calculations = query.trim() 
        ? await storage.searchPricingCalculations(req.session.bakerId!, query)
        : await storage.getPricingCalculationsByBaker(req.session.bakerId!);
      res.json(calculations);
    } catch (error) {
      console.error("Error searching pricing calculations:", error);
      res.status(500).json({ message: "Failed to search pricing calculations" });
    }
  });

  app.get("/api/pricing-calculations/:id", requireAuth, async (req, res) => {
    try {
      const calculation = await storage.getPricingCalculation(req.params.id);
      if (!calculation || calculation.bakerId !== req.session.bakerId) {
        return res.status(404).json({ message: "Calculation not found" });
      }
      res.json(calculation);
    } catch (error) {
      console.error("Error fetching pricing calculation:", error);
      res.status(500).json({ message: "Failed to fetch pricing calculation" });
    }
  });

  app.post("/api/pricing-calculations", requireAuth, async (req, res) => {
    try {
      const schema = z.object({
        name: z.string().min(1),
        category: z.string().min(1),
        materialCost: z.string(),
        laborHours: z.string(),
        hourlyRate: z.string(),
        overheadPercent: z.string(),
        suggestedPrice: z.string(),
        appliedToItem: z.string().optional().nullable(),
        appliedToCategory: z.string().optional().nullable(),
        notes: z.string().optional().nullable(),
      });

      const data = schema.parse(req.body);
      const calculation = await storage.createPricingCalculation({
        bakerId: req.session.bakerId!,
        ...data,
      });
      res.json(calculation);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      console.error("Error creating pricing calculation:", error);
      res.status(500).json({ message: "Failed to create pricing calculation" });
    }
  });

  app.patch("/api/pricing-calculations/:id", requireAuth, async (req, res) => {
    try {
      const existing = await storage.getPricingCalculation(req.params.id);
      if (!existing || existing.bakerId !== req.session.bakerId) {
        return res.status(404).json({ message: "Calculation not found" });
      }

      const schema = z.object({
        name: z.string().min(1).optional(),
        category: z.string().min(1).optional(),
        materialCost: z.string().optional(),
        laborHours: z.string().optional(),
        hourlyRate: z.string().optional(),
        overheadPercent: z.string().optional(),
        suggestedPrice: z.string().optional(),
        appliedToItem: z.string().optional().nullable(),
        appliedToCategory: z.string().optional().nullable(),
        notes: z.string().optional().nullable(),
      });

      const data = schema.parse(req.body);
      const calculation = await storage.updatePricingCalculation(req.params.id, data);
      res.json(calculation);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      console.error("Error updating pricing calculation:", error);
      res.status(500).json({ message: "Failed to update pricing calculation" });
    }
  });

  app.delete("/api/pricing-calculations/:id", requireAuth, async (req, res) => {
    try {
      const calculation = await storage.getPricingCalculation(req.params.id);
      if (!calculation || calculation.bakerId !== req.session.bakerId) {
        return res.status(404).json({ message: "Calculation not found" });
      }
      await storage.deletePricingCalculation(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting pricing calculation:", error);
      res.status(500).json({ message: "Failed to delete pricing calculation" });
    }
  });

  // Feature/Unfeature a pricing calculation (Basic/Pro plans)
  app.post("/api/pricing-calculations/:id/feature", requireAuth, async (req, res) => {
    try {
      const baker = await storage.getBaker(req.session.bakerId!);
      if (!baker) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      // Check if baker is on a paid plan (Basic or Pro)
      if (!baker.plan || baker.plan === "free") {
        return res.status(403).json({ 
          message: "Fast Quote is available on paid plans. Upgrade to Basic or Pro to feature items on your public calculator.",
          requiresUpgrade: true
        });
      }
      
      const calculation = await storage.getPricingCalculation(req.params.id);
      if (!calculation || calculation.bakerId !== req.session.bakerId) {
        return res.status(404).json({ message: "Calculation not found" });
      }
      
      const { 
        isFeatured, 
        featuredLabel, 
        featuredDescription, 
        featuredPrice,
        featuredStartDate,
        featuredEndDate,
        showOnQuickOrder,
        depositType,
        depositPercent,
        depositAmount
      } = req.body;
      
      // Check featured item limit for Basic plan (10 items)
      if (baker.plan === "basic" && (isFeatured ?? true)) {
        const featuredItems = await storage.getFeaturedItemsByBaker(baker.id);
        // Don't count the current item if it's already featured
        const currentFeaturedCount = featuredItems.filter(item => item.id !== calculation.id).length;
        if (currentFeaturedCount >= 5) {
          return res.status(403).json({ 
            message: "You've reached the 5 featured item limit on the Basic plan. Upgrade to Pro for unlimited featured items.",
            limitReached: true,
            currentCount: currentFeaturedCount,
            limit: 5
          });
        }
      }
      
      const updated = await storage.updatePricingCalculation(req.params.id, {
        isFeatured: isFeatured ?? true,
        showOnQuickOrder: showOnQuickOrder ?? true,
        featuredLabel: featuredLabel || calculation.name,
        featuredDescription: featuredDescription || calculation.notes,
        featuredPrice: featuredPrice || calculation.suggestedPrice,
        featuredStartDate: featuredStartDate ? new Date(featuredStartDate) : null,
        featuredEndDate: featuredEndDate ? new Date(featuredEndDate) : null,
        depositType: depositType || null,
        depositPercent: depositPercent || null,
        depositAmount: depositAmount || null,
      });
      
      res.json(updated);
    } catch (error) {
      console.error("Error featuring pricing calculation:", error);
      res.status(500).json({ message: "Failed to feature pricing calculation" });
    }
  });

  // Get featured items for baker (authenticated)
  app.get("/api/pricing-calculations/featured", requireAuth, async (req, res) => {
    try {
      const calculations = await storage.getFeaturedItemsByBaker(req.session.bakerId!);
      res.json(calculations);
    } catch (error) {
      console.error("Error getting featured calculations:", error);
      res.status(500).json({ message: "Failed to get featured calculations" });
    }
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

  // Public endpoint to get featured items for a baker (Fast Quote)
  app.get("/api/public/featured-items/:slug", async (req, res) => {
    try {
      const baker = await storage.getBakerBySlug(req.params.slug);
      if (!baker) {
        return res.json([]);
      }
      
      let featuredItems = await storage.getPublicFeaturedItems(req.params.slug);
      
      // Filter to only items that have showOnQuickOrder enabled
      featuredItems = featuredItems.filter(item => item.showOnQuickOrder !== false);
      
      // Apply baker's display limit if set
      if (baker.quickOrderItemLimit !== null && baker.quickOrderItemLimit !== undefined) {
        featuredItems = featuredItems.slice(0, baker.quickOrderItemLimit);
      }
      
      // Return only public-safe fields with proper naming for client compatibility
      const publicItems = featuredItems.map(item => ({
        id: item.id,
        name: item.name,
        category: item.category,
        suggestedPrice: item.suggestedPrice ? String(item.suggestedPrice) : "0.00",
        notes: item.notes,
        featuredLabel: item.featuredLabel,
        featuredDescription: item.featuredDescription,
        featuredPrice: item.featuredPrice ? String(item.featuredPrice) : (item.suggestedPrice ? String(item.suggestedPrice) : "0.00"),
        featuredImageUrl: item.featuredImageUrl,
        depositType: item.depositType,
        depositPercent: item.depositPercent,
        depositAmount: item.depositAmount ? String(item.depositAmount) : null,
      }));
      res.json(publicItems);
    } catch (error) {
      console.error("Error getting featured items:", error);
      res.status(500).json({ message: "Failed to get featured items" });
    }
  });

  app.get("/api/public/quote/:id", async (req, res) => {
    try {
      const quoteWithItems = await storage.getQuoteWithItems(req.params.id);
      if (!quoteWithItems) {
        return res.status(404).json({ message: "Quote not found" });
      }

      const baker = await storage.getBaker(quoteWithItems.bakerId);
      if (!baker) {
        return res.status(404).json({ message: "Baker not found" });
      }

      const customer = await storage.getCustomer(quoteWithItems.customerId);
      if (!customer) {
        return res.status(404).json({ message: "Customer not found" });
      }

      res.json({
        quote: quoteWithItems,
        baker: {
          id: baker.id,
          businessName: baker.businessName,
          email: baker.email,
          phone: baker.phone,
          address: baker.address,
          depositPercentage: baker.depositPercentage,
          paymentZelle: baker.paymentZelle,
          paymentPaypal: baker.paymentPaypal,
          paymentVenmo: baker.paymentVenmo,
          paymentCashapp: baker.paymentCashapp,
        },
        customer: {
          id: customer.id,
          name: customer.name,
          email: customer.email.replace(/(.{2}).*(@.*)/, "$1***$2"),
          phone: null,
        },
      });
    } catch (error) {
      console.error("Error fetching public quote:", error);
      res.status(500).json({ message: "Failed to fetch quote" });
    }
  });

  // Public endpoint for customer to accept/decline quote
  app.patch("/api/public/quote/:id/respond", async (req, res) => {
    try {
      const { action } = req.body;
      if (!action || !["accept", "decline"].includes(action)) {
        return res.status(400).json({ message: "Invalid action. Must be 'accept' or 'decline'" });
      }

      const quote = await storage.getQuoteWithItems(req.params.id);
      if (!quote) {
        return res.status(404).json({ message: "Quote not found" });
      }

      // Only allow response on sent quotes
      if (quote.status !== "sent") {
        return res.status(400).json({ 
          message: quote.status === "approved" || quote.status === "rejected" 
            ? "This quote has already been responded to" 
            : "This quote is not available for response" 
        });
      }

      const baker = await storage.getBaker(quote.bakerId);
      if (!baker) {
        return res.status(404).json({ message: "Baker not found" });
      }

      const customer = await storage.getCustomer(quote.customerId);
      if (!customer) {
        return res.status(404).json({ message: "Customer not found" });
      }

      // Update quote status
      const newStatus = action === "accept" ? "approved" : "rejected";
      const updateData: { status: string; acceptedAt?: Date } = { status: newStatus };
      if (action === "accept") {
        updateData.acceptedAt = new Date();
      }

      await storage.updateQuote(quote.id, updateData);

      // Auto-update linked lead status based on quote response
      if (quote.leadId) {
        const leadStatus = action === "accept" ? "converted" : "lost";
        await storage.updateLead(quote.leadId, { status: leadStatus });
      }

      // If quote is accepted, create an order for the calendar and revenue tracking
      if (action === "accept") {
        // Check if an order already exists for this quote (idempotency)
        const existingOrder = await storage.getOrderByQuoteId(quote.id);
        if (!existingOrder) {
          await storage.createOrder({
            bakerId: quote.bakerId,
            quoteId: quote.id,
            customerId: quote.customerId,
            eventDate: quote.eventDate || null,
            title: quote.title,
            amount: quote.total,
            paymentMethod: "pending",
            paymentStatus: "pending",
            fulfillmentStatus: "booked",
            notes: `Order created from accepted quote #${quote.quoteNumber}`,
          });
        }
      }

      // Send notification email to baker
      const baseUrl = `${req.protocol}://${req.get("host")}`;
      await sendQuoteResponseNotification(
        baker.email,
        baker.businessName,
        {
          customerName: customer.name,
          customerEmail: customer.email,
          quoteNumber: quote.quoteNumber,
          quoteTitle: quote.title,
          total: parseFloat(quote.total),
          action: action === "accept" ? "accepted" : "declined",
          dashboardUrl: `${baseUrl}/quotes/${quote.id}`,
        }
      );

      res.json({ 
        success: true, 
        message: action === "accept" 
          ? "Quote accepted! The baker has been notified." 
          : "Quote declined. The baker has been notified.",
        status: newStatus
      });
    } catch (error) {
      console.error("Error responding to quote:", error);
      res.status(500).json({ message: "Failed to respond to quote" });
    }
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

      // Leads are unlimited - limits only apply to quotes sent

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

      // Check if this is a Quick Order (Fast Quote)
      const isQuickOrder = data.calculatorPayload?.fastQuote === true;
      
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
        source: isQuickOrder ? "quick_order" : "calculator",
      });

      // Send email notifications (non-blocking)
      const estimatedTotal = parseFloat(data.estimatedTotal);
      const category = data.calculatorPayload?.category as "cake" | "treat" | undefined;
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
          category,
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

    const monthlyQuoteCount = await storage.getMonthlyQuoteCount(baker.id);
    const plan = baker.plan || "free";
    
    // Determine quote limit based on plan
    let quoteLimit: number | null = FREE_QUOTE_LIMIT;
    if (plan === "basic") {
      quoteLimit = BASIC_QUOTE_LIMIT;
    } else if (plan === "pro") {
      quoteLimit = null; // unlimited
    }
    
    const isAtLimit = quoteLimit !== null && monthlyQuoteCount >= quoteLimit;
    
    res.json({
      plan,
      monthlyQuoteCount,
      quoteLimit,
      isAtLimit,
    });
  });

  app.post("/api/subscription/checkout", requireAuth, async (req, res) => {
    try {
      const baker = await storage.getBaker(req.session.bakerId!);
      if (!baker) {
        return res.status(404).json({ message: "Baker not found" });
      }

      const requestedPlan = req.body.plan || "pro"; // Default to pro
      const lookupKey = requestedPlan === "basic" ? "bakeriq_basic_monthly" : "bakeriq_pro_monthly";
      const productName = requestedPlan === "basic" ? "BakerIQ Basic" : "BakerIQ Pro";

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

      // Get the price from Stripe by lookup key
      const prices = await stripe.prices.list({
        lookup_keys: [lookupKey],
        active: true,
        limit: 1,
      });

      let priceId: string;
      if (prices.data.length > 0) {
        priceId = prices.data[0].id;
      } else {
        // Fallback: search for the product by name
        const products = await stripe.products.search({ query: `name:'${productName}'` });
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
        metadata: { bakerId: baker.id, plan: requestedPlan },
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
      const { customerId, subscriptionId, status, priceId } = req.body;
      
      // Find baker by Stripe customer ID
      const allBakers = await storage.getAllBakers();
      const baker = allBakers.find(b => b.stripeCustomerId === customerId);
      
      if (baker) {
        let plan = "free";
        if (status === "active" || status === "trialing") {
          // Try to determine plan from price lookup key or metadata
          // Default to pro for backwards compatibility
          plan = req.body.plan || "pro";
          
          // If we have a priceId, try to look up the plan
          if (priceId) {
            try {
              const stripe = await getUncachableStripeClient();
              const price = await stripe.prices.retrieve(priceId);
              if (price.metadata?.plan) {
                plan = price.metadata.plan;
              } else if (price.lookup_key?.includes("basic")) {
                plan = "basic";
              }
            } catch (e) {
              console.log("Could not retrieve price info, using default plan");
            }
          }
        }
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
        plan: z.enum(["free", "basic", "pro"]).optional(),
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

  // Enhanced admin analytics
  app.get("/api/admin/analytics", requireAdmin, async (req, res) => {
    try {
      const allBakers = await storage.getAllBakers();
      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      
      // Bakers by plan
      const bakersByPlan = {
        free: allBakers.filter(b => b.plan === "free").length,
        basic: allBakers.filter(b => b.plan === "basic").length,
        pro: allBakers.filter(b => b.plan === "pro").length,
      };
      
      // Recent signups
      const recentSignups = allBakers.filter(b => 
        b.createdAt && new Date(b.createdAt) >= thirtyDaysAgo
      ).length;
      const weeklySignups = allBakers.filter(b => 
        b.createdAt && new Date(b.createdAt) >= sevenDaysAgo
      ).length;
      
      // Verified vs unverified
      const verifiedBakers = allBakers.filter(b => b.emailVerified).length;
      const suspendedBakers = allBakers.filter(b => b.suspended).length;
      
      // Get platform-wide stats from database
      const platformStats = await storage.getAdminPlatformStats();
      
      res.json({
        totalBakers: allBakers.length,
        bakersByPlan,
        recentSignups,
        weeklySignups,
        verifiedBakers,
        suspendedBakers,
        admins: allBakers.filter(b => b.role === "super_admin").length,
        ...platformStats,
      });
    } catch (error) {
      console.error("Admin analytics error:", error);
      res.status(500).json({ message: "Failed to get analytics" });
    }
  });

  // Suspend/unsuspend baker
  app.post("/api/admin/bakers/:id/suspend", requireAdmin, async (req, res) => {
    try {
      const { reason } = req.body;
      const baker = await storage.getBaker(req.params.id);
      if (!baker) {
        return res.status(404).json({ message: "Baker not found" });
      }
      if (baker.id === req.session.bakerId) {
        return res.status(400).json({ message: "Cannot suspend your own account" });
      }
      
      await storage.updateBaker(req.params.id, {
        suspended: true,
        suspendedAt: new Date(),
        suspendedReason: reason || "Suspended by admin",
      });
      
      res.json({ message: "Baker suspended" });
    } catch (error) {
      console.error("Suspend baker error:", error);
      res.status(500).json({ message: "Failed to suspend baker" });
    }
  });

  app.post("/api/admin/bakers/:id/unsuspend", requireAdmin, async (req, res) => {
    try {
      const baker = await storage.getBaker(req.params.id);
      if (!baker) {
        return res.status(404).json({ message: "Baker not found" });
      }
      
      await storage.updateBaker(req.params.id, {
        suspended: false,
        suspendedAt: null,
        suspendedReason: null,
      });
      
      res.json({ message: "Baker unsuspended" });
    } catch (error) {
      console.error("Unsuspend baker error:", error);
      res.status(500).json({ message: "Failed to unsuspend baker" });
    }
  });

  // Reset baker password (generates temporary password and emails it)
  app.post("/api/admin/bakers/:id/reset-password", requireAdmin, async (req, res) => {
    try {
      const baker = await storage.getBaker(req.params.id);
      if (!baker) {
        return res.status(404).json({ message: "Baker not found" });
      }
      
      // Generate a random temporary password
      const tempPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-4).toUpperCase();
      
      // Email the temporary password to the baker FIRST
      const baseUrl = `${req.protocol}://${req.get("host")}`;
      const emailSent = await sendAdminPasswordReset(baker.email, tempPassword, baker.businessName, baseUrl);
      
      if (!emailSent) {
        // Don't change the password if email fails - this prevents locking out the baker
        return res.status(500).json({ 
          message: "Failed to send password reset email. Password was NOT changed. Please check email configuration.",
        });
      }
      
      // Only update the password after email is successfully sent
      const passwordHash = await bcrypt.hash(tempPassword, 10);
      await storage.updateBaker(req.params.id, { passwordHash });
      
      res.json({ 
        message: `Password reset successfully. Temporary password has been emailed to ${baker.email}`,
      });
    } catch (error) {
      console.error("Reset password error:", error);
      res.status(500).json({ message: "Failed to reset password" });
    }
  });

  // Reset quote limit for baker
  app.post("/api/admin/bakers/:id/reset-quote-limit", requireAdmin, async (req, res) => {
    try {
      const baker = await storage.getBaker(req.params.id);
      if (!baker) {
        return res.status(404).json({ message: "Baker not found" });
      }
      
      await storage.updateBaker(req.params.id, {
        quotesSentThisMonth: 0,
        quotesResetDate: new Date(),
      });
      
      res.json({ message: "Quote limit reset successfully" });
    } catch (error) {
      console.error("Reset quote limit error:", error);
      res.status(500).json({ message: "Failed to reset quote limit" });
    }
  });

  // Impersonation - login as another baker
  app.post("/api/admin/bakers/:id/impersonate", requireAdmin, async (req, res) => {
    try {
      const baker = await storage.getBaker(req.params.id);
      if (!baker) {
        return res.status(404).json({ message: "Baker not found" });
      }
      
      // Store original admin ID for return
      const originalAdminId = req.session.bakerId;
      
      // Switch session to impersonated baker
      req.session.bakerId = baker.id;
      req.session.impersonatedBy = originalAdminId;
      
      res.json({ 
        message: "Now impersonating " + baker.businessName,
        baker: { ...baker, passwordHash: undefined },
      });
    } catch (error) {
      console.error("Impersonation error:", error);
      res.status(500).json({ message: "Failed to impersonate baker" });
    }
  });

  // Stop impersonation
  app.post("/api/admin/stop-impersonation", async (req, res) => {
    try {
      if (!req.session.impersonatedBy) {
        return res.status(400).json({ message: "Not currently impersonating" });
      }
      
      const originalAdminId = req.session.impersonatedBy;
      req.session.bakerId = originalAdminId;
      delete req.session.impersonatedBy;
      
      const admin = await storage.getBaker(originalAdminId);
      res.json({ 
        message: "Stopped impersonation",
        baker: admin ? { ...admin, passwordHash: undefined } : null,
      });
    } catch (error) {
      console.error("Stop impersonation error:", error);
      res.status(500).json({ message: "Failed to stop impersonation" });
    }
  });

  // Get baker activity (leads, quotes, orders)
  app.get("/api/admin/bakers/:id/activity", requireAdmin, async (req, res) => {
    try {
      const baker = await storage.getBaker(req.params.id);
      if (!baker) {
        return res.status(404).json({ message: "Baker not found" });
      }
      
      const [leads, quotes, orders, customers] = await Promise.all([
        storage.getLeadsByBaker(req.params.id),
        storage.getQuotesByBaker(req.params.id),
        storage.getOrdersByBaker(req.params.id),
        storage.getCustomersByBaker(req.params.id),
      ]);
      
      res.json({
        baker: { ...baker, passwordHash: undefined },
        stats: {
          totalLeads: leads.length,
          totalQuotes: quotes.length,
          totalOrders: orders.length,
          totalCustomers: customers.length,
          sentQuotes: quotes.filter(q => q.status === "sent").length,
          acceptedQuotes: quotes.filter(q => q.status === "approved").length,
          totalRevenue: orders.reduce((sum, o) => sum + Number(o.amount), 0),
        },
        recentLeads: leads.slice(0, 10),
        recentQuotes: quotes.slice(0, 10),
        recentOrders: orders.slice(0, 10),
      });
    } catch (error) {
      console.error("Get baker activity error:", error);
      res.status(500).json({ message: "Failed to get baker activity" });
    }
  });

  // Get email logs
  app.get("/api/admin/email-logs", requireAdmin, async (req, res) => {
    try {
      const emailLogs = await storage.getAdminEmailLogs();
      res.json(emailLogs);
    } catch (error) {
      console.error("Get email logs error:", error);
      res.status(500).json({ message: "Failed to get email logs" });
    }
  });

  // Resend onboarding email manually
  app.post("/api/admin/bakers/:id/resend-email", requireAdmin, async (req, res) => {
    try {
      const { emailDay } = req.body;
      const baker = await storage.getBaker(req.params.id);
      if (!baker) {
        return res.status(404).json({ message: "Baker not found" });
      }
      
      // Delete existing record to allow resend
      await storage.deleteOnboardingEmail(req.params.id, emailDay);
      
      // Trigger the email send with correct parameters
      const baseUrl = `${req.protocol}://${req.get("host")}`;
      const success = await sendOnboardingEmail(baker.email, baker.businessName, emailDay, baseUrl);
      
      if (success) {
        await storage.recordOnboardingEmail(baker.id, emailDay, "sent");
        res.json({ message: `Email day ${emailDay} resent to ${baker.email}` });
      } else {
        await storage.recordOnboardingEmail(baker.id, emailDay, "failed", "Email send failed");
        res.status(500).json({ message: "Failed to send email" });
      }
    } catch (error) {
      console.error("Resend email error:", error);
      res.status(500).json({ message: "Failed to resend email" });
    }
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

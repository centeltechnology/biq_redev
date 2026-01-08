import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import session from "express-session";
import bcrypt from "bcrypt";
import { storage } from "./storage";
import { z } from "zod";
import { pool } from "./db";
import connectPgSimple from "connect-pg-simple";

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
      });

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
      slug: baker.slug,
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

      res.json({ success: true, leadId: lead.id });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      console.error("Calculator submit error:", error);
      res.status(500).json({ message: "Failed to submit calculator" });
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

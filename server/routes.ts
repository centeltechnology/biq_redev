import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import session from "express-session";
import cookieParser from "cookie-parser";
import bcrypt from "bcrypt";
import { storage } from "./storage";
import { z } from "zod";
import { pool } from "./db";
import connectPgSimple from "connect-pg-simple";
import { sendNewLeadNotification, sendLeadConfirmationToCustomer, sendPasswordResetEmail, sendEmailVerification, sendQuoteNotification, sendOnboardingEmail, sendQuoteResponseNotification, sendAdminPasswordReset, sendPaymentReceivedNotification, sendAnnouncementEmail, getAnnouncementEmailHtml, sendInvitationEmail } from "./email";
import crypto from "crypto";
import { getUncachableStripeClient, getStripePublishableKey } from "./stripeClient";
import { db } from "./db";
import { sql } from "drizzle-orm";
import { CAKE_SIZES, CAKE_SHAPES, CAKE_FLAVORS, FROSTING_TYPES, DECORATIONS, DELIVERY_OPTIONS, ADDONS, USER_ACTIVITY_EVENT_TYPES, type UserActivityEventType, adminAuditLogs } from "@shared/schema";
import { registerObjectStorageRoutes } from "./replit_integrations/object_storage";
import OpenAI from "openai";
import { trackEvent } from "./event-tracking";

// OpenAI client for support chat
const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

// Knowledge base from FAQ/Help content for AI support
const SUPPORT_KNOWLEDGE_BASE = `
BakerIQ is a lead capture and quote management tool for custom cake bakers.

GETTING STARTED:
- When you sign up, your unique public calculator is created automatically at /c/your-bakery-slug
- Configure pricing in "Calculator Pricing" in your dashboard
- Share your calculator URL on your website, social media, or with customers

PRICING:
- Set prices for cake sizes in Calculator Pricing - these form the base of estimates
- Add price adjustments for premium flavors and specialty frostings
- Configure decoration prices and addon pricing
- Use the Price Calculator tool to calculate suggested prices based on costs

LEADS:
- When customers complete your calculator and submit info, a lead is created automatically
- You receive email notification and customer gets confirmation email
- Track leads through stages: New, Contacted, Quoted, Won, or Lost
- Click "Create Quote" on any lead to start a quote with details pre-filled

QUOTES:
- Add line items for tiers, decorations, delivery, and custom items
- Track quote status: Draft, Sent, Accepted, Declined, or Expired
- Convert accepted quotes to orders for calendar tracking
- Only sent quotes count toward monthly limits (drafts are free)

ORDERS & CALENDAR:
- Orders appear on the calendar organized by date
- Search by customer name, title, or event type
- Track total amount, deposit paid, and balance due

FAST QUOTE (Basic & Pro plans):
- Feature popular items on your public calculator
- Customers order in a few clicks with pre-filled quotes
- Basic plan: up to 5 featured items, Pro: unlimited

SUBSCRIPTION PLANS:
- Free: 5 quotes per month, unlimited leads, 7% platform fee on payments
- Basic ($4.99/month): 15 quotes + 5 featured items, 5% platform fee
- Pro ($9.99/month): unlimited quotes + unlimited featured items, 3% platform fee
- Upgrade anytime in Settings

PAYMENT METHODS:
- Stripe Connect for online payments through quotes
- Set default deposit percentage/type in Settings

EMAIL NOTIFICATIONS:
- New lead alerts when customers submit inquiries
- Customer confirmation emails with estimates
- Quote notifications when you send quotes

COMMON ISSUES:
- If prices don't update, refresh browser or clear cache after saving
- Check spam folder for missing emails
- Make sure orders have event dates to appear on calendar
- Cancelled orders are hidden from calendar view
`;


// Quote limits per plan (monthly)
const FREE_QUOTE_LIMIT = 15;
// Basic and Pro plans have unlimited quotes

// Platform fee percentages per plan
const PLATFORM_FEE_FREE = 7;
const PLATFORM_FEE_BASIC = 5;
const PLATFORM_FEE_PRO = 3;

function getPlatformFeePercent(plan: string): number {
  switch (plan) {
    case "pro": return PLATFORM_FEE_PRO;
    case "basic": return PLATFORM_FEE_BASIC;
    default: return PLATFORM_FEE_FREE;
  }
}

// Helper to get effective plan (checks survey trial, gifted plan, subscription)
function getEffectivePlan(baker: { plan: string; surveyTrialEndDate?: Date | null; giftedPlan?: string | null; giftedPlanExpiresAt?: Date | null }): string {
  if (baker.surveyTrialEndDate && new Date(baker.surveyTrialEndDate) > new Date()) {
    return "pro";
  }
  if (baker.plan && baker.plan !== "free") {
    return baker.plan;
  }
  if (baker.giftedPlan && baker.giftedPlanExpiresAt && new Date(baker.giftedPlanExpiresAt) > new Date()) {
    return baker.giftedPlan;
  }
  return baker.plan || "free";
}

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

  // Cookie parser for affiliate referral tracking
  app.use(cookieParser());

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

  // Register object storage routes for file uploads
  registerObjectStorageRoutes(app);

  // Auth Routes
  app.post("/api/auth/register", async (req, res) => {
    try {
      const schema = z.object({
        email: z.string().email(),
        password: z.string().min(8),
        businessName: z.string().min(2),
        inviteToken: z.string().optional(),
      });

      const data = schema.parse(req.body);

      let invitation: any = null;
      if (data.inviteToken) {
        invitation = await storage.getInvitationByToken(data.inviteToken);
        if (!invitation || invitation.status !== "pending" || new Date(invitation.expiresAt) < new Date()) {
          return res.status(400).json({ message: "Invalid or expired invitation" });
        }
        data.email = invitation.email;
      }

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

      // Check for affiliate referral cookie
      const affiliateRef = req.cookies?.bakeriq_ref;
      let referralData: { referredByAffiliateId?: string; referredAt?: Date } = {};
      if (affiliateRef) {
        const affiliateBaker = await storage.getAffiliateByCode(affiliateRef);
        if (affiliateBaker && affiliateBaker.isAffiliate) {
          referralData = {
            referredByAffiliateId: affiliateBaker.id,
            referredAt: new Date(),
          };
        }
      }

      // Check for baker referral cookie (separate from affiliate)
      const bakerRef = req.cookies?.bakeriq_baker_ref;
      let bakerReferralData: { referredByBakerId?: string; bakerReferredAt?: Date } = {};
      if (bakerRef) {
        const referringBaker = await storage.getBakerByReferralCode(bakerRef);
        if (referringBaker) {
          bakerReferralData = {
            referredByBakerId: referringBaker.id,
            bakerReferredAt: new Date(),
          };
        }
      }

      const baker = await storage.createBaker({
        email: data.email,
        passwordHash,
        businessName: data.businessName,
        slug,
        ...referralData,
        ...bakerReferralData,
      });

      // Generate unique referral code for the new baker
      const referralCode = crypto.randomBytes(4).toString("hex");
      await storage.updateBaker(baker.id, { referralCode });

      // Create baker referral record if referred by another baker (prevent self-referral)
      if (bakerReferralData.referredByBakerId && bakerReferralData.referredByBakerId !== baker.id) {
        await storage.createBakerReferral({
          referringBakerId: bakerReferralData.referredByBakerId,
          referredBakerId: baker.id,
        });
      }

      // Handle invitation acceptance
      if (invitation) {
        const updateData: any = {
          role: invitation.role,
          invitedByAdminId: invitation.invitedByAdminId,
        };
        if (invitation.giftedPlan) {
          updateData.giftedPlan = invitation.giftedPlan;
          updateData.giftedPlanExpiresAt = new Date(Date.now() + (invitation.giftedPlanDurationMonths || 1) * 30 * 24 * 60 * 60 * 1000);
        }
        await storage.updateBaker(baker.id, updateData);
        await storage.updateInvitation(invitation.id, {
          status: "accepted",
          acceptedByBakerId: baker.id,
          acceptedAt: new Date(),
        });
        await logAdminAction(invitation.invitedByAdminId, "INVITATION_ACCEPTED", baker.id, {
          email: invitation.email,
          role: invitation.role,
          giftedPlan: invitation.giftedPlan,
        });
      }

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
      
      // Track login event
      trackEvent(baker.id, "login");
      
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

  // Public invitation validation
  app.get("/api/auth/invitation/:token", async (req, res) => {
    try {
      const invitation = await storage.getInvitationByToken(req.params.token);
      if (!invitation || invitation.status !== "pending" || new Date(invitation.expiresAt) < new Date()) {
        return res.json({ valid: false });
      }
      res.json({
        valid: true,
        email: invitation.email,
        role: invitation.role,
        giftedPlan: invitation.giftedPlan,
        giftedPlanDurationMonths: invitation.giftedPlanDurationMonths,
      });
    } catch (error) {
      res.json({ valid: false });
    }
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

  // Frontend event tracking
  app.post("/api/track-event", requireAuth, async (req, res) => {
    try {
      const schema = z.object({
        eventType: z.enum(USER_ACTIVITY_EVENT_TYPES as unknown as [string, ...string[]]),
        eventData: z.record(z.unknown()).optional(),
      });

      const data = schema.parse(req.body);
      await trackEvent(req.session.bakerId!, data.eventType as UserActivityEventType, data.eventData);
      res.json({ success: true });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      res.status(500).json({ message: "Event tracking failed" });
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
        profilePhoto: z.string().optional().nullable(),
        portfolioImages: z.array(z.string()).max(6).optional().nullable(),
        calculatorHeaderImage: z.string().optional().nullable(),
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
      
      // Convert empty strings to null for numeric fields
      const sanitizedData = {
        ...data,
        depositFixedAmount: data.depositFixedAmount === "" ? null : data.depositFixedAmount,
      };
      
      const baker = await storage.updateBaker(req.session.bakerId!, sanitizedData);

      if (!baker) {
        return res.status(404).json({ message: "Baker not found" });
      }

      // Track calculator config update (quick quote configured)
      if (data.calculatorConfig) {
        trackEvent(req.session.bakerId!, "quick_quote_configured");
      }

      res.json({ ...baker, passwordHash: undefined });
    } catch (error: any) {
      console.error("Baker update error:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      res.status(500).json({ message: error.message || "Update failed" });
    }
  });

  // Check slug availability
  app.get("/api/bakers/check-slug/:slug", requireAuth, async (req, res) => {
    try {
      const slug = req.params.slug.toLowerCase().trim();
      const reserved = ["admin", "api", "login", "signup", "dashboard", "settings", "help", "faq", "terms", "privacy", "c", "q"];
      if (reserved.includes(slug)) {
        return res.json({ available: false, reason: "This URL is reserved" });
      }
      if (slug.length < 3) {
        return res.json({ available: false, reason: "Must be at least 3 characters" });
      }
      if (!/^[a-z0-9][a-z0-9-]*[a-z0-9]$/.test(slug) && slug.length > 1) {
        return res.json({ available: false, reason: "Only lowercase letters, numbers, and hyphens allowed" });
      }
      const existing = await storage.getBakerBySlug(slug);
      if (existing && existing.id !== req.session.bakerId) {
        return res.json({ available: false, reason: "This URL is already taken" });
      }
      res.json({ available: true });
    } catch (error) {
      res.status(500).json({ available: false, reason: "Check failed" });
    }
  });

  // Update baker slug
  app.patch("/api/bakers/me/slug", requireAuth, async (req, res) => {
    try {
      const schema = z.object({
        slug: z.string()
          .min(3, "Slug must be at least 3 characters")
          .max(50, "Slug must be 50 characters or less")
          .regex(/^[a-z0-9][a-z0-9-]*[a-z0-9]$/, "Only lowercase letters, numbers, and hyphens allowed (cannot start/end with hyphen)")
          .transform(s => s.toLowerCase().trim()),
      });
      const { slug } = schema.parse(req.body);

      const reserved = ["admin", "api", "login", "signup", "dashboard", "settings", "help", "faq", "terms", "privacy", "c", "q"];
      if (reserved.includes(slug)) {
        return res.status(400).json({ message: "This URL is reserved" });
      }

      const existing = await storage.getBakerBySlug(slug);
      if (existing && existing.id !== req.session.bakerId!) {
        return res.status(409).json({ message: "This URL is already taken by another baker" });
      }

      const baker = await storage.updateBaker(req.session.bakerId!, { slug });
      if (!baker) {
        return res.status(404).json({ message: "Baker not found" });
      }
      res.json({ ...baker, passwordHash: undefined });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      res.status(500).json({ message: error.message || "Failed to update URL" });
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

  // Stripe prompt tracking (once per day max)
  app.post("/api/activation/stripe-prompt-shown", requireAuth, async (req, res) => {
    try {
      const baker = await storage.getBaker(req.session.bakerId!);
      if (!baker) return res.status(404).json({ message: "Baker not found" });

      if (baker.stripeConnectedAt) {
        return res.json({ recorded: false });
      }

      const now = new Date();
      const lastShown = baker.stripePromptLastShownAt;
      if (lastShown) {
        const lastShownDate = new Date(lastShown);
        if (lastShownDate.toDateString() === now.toDateString()) {
          return res.json({ recorded: false });
        }
      }

      await storage.updateBaker(req.session.bakerId!, {
        stripePromptLastShownAt: now,
      });

      res.json({ recorded: true });
    } catch (error: any) {
      console.error("Stripe prompt tracking error:", error);
      res.status(500).json({ message: "Tracking failed" });
    }
  });

  // Activity tracking endpoint (lightweight event logging)
  app.post("/api/activity/track", requireAuth, async (req, res) => {
    try {
      const { eventType } = req.body;
      if (!eventType) return res.status(400).json({ message: "eventType required" });
      const validTypes: readonly string[] = USER_ACTIVITY_EVENT_TYPES;
      if (!validTypes.includes(eventType)) {
        return res.status(400).json({ message: "Invalid eventType" });
      }
      await trackEvent(req.session.bakerId!, eventType as UserActivityEventType, {});
      res.json({ tracked: true });
    } catch (error: any) {
      console.error("Activity tracking error:", error);
      res.status(500).json({ message: "Tracking failed" });
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

      // Track lead status update
      if (data.status) {
        trackEvent(req.session.bakerId!, "lead_status_updated", { leadId: req.params.id, newStatus: data.status });
      }

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
      
      // Track quote creation
      trackEvent(bakerId, "quote_created", { quoteId: quote.id, customerId: data.customerId });
      
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

  app.post("/api/quotes/test-quote", requireAuth, async (req, res) => {
    try {
      const bakerId = req.session.bakerId!;
      const baker = await storage.getBaker(bakerId);
      if (!baker) return res.status(404).json({ message: "Baker not found" });
      if (baker.role === "super_admin") return res.status(403).json({ message: "Admin accounts excluded" });
      if (!baker.stripeConnectedAt) return res.status(400).json({ message: "Connect Stripe first" });
      if (baker.firstQuoteSentAt) return res.status(400).json({ message: "First quote already sent" });

      let customer = await storage.getCustomerByEmail(bakerId, baker.email);
      if (!customer) {
        const displayName = baker.businessName || "Test Customer";
        customer = await storage.createCustomer({
          bakerId,
          name: `Test - ${displayName}`,
          email: baker.email,
          phone: baker.phone || null,
        });
      }

      const quoteNumber = await storage.getNextQuoteNumber(bakerId);
      const unitPrice = 100;
      const taxRate = 0.08;
      const subtotal = unitPrice;
      const taxAmount = subtotal * taxRate;
      const total = subtotal + taxAmount;

      const quote = await storage.createQuote({
        bakerId,
        customerId: customer.id,
        leadId: null,
        quoteNumber,
        title: "Sample Cake Order",
        eventDate: null,
        status: "draft",
        subtotal: subtotal.toFixed(2),
        taxRate: taxRate.toFixed(4),
        taxAmount: taxAmount.toFixed(2),
        total: total.toFixed(2),
        notes: null,
      });

      await storage.createQuoteItem({
        quoteId: quote.id,
        name: "Sample Cake Order",
        description: "6-inch round cake - vanilla with buttercream frosting",
        quantity: 1,
        unitPrice: unitPrice.toFixed(2),
        totalPrice: unitPrice.toFixed(2),
        category: "cake",
      });

      res.json({ quoteId: quote.id, customerId: customer.id });
    } catch (error: any) {
      console.error("Test quote creation error:", error);
      res.status(500).json({ message: "Failed to create test quote" });
    }
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

      // Check quote limit for the baker's plan (including survey trial)
      const plan = getEffectivePlan(baker);
      let quoteLimit: number | null = FREE_QUOTE_LIMIT;
      if (plan === "basic" || plan === "pro") {
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

      // In production, use REPLIT_DOMAINS or custom domain; only use dev domain in development
      const isProduction = process.env.NODE_ENV === "production";
      const baseUrl = isProduction
        ? (process.env.REPLIT_DOMAINS 
            ? `https://${process.env.REPLIT_DOMAINS.split(",")[0]}`
            : "https://bakeriq.app")
        : (process.env.REPLIT_DEV_DOMAIN 
            ? `https://${process.env.REPLIT_DEV_DOMAIN}`
            : "https://bakeriq.app");
      
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

      // Track quote sent
      trackEvent(bakerId, "quote_sent", { quoteId: quote.id, customerId: quote.customerId });
      await storage.setActivationTimestamp(bakerId, "firstQuoteSentAt");

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

      // Track order scheduled
      trackEvent(req.session.bakerId!, "order_scheduled", { orderId: order.id, quoteId: data.quoteId });

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
      
      // Track pricing item added
      trackEvent(req.session.bakerId!, "pricing_item_added", { calculationId: calculation.id, category: data.category });
      await storage.setActivationTimestamp(req.session.bakerId!, "firstProductCreatedAt");
      
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
      
      // Track pricing item updated
      trackEvent(req.session.bakerId!, "pricing_item_updated", { calculationId: req.params.id });
      
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
      const effectivePlan = getEffectivePlan(baker);
      if (effectivePlan === "basic" && (isFeatured ?? true)) {
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
      
      // Track featured item added/updated
      if (isFeatured) {
        trackEvent(req.session.bakerId!, "featured_item_added", { calculationId: req.params.id });
      }
      
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
      profilePhoto: baker.profilePhoto,
      portfolioImages: baker.portfolioImages,
      currency: baker.currency,
      calculatorHeaderImage: baker.calculatorHeaderImage,
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
          defaultDepositType: baker.defaultDepositType,
          depositFixedAmount: baker.depositFixedAmount,
          currency: baker.currency,
          onlinePaymentsEnabled: !!(baker.stripeConnectAccountId && baker.stripeConnectOnboarded && baker.stripeConnectPayoutsEnabled),
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

      // Track quote accepted/declined
      trackEvent(quote.bakerId, action === "accept" ? "quote_accepted" : "quote_declined", { 
        quoteId: quote.id, 
        customerId: quote.customerId 
      });

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

      // Track lead created
      trackEvent(baker.id, "lead_created", { leadId: lead.id, source: isQuickOrder ? "quick_order" : "calculator" });

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
    const plan = getEffectivePlan(baker);
    
    // Determine quote limit based on plan
    let quoteLimit: number | null = FREE_QUOTE_LIMIT;
    if (plan === "basic" || plan === "pro") {
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

        // Track affiliate commission when referred baker subscribes to a paid plan
        if ((plan === "basic" || plan === "pro") && (status === "active" || status === "trialing") && baker.referredByAffiliateId) {
          try {
            const invoiceId = req.body.invoiceId || null;
            const affiliate = await storage.getBaker(baker.referredByAffiliateId);
            if (affiliate && affiliate.isAffiliate) {
              const existingCommissions = await storage.getCommissionsByAffiliate(affiliate.id);
              const commissionsForThisBaker = existingCommissions.filter(c => c.referredBakerId === baker.id);

              // Idempotency: skip if this invoice was already recorded
              if (invoiceId && commissionsForThisBaker.some(c => c.stripeInvoiceId === invoiceId)) {
                console.log(`Affiliate commission already recorded for invoice ${invoiceId}, skipping`);
              } else {
                const maxMonths = affiliate.affiliateCommissionMonths || 3;
                const nextMonth = commissionsForThisBaker.length + 1;

                if (nextMonth <= maxMonths) {
                  const subscriptionAmount = plan === "basic" ? 4.99 : 9.99;
                  const rate = parseFloat(affiliate.affiliateCommissionRate || "20");
                  const commissionAmount = (subscriptionAmount * rate) / 100;

                  await storage.createAffiliateCommission({
                    affiliateBakerId: affiliate.id,
                    referredBakerId: baker.id,
                    stripeInvoiceId: invoiceId,
                    subscriptionAmount: subscriptionAmount.toFixed(2),
                    commissionRate: rate.toFixed(2),
                    commissionAmount: commissionAmount.toFixed(2),
                    monthNumber: nextMonth,
                    status: "pending",
                  });
                  console.log(`Affiliate commission recorded: ${affiliate.businessName} earns $${commissionAmount.toFixed(2)} from ${baker.businessName} (month ${nextMonth}/${maxMonths})`);
                }
              }
            }
          } catch (affError) {
            console.error("Error tracking affiliate commission:", affError);
          }
        }

        // Award baker referral credit when referred baker subscribes
        if ((plan === "basic" || plan === "pro") && (status === "active" || status === "trialing") && baker.referredByBakerId) {
          try {
            const referringBaker = await storage.getBaker(baker.referredByBakerId);
            if (referringBaker) {
              const referrals = await storage.getBakerReferralsByReferrer(referringBaker.id);
              const thisReferral = referrals.find(r => r.referredBakerId === baker.id && !r.creditAwarded);
              if (thisReferral) {
                const totalCredits = referringBaker.referralCredits + referringBaker.quickQuoteCredits;
                if (totalCredits < 12) {
                  if (referringBaker.plan === "basic" || referringBaker.plan === "pro") {
                    await storage.updateBaker(referringBaker.id, {
                      referralCredits: referringBaker.referralCredits + 1,
                    });
                    await storage.awardBakerReferralCredit(thisReferral.id, "subscription");
                    console.log(`Baker referral credit awarded: ${referringBaker.businessName} gets 1 free month (subscription credit)`);
                  } else {
                    await storage.updateBaker(referringBaker.id, {
                      quickQuoteCredits: referringBaker.quickQuoteCredits + 1,
                    });
                    await storage.awardBakerReferralCredit(thisReferral.id, "quick_quote");
                    console.log(`Baker referral credit awarded: ${referringBaker.businessName} gets 1 month Quick Quote access`);
                  }
                }
              }
            }
          } catch (refError) {
            console.error("Error awarding baker referral credit:", refError);
          }
        }
      }
      
      res.json({ received: true });
    } catch (error) {
      console.error("Webhook update error:", error);
      res.status(500).json({ message: "Failed to process webhook" });
    }
  });

  // ============================================
  // Stripe Connect Routes
  // ============================================

  // Create or retrieve Stripe Connect account for baker
  app.post("/api/stripe-connect/create-account", requireAuth, async (req, res) => {
    try {
      const baker = await storage.getBaker(req.session.bakerId!);
      if (!baker) return res.status(404).json({ message: "Baker not found" });

      const stripe = await getUncachableStripeClient();

      // If baker already has a Connect account, return it
      if (baker.stripeConnectAccountId) {
        const account = await stripe.accounts.retrieve(baker.stripeConnectAccountId);
        return res.json({
          accountId: account.id,
          onboarded: account.details_submitted,
          payoutsEnabled: account.payouts_enabled,
        });
      }

      // Create a new Standard Connect account
      const account = await stripe.accounts.create({
        type: "standard",
        email: baker.email,
        metadata: {
          bakerId: baker.id,
          businessName: baker.businessName,
        },
      });

      await storage.updateBaker(baker.id, {
        stripeConnectAccountId: account.id,
      });

      res.json({
        accountId: account.id,
        onboarded: false,
        payoutsEnabled: false,
      });
    } catch (error: any) {
      console.error("Create Connect account error:", error);
      if (error?.type === 'StripeInvalidRequestError' && error?.message?.includes("signed up for Connect")) {
        return res.status(400).json({ 
          message: "Stripe Connect is not enabled on your Stripe account. Please visit https://dashboard.stripe.com/connect/overview to activate Connect, then try again." 
        });
      }
      res.status(500).json({ message: "Failed to create Stripe Connect account" });
    }
  });

  // Generate onboarding link for Stripe Connect
  app.post("/api/stripe-connect/onboarding-link", requireAuth, async (req, res) => {
    try {
      const baker = await storage.getBaker(req.session.bakerId!);
      if (!baker) return res.status(404).json({ message: "Baker not found" });

      if (!baker.stripeConnectAccountId) {
        return res.status(400).json({ message: "No Connect account found. Create one first." });
      }

      const stripe = await getUncachableStripeClient();

      const baseUrl = req.headers.origin || `https://${req.headers.host}`;
      const accountLink = await stripe.accountLinks.create({
        account: baker.stripeConnectAccountId,
        refresh_url: `${baseUrl}/settings?tab=payments&connect=refresh`,
        return_url: `${baseUrl}/settings?tab=payments&connect=complete&stripe=connected`,
        type: "account_onboarding",
      });

      res.json({ url: accountLink.url });
    } catch (error: any) {
      console.error("Onboarding link error:", error);
      res.status(500).json({ message: "Failed to create onboarding link" });
    }
  });

  // Check Connect account status (after onboarding return)
  app.get("/api/stripe-connect/status", requireAuth, async (req, res) => {
    try {
      const baker = await storage.getBaker(req.session.bakerId!);
      if (!baker) return res.status(404).json({ message: "Baker not found" });

      if (!baker.stripeConnectAccountId) {
        return res.json({
          connected: false,
          onboarded: false,
          payoutsEnabled: false,
        });
      }

      const stripe = await getUncachableStripeClient();
      const account = await stripe.accounts.retrieve(baker.stripeConnectAccountId);

      // Update baker record with latest status
      const onboarded = !!account.details_submitted;
      const payoutsEnabled = !!account.payouts_enabled;

      if (onboarded !== baker.stripeConnectOnboarded || payoutsEnabled !== baker.stripeConnectPayoutsEnabled) {
        await storage.updateBaker(baker.id, {
          stripeConnectOnboarded: onboarded,
          stripeConnectPayoutsEnabled: payoutsEnabled,
        });
      }
      if (onboarded && payoutsEnabled) {
        await storage.setActivationTimestamp(baker.id, "stripeConnectedAt");
      }

      res.json({
        connected: true,
        onboarded,
        payoutsEnabled,
        accountId: account.id,
      });
    } catch (error: any) {
      console.error("Connect status error:", error);
      res.status(500).json({ message: "Failed to check Connect status" });
    }
  });

  // Baker payment history and stats
  app.get("/api/payments", requireAuth, async (req, res) => {
    try {
      const bakerId = req.session.bakerId!;
      const payments = await storage.getQuotePaymentsByBaker(bakerId);

      const totalReceived = payments
        .filter(p => p.status === "succeeded")
        .reduce((sum, p) => sum + parseFloat(p.amount), 0);
      const totalFees = payments
        .filter(p => p.status === "succeeded")
        .reduce((sum, p) => sum + parseFloat(p.platformFee), 0);
      const netEarnings = totalReceived - totalFees;
      const totalTransactions = payments.filter(p => p.status === "succeeded").length;

      const now = new Date();
      const thisMonth = payments.filter(p => {
        const d = new Date(p.createdAt);
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear() && p.status === "succeeded";
      });
      const monthlyReceived = thisMonth.reduce((sum, p) => sum + parseFloat(p.amount), 0);

      res.json({
        payments,
        stats: {
          totalReceived,
          totalFees,
          netEarnings,
          totalTransactions,
          monthlyReceived,
        },
      });
    } catch (error) {
      console.error("Error fetching payments:", error);
      res.status(500).json({ message: "Failed to fetch payments" });
    }
  });

  // Create Stripe Checkout session for quote payment (customer-facing, no auth required)
  app.post("/api/quotes/:id/payment-session", async (req, res) => {
    try {
      const quote = await storage.getQuote(req.params.id);
      if (!quote) return res.status(404).json({ message: "Quote not found" });

      // Only sent quotes can be paid
      if (quote.status !== "sent" && quote.status !== "accepted") {
        return res.status(400).json({ message: "Quote is not available for payment" });
      }

      const baker = await storage.getBaker(quote.bakerId);
      if (!baker) return res.status(404).json({ message: "Baker not found" });

      if (!baker.stripeConnectAccountId || !baker.stripeConnectOnboarded) {
        return res.status(400).json({ message: "Baker has not set up online payments" });
      }

      const customer = await storage.getCustomer(quote.customerId);

      const stripe = await getUncachableStripeClient();
      const { paymentType } = req.body; // "deposit" or "full"

      // Calculate payment amount
      const total = parseFloat(quote.total);
      let paymentAmount: number;

      if (paymentType === "deposit") {
        // Use quote deposit settings, fallback to baker defaults
        const depositType = quote.depositType || baker.defaultDepositType || "percentage";
        if (depositType === "full") {
          paymentAmount = total;
        } else if (depositType === "fixed" && quote.depositAmount) {
          paymentAmount = parseFloat(quote.depositAmount);
        } else {
          const pct = quote.depositPercent || baker.depositPercentage || 50;
          paymentAmount = Math.round(total * (pct / 100) * 100) / 100;
        }
      } else {
        // Full payment or remaining balance
        const alreadyPaid = parseFloat(quote.amountPaid || "0");
        paymentAmount = total - alreadyPaid;
      }

      if (paymentAmount <= 0) {
        return res.status(400).json({ message: "No payment amount due" });
      }

      // Calculate platform fee based on baker's plan
      const effectivePlan = getEffectivePlan(baker);
      const feePercent = getPlatformFeePercent(effectivePlan);
      const platformFee = Math.round(paymentAmount * (feePercent / 100) * 100) / 100;

      const baseUrl = req.headers.origin || `https://${req.headers.host}`;

      const session = await stripe.checkout.sessions.create({
        mode: "payment",
        line_items: [
          {
            price_data: {
              currency: baker.currency?.toLowerCase() || "usd",
              product_data: {
                name: `${quote.title} - ${paymentType === "deposit" ? "Deposit" : "Payment"}`,
                description: `Quote #${quote.quoteNumber} from ${baker.businessName}`,
              },
              unit_amount: Math.round(paymentAmount * 100), // cents
            },
            quantity: 1,
          },
        ],
        payment_intent_data: {
          application_fee_amount: Math.round(platformFee * 100), // cents
          transfer_data: {
            destination: baker.stripeConnectAccountId,
          },
        },
        customer_email: customer?.email || undefined,
        metadata: {
          quoteId: quote.id,
          bakerId: baker.id,
          paymentType,
          platformFee: platformFee.toString(),
        },
        success_url: `${baseUrl}/quote/${quote.id}/pay?status=success`,
        cancel_url: `${baseUrl}/quote/${quote.id}/pay?status=cancelled`,
      });

      await storage.setActivationTimestamp(quote.bakerId, "firstInvoiceCreatedAt");

      res.json({ url: session.url, sessionId: session.id });
    } catch (error: any) {
      console.error("Payment session error:", error);
      res.status(500).json({ message: "Failed to create payment session" });
    }
  });

  // Stripe Connect webhook for payment completion
  app.post("/api/stripe-connect/webhook", async (req, res) => {
    try {
      const stripe = await getUncachableStripeClient();
      const sig = req.headers["stripe-signature"];

      let event;
      if (sig && req.rawBody) {
        const endpointSecret = process.env.STRIPE_CONNECT_WEBHOOK_SECRET;
        if (endpointSecret) {
          try {
            event = stripe.webhooks.constructEvent(
              req.rawBody as Buffer,
              sig as string,
              endpointSecret
            );
          } catch (err: any) {
            console.error("Connect webhook signature verification failed:", err.message);
            return res.status(400).json({ message: "Invalid signature" });
          }
        } else {
          console.warn("STRIPE_CONNECT_WEBHOOK_SECRET not set, processing without verification");
          event = req.body;
        }
      } else {
        event = req.body;
      }

      if (event.type === "checkout.session.completed") {
        const session = event.data.object;

        if (session.payment_status !== "paid") {
          console.log(`[Webhook] Skipping checkout.session.completed with payment_status=${session.payment_status}`);
          return res.json({ received: true });
        }

        const quoteId = session.metadata?.quoteId;
        const bakerId = session.metadata?.bakerId;
        const paymentType = session.metadata?.paymentType || "full";
        const platformFee = session.metadata?.platformFee || "0";

        if (quoteId && bakerId) {
          const quote = await storage.getQuote(quoteId);
          if (quote) {
            const paidAmount = (session.amount_total || 0) / 100;
            const previouslyPaid = parseFloat(quote.amountPaid || "0");
            const totalPaid = previouslyPaid + paidAmount;
            const total = parseFloat(quote.total);

            const newPaymentStatus = totalPaid >= total ? "paid" : "deposit_paid";

            await storage.updateQuote(quoteId, {
              paymentStatus: newPaymentStatus,
              stripePaymentIntentId: session.payment_intent,
              amountPaid: totalPaid.toFixed(2),
              ...(newPaymentStatus === "paid" ? { paidAt: new Date() } : {}),
              ...(quote.status === "sent" ? { status: "approved", acceptedAt: new Date() } : {}),
            });

            await storage.createQuotePayment({
              quoteId,
              bakerId,
              stripePaymentIntentId: session.payment_intent || session.id,
              amount: paidAmount.toFixed(2),
              platformFee,
              status: "succeeded",
              paymentType,
            });

            await storage.setActivationTimestamp(bakerId, "firstPaymentProcessedAt");

            const baker = await storage.getBaker(bakerId);
            const customer = await storage.getCustomer(quote.customerId);
            if (baker && customer) {
              sendPaymentReceivedNotification(baker.email, baker.businessName, {
                customerName: customer.name,
                quoteTitle: quote.title,
                quoteNumber: quote.quoteNumber,
                amount: paidAmount,
                paymentType,
                totalQuoteAmount: total,
                totalPaid,
              }).catch(err => console.error("Failed to send payment notification:", err));
            }
          }
        }
      }

      res.json({ received: true });
    } catch (error) {
      console.error("Connect webhook error:", error);
      res.status(500).json({ message: "Webhook processing failed" });
    }
  });

  // Stripe Connect dashboard link (for bakers to manage their payout settings)
  app.post("/api/stripe-connect/dashboard-link", requireAuth, async (req, res) => {
    try {
      const baker = await storage.getBaker(req.session.bakerId!);
      if (!baker) return res.status(404).json({ message: "Baker not found" });

      if (!baker.stripeConnectAccountId) {
        return res.status(400).json({ message: "No Connect account found" });
      }

      const stripe = await getUncachableStripeClient();
      const loginLink = await stripe.accounts.createLoginLink(baker.stripeConnectAccountId);

      res.json({ url: loginLink.url });
    } catch (error: any) {
      console.error("Dashboard link error:", error);
      // If account isn't fully onboarded, login link won't work - return onboarding link instead
      res.status(400).json({ message: "Account not fully set up. Complete onboarding first." });
    }
  });

  // Stripe Connect - create payment session (public, customer-facing)
  app.post("/api/stripe-connect/create-payment-session", async (req, res) => {
    try {
      const { quoteId, paymentType } = req.body;
      if (!quoteId || !["deposit", "full"].includes(paymentType)) {
        return res.status(400).json({ message: "Invalid request" });
      }

      const quote = await storage.getQuoteWithItems(quoteId);
      if (!quote) return res.status(404).json({ message: "Quote not found" });

      if (quote.status !== "approved" && quote.status !== "sent") {
        return res.status(400).json({ message: "Quote is not available for payment" });
      }
      if (quote.paymentStatus === "paid") {
        return res.status(400).json({ message: "This quote has already been paid" });
      }

      const baker = await storage.getBaker(quote.bakerId);
      if (!baker) return res.status(404).json({ message: "Baker not found" });

      if (!baker.stripeConnectAccountId || !baker.stripeConnectOnboarded) {
        return res.status(400).json({ message: "Online payments are not available for this baker" });
      }

      const customer = await storage.getCustomer(quote.customerId);
      if (!customer) return res.status(404).json({ message: "Customer not found" });

      const total = parseFloat(quote.total);
      const amountPaid = parseFloat(quote.amountPaid || "0");
      let paymentAmount: number;

      if (paymentType === "deposit") {
        let depositAmt = 0;
        if (baker.defaultDepositType === "percentage" && baker.depositPercentage) {
          depositAmt = total * (baker.depositPercentage / 100);
        } else if (baker.defaultDepositType === "fixed" && baker.depositFixedAmount) {
          depositAmt = parseFloat(baker.depositFixedAmount);
        }
        if (depositAmt <= 0) {
          return res.status(400).json({ message: "No deposit amount configured" });
        }
        paymentAmount = depositAmt;
      } else {
        paymentAmount = total - amountPaid;
      }

      if (paymentAmount <= 0) {
        return res.status(400).json({ message: "No amount due" });
      }

      const effectivePlanForFee = getEffectivePlan(baker);
      const platformFeePercent = getPlatformFeePercent(effectivePlanForFee);
      const applicationFeeAmount = Math.round(paymentAmount * (platformFeePercent / 100) * 100);
      const amountInCents = Math.round(paymentAmount * 100);

      const stripe = await getUncachableStripeClient();
      const baseUrl = `${req.protocol}://${req.get("host")}`;

      const session = await stripe.checkout.sessions.create({
        mode: "payment",
        line_items: [{
          price_data: {
            currency: (baker.currency || "usd").toLowerCase(),
            product_data: {
              name: `${quote.title} - ${paymentType === "deposit" ? "Deposit" : "Payment"}`,
              description: `Quote #${quote.quoteNumber} from ${baker.businessName}`,
            },
            unit_amount: amountInCents,
          },
          quantity: 1,
        }],
        payment_intent_data: {
          application_fee_amount: applicationFeeAmount,
          transfer_data: {
            destination: baker.stripeConnectAccountId,
          },
        },
        customer_email: customer.email,
        metadata: {
          quoteId: quote.id,
          bakerId: baker.id,
          paymentType,
          amount: paymentAmount.toString(),
        },
        success_url: `${baseUrl}/quote/${quoteId}?payment=success`,
        cancel_url: `${baseUrl}/quote/${quoteId}?payment=cancelled`,
      });

      res.json({ url: session.url });
    } catch (error: any) {
      console.error("Create payment session error:", error);
      res.status(500).json({ message: error.message || "Failed to create payment session" });
    }
  });

  // Admin middleware: allows both "admin" and "super_admin" roles
  async function requireAdmin(req: Request, res: Response, next: NextFunction) {
    if (!req.session.bakerId) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const baker = await storage.getBaker(req.session.bakerId);
    if (!baker || (baker.role !== "super_admin" && baker.role !== "admin")) {
      return res.status(403).json({ message: "Admin access required" });
    }
    next();
  }

  // Super admin middleware: only "super_admin" role
  async function requireSuperAdmin(req: Request, res: Response, next: NextFunction) {
    if (!req.session.bakerId) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const baker = await storage.getBaker(req.session.bakerId);
    if (!baker || baker.role !== "super_admin") {
      return res.status(403).json({ message: "Requires Super Admin access" });
    }
    next();
  }

  // Audit logging helper
  async function logAdminAction(adminUserId: string, actionKey: string, targetId?: string, metadata?: any) {
    try {
      await db.insert(adminAuditLogs).values({
        adminUserId,
        actionKey,
        targetId: targetId || null,
        metadata: metadata || null,
      });
    } catch (error) {
      console.error("Audit log error:", error);
    }
  }

  app.get("/api/admin/bakers", requireSuperAdmin, async (req, res) => {
    const allBakers = await storage.getAllBakers();
    res.json(allBakers.map(b => ({ ...b, passwordHash: undefined })));
  });

  app.patch("/api/admin/bakers/:id", requireSuperAdmin, async (req, res) => {
    try {
      const schema = z.object({
        role: z.enum(["baker", "admin", "super_admin"]).optional(),
        businessName: z.string().optional(),
        email: z.string().email().optional(),
        plan: z.enum(["free", "basic", "pro"]).optional(),
      });
      const data = schema.parse(req.body);
      
      const updated = await storage.updateBaker(req.params.id, data);
      if (!updated) {
        return res.status(404).json({ message: "Baker not found" });
      }
      if (data.role) {
        await logAdminAction(req.session.bakerId!, "ROLE_CHANGE", req.params.id, { newRole: data.role });
      }
      res.json({ ...updated, passwordHash: undefined });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      res.status(500).json({ message: "Failed to update baker" });
    }
  });

  app.delete("/api/admin/bakers/:id", requireSuperAdmin, async (req, res) => {
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

  app.get("/api/admin/stats", requireSuperAdmin, async (req, res) => {
    const allBakers = await storage.getAllBakers();
    const totalBakers = allBakers.length;
    const verifiedBakers = allBakers.filter(b => b.emailVerified).length;
    res.json({ totalBakers, verifiedBakers });
  });

  // Enhanced admin analytics
  app.get("/api/admin/analytics", requireSuperAdmin, async (req, res) => {
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

  // Analytics Cockpit — Overview (Sections 1-4)
  app.get("/api/admin/analytics/overview", requireSuperAdmin, async (req, res) => {
    try {
      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);

      // --- SECTION 1: Activation Funnel (cohort = signups in last 30d) ---
      const funnelResult = await pool.query(`
        WITH cohort AS (
          SELECT id, created_at, stripe_connected_at, first_quote_sent_at, first_payment_processed_at
          FROM bakers
          WHERE created_at >= $1 AND role != 'super_admin'
        )
        SELECT
          COUNT(*)::int AS signups_30d,
          COUNT(*) FILTER (WHERE stripe_connected_at IS NOT NULL AND stripe_connected_at <= created_at + interval '7 days')::int AS stripe_connected_7d,
          COUNT(*) FILTER (WHERE first_quote_sent_at IS NOT NULL AND first_quote_sent_at <= created_at + interval '14 days')::int AS first_quote_14d,
          COUNT(*) FILTER (WHERE first_payment_processed_at IS NOT NULL AND first_payment_processed_at <= created_at + interval '30 days')::int AS first_payment_30d
        FROM cohort
      `, [thirtyDaysAgo.toISOString()]);

      const funnel = funnelResult.rows[0];
      const signups30d = funnel.signups_30d || 0;

      // Median days to Stripe connect (for cohort who connected)
      const medianResult = await pool.query(`
        SELECT percentile_cont(0.5) WITHIN GROUP (
          ORDER BY EXTRACT(EPOCH FROM (stripe_connected_at - created_at)) / 86400.0
        ) AS median_days
        FROM bakers
        WHERE created_at >= $1 AND role != 'super_admin'
          AND stripe_connected_at IS NOT NULL
          AND stripe_connected_at <= created_at + interval '30 days'
      `, [thirtyDaysAgo.toISOString()]);

      const medianDaysToStripe = medianResult.rows[0]?.median_days != null
        ? Math.round(medianResult.rows[0].median_days * 10) / 10
        : null;

      const activationFunnel = {
        signups_30d: signups30d,
        stripe_connected_within_7d_count: funnel.stripe_connected_7d,
        stripe_connected_within_7d_pct: signups30d > 0 ? Math.round((funnel.stripe_connected_7d / signups30d) * 1000) / 10 : 0,
        first_quote_within_14d_count: funnel.first_quote_14d,
        first_quote_within_14d_pct: signups30d > 0 ? Math.round((funnel.first_quote_14d / signups30d) * 1000) / 10 : 0,
        first_payment_within_30d_count: funnel.first_payment_30d,
        first_payment_within_30d_pct: signups30d > 0 ? Math.round((funnel.first_payment_30d / signups30d) * 1000) / 10 : 0,
        median_days_to_stripe_connect: medianDaysToStripe,
      };

      // --- SECTION 2: Revenue Health (last 30d) ---
      const revenueResult = await pool.query(`
        SELECT
          COUNT(DISTINCT baker_id)::int AS active_processors_30d,
          COALESCE(SUM(amount::numeric), 0)::numeric AS gmv_30d,
          COALESCE(SUM(platform_fee::numeric), 0)::numeric AS transaction_fee_revenue_30d,
          COUNT(*)::int AS payments_count_30d
        FROM quote_payments
        WHERE status = 'succeeded' AND created_at >= $1
      `, [thirtyDaysAgo.toISOString()]);

      const rev = revenueResult.rows[0];
      const activeProcessors = rev.active_processors_30d || 0;
      const gmv30d = parseFloat(rev.gmv_30d) || 0;
      const txFeeRevenue30d = parseFloat(rev.transaction_fee_revenue_30d) || 0;

      // Stripe connect rate (overall)
      const connectRateResult = await pool.query(`
        SELECT
          COUNT(*) FILTER (WHERE stripe_connected_at IS NOT NULL)::int AS connected,
          COUNT(*)::int AS total
        FROM bakers WHERE role != 'super_admin'
      `);
      const cr = connectRateResult.rows[0];
      const stripeConnectRateOverall = cr.total > 0 ? Math.round((cr.connected / cr.total) * 1000) / 10 : 0;

      // Subscriptions MRR from current plan distribution
      const mrrResult = await pool.query(`
        SELECT
          COUNT(*) FILTER (WHERE plan = 'basic')::int AS basic_count,
          COUNT(*) FILTER (WHERE plan = 'pro')::int AS pro_count
        FROM bakers WHERE role != 'super_admin'
      `);
      const mrrRow = mrrResult.rows[0];
      const subscriptionsMrrCurrent = (mrrRow.basic_count * 4.99) + (mrrRow.pro_count * 9.99);

      const revenueHealth = {
        active_processors_30d: activeProcessors,
        gmv_30d: Math.round(gmv30d * 100) / 100,
        avg_gmv_per_active_processor_30d: activeProcessors > 0
          ? Math.round((gmv30d / activeProcessors) * 100) / 100
          : 0,
        stripe_connect_rate_overall: stripeConnectRateOverall,
        subscriptions_mrr_current: Math.round(subscriptionsMrrCurrent * 100) / 100,
        transaction_fee_revenue_30d: {
          value: Math.round(txFeeRevenue30d * 100) / 100,
          estimated: false,
        },
        total_platform_revenue_30d: Math.round((subscriptionsMrrCurrent + txFeeRevenue30d) * 100) / 100,
      };

      // --- SECTION 3: Retention Snapshot ---
      const retention30dResult = await pool.query(`
        SELECT COUNT(DISTINCT baker_id)::int AS active
        FROM quote_payments
        WHERE status = 'succeeded' AND created_at >= $1
      `, [thirtyDaysAgo.toISOString()]);

      const retention90dResult = await pool.query(`
        SELECT COUNT(DISTINCT baker_id)::int AS active
        FROM quote_payments
        WHERE status = 'succeeded' AND created_at >= $1
      `, [ninetyDaysAgo.toISOString()]);

      const retentionSnapshot = {
        active_bakers_30d: retention30dResult.rows[0]?.active || 0,
        active_bakers_90d: retention90dResult.rows[0]?.active || 0,
        churn_basic_30d: null as number | null,
        churn_pro_30d: null as number | null,
        churn_note: "Requires subscription history tracking to compute accurately",
        median_ltv: null as number | null,
        median_paid_tenure_months: null as number | null,
        ltv_note: "Requires billing history to compute accurately",
      };

      // --- SECTION 4: Tier Distribution ---
      const tierResult = await pool.query(`
        SELECT
          COUNT(*) FILTER (WHERE plan = 'free' OR plan IS NULL)::int AS free_count,
          COUNT(*) FILTER (WHERE plan = 'basic')::int AS basic_count,
          COUNT(*) FILTER (WHERE plan = 'pro')::int AS pro_count,
          COUNT(*)::int AS total
        FROM bakers WHERE role != 'super_admin'
      `);
      const tier = tierResult.rows[0];
      const tierTotal = tier.total || 1;

      const tierDistribution = {
        free_count: tier.free_count,
        basic_count: tier.basic_count,
        pro_count: tier.pro_count,
        total: tier.total,
        free_pct: Math.round((tier.free_count / tierTotal) * 1000) / 10,
        basic_pct: Math.round((tier.basic_count / tierTotal) * 1000) / 10,
        pro_pct: Math.round((tier.pro_count / tierTotal) * 1000) / 10,
      };

      res.json({
        activationFunnel,
        revenueHealth,
        retentionSnapshot,
        tierDistribution,
      });
    } catch (error) {
      console.error("Admin analytics overview error:", error);
      res.status(500).json({ message: "Failed to get analytics overview" });
    }
  });

  // Analytics Cockpit — Trends (Section 5: 30 daily buckets)
  app.get("/api/admin/analytics/trends", requireSuperAdmin, async (req, res) => {
    try {
      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      // Signups by day
      const signupsResult = await pool.query(`
        SELECT to_char(date_trunc('day', created_at AT TIME ZONE 'UTC'), 'YYYY-MM-DD') AS date,
               COUNT(*)::int AS signups
        FROM bakers
        WHERE created_at >= $1 AND role != 'super_admin'
        GROUP BY 1 ORDER BY 1
      `, [thirtyDaysAgo.toISOString()]);

      // Stripe connections by day (based on stripeConnectedAt)
      const connectionsResult = await pool.query(`
        SELECT to_char(date_trunc('day', stripe_connected_at AT TIME ZONE 'UTC'), 'YYYY-MM-DD') AS date,
               COUNT(*)::int AS stripe_connections
        FROM bakers
        WHERE stripe_connected_at >= $1 AND role != 'super_admin'
        GROUP BY 1 ORDER BY 1
      `, [thirtyDaysAgo.toISOString()]);

      // Payments by day
      const paymentsResult = await pool.query(`
        SELECT to_char(date_trunc('day', created_at AT TIME ZONE 'UTC'), 'YYYY-MM-DD') AS date,
               COUNT(*)::int AS payments_succeeded_count,
               COALESCE(SUM(amount::numeric), 0)::numeric AS gmv
        FROM quote_payments
        WHERE status = 'succeeded' AND created_at >= $1
        GROUP BY 1 ORDER BY 1
      `, [thirtyDaysAgo.toISOString()]);

      // Build 30-day buckets
      const signupMap = new Map(signupsResult.rows.map((r: any) => [r.date, r.signups]));
      const connectionMap = new Map(connectionsResult.rows.map((r: any) => [r.date, r.stripe_connections]));
      const paymentMap = new Map(paymentsResult.rows.map((r: any) => [r.date, { count: r.payments_succeeded_count, gmv: parseFloat(r.gmv) }]));

      const trends: Array<{
        date: string;
        signups: number;
        stripe_connections: number;
        payments_succeeded_count: number;
        gmv: number;
      }> = [];

      for (let i = 29; i >= 0; i--) {
        const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
        const dateStr = d.toISOString().slice(0, 10);
        const payment = paymentMap.get(dateStr) || { count: 0, gmv: 0 };
        trends.push({
          date: dateStr,
          signups: signupMap.get(dateStr) || 0,
          stripe_connections: connectionMap.get(dateStr) || 0,
          payments_succeeded_count: payment.count,
          gmv: Math.round(payment.gmv * 100) / 100,
        });
      }

      res.json({ trends });
    } catch (error) {
      console.error("Admin analytics trends error:", error);
      res.status(500).json({ message: "Failed to get analytics trends" });
    }
  });

  // Admin payment overview
  app.get("/api/admin/payments", requireSuperAdmin, async (req, res) => {
    try {
      const allPayments = await storage.getAllQuotePayments();
      const allBakers = await storage.getAllBakers();
      const connectAccounts = allBakers.filter(b => b.stripeConnectAccountId);

      const succeeded = allPayments.filter(p => p.status === "succeeded");
      const totalVolume = succeeded.reduce((sum, p) => sum + parseFloat(p.amount), 0);
      const totalPlatformFees = succeeded.reduce((sum, p) => sum + parseFloat(p.platformFee), 0);

      const now = new Date();
      const thisMonth = succeeded.filter(p => {
        const d = new Date(p.createdAt);
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      });
      const monthlyVolume = thisMonth.reduce((sum, p) => sum + parseFloat(p.amount), 0);
      const monthlyFees = thisMonth.reduce((sum, p) => sum + parseFloat(p.platformFee), 0);

      const connectHealth = allBakers.map(b => ({
        businessName: b.businessName,
        email: b.email,
        plan: b.plan || "free",
        hasConnectAccount: !!b.stripeConnectAccountId,
        onboarded: !!b.stripeConnectOnboarded,
        payoutsEnabled: !!b.stripeConnectPayoutsEnabled,
      }));

      const bakerPlanMap = new Map(allBakers.map(b => [b.id, b.plan || "free"]));
      const revenueByPlan: Record<string, { volume: number; fees: number; transactions: number; feePercent: number }> = {
        free: { volume: 0, fees: 0, transactions: 0, feePercent: PLATFORM_FEE_FREE },
        basic: { volume: 0, fees: 0, transactions: 0, feePercent: PLATFORM_FEE_BASIC },
        pro: { volume: 0, fees: 0, transactions: 0, feePercent: PLATFORM_FEE_PRO },
      };
      for (const p of succeeded) {
        const plan = bakerPlanMap.get(p.bakerId) || "free";
        const bucket = revenueByPlan[plan] || revenueByPlan.free;
        bucket.volume += parseFloat(p.amount);
        bucket.fees += parseFloat(p.platformFee);
        bucket.transactions += 1;
      }

      res.json({
        payments: allPayments.slice(0, 50),
        stats: {
          totalVolume,
          totalPlatformFees,
          totalTransactions: succeeded.length,
          monthlyVolume,
          monthlyFees,
          monthlyTransactions: thisMonth.length,
          connectAccountsTotal: connectAccounts.length,
          connectAccountsOnboarded: connectAccounts.filter(b => b.stripeConnectOnboarded).length,
          connectAccountsActive: connectAccounts.filter(b => b.stripeConnectPayoutsEnabled).length,
        },
        connectHealth,
        revenueByPlan,
      });
    } catch (error) {
      console.error("Admin payments error:", error);
      res.status(500).json({ message: "Failed to fetch payment data" });
    }
  });

  // Financial analytics endpoint for admin
  app.get("/api/admin/financials", requireSuperAdmin, async (req, res) => {
    try {
      const [allBakers, allPayments, allCommissions] = await Promise.all([
        storage.getAllBakers(),
        storage.getAllQuotePayments(),
        storage.getAllCommissions(),
      ]);

      const totalBakers = allBakers.length;
      const bakersByPlan = {
        free: allBakers.filter(b => (b.plan || "free") === "free").length,
        basic: allBakers.filter(b => b.plan === "basic").length,
        pro: allBakers.filter(b => b.plan === "pro").length,
      };

      const succeeded = allPayments.filter((p: any) => p.status === "succeeded");
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const thisMonthPayments = succeeded.filter((p: any) => new Date(p.createdAt) >= startOfMonth);

      const totalGMV = succeeded.reduce((sum: number, p: any) => sum + parseFloat(p.amount), 0);
      const monthlyGMV = thisMonthPayments.reduce((sum: number, p: any) => sum + parseFloat(p.amount), 0);
      const platformFeeRevenue = succeeded.reduce((sum: number, p: any) => sum + parseFloat(p.platformFee), 0);
      const monthlyPlatformFees = thisMonthPayments.reduce((sum: number, p: any) => sum + parseFloat(p.platformFee), 0);

      const subscriptionMonthly = (bakersByPlan.basic * 4.99) + (bakersByPlan.pro * 9.99);
      const subscriptionRevenue = {
        monthly: subscriptionMonthly,
        annual: subscriptionMonthly * 12,
      };

      const totalPaidCommissions = allCommissions
        .filter(c => c.status === "paid")
        .reduce((sum, c) => sum + parseFloat(c.commissionAmount), 0);
      const totalPendingCommissions = allCommissions
        .filter(c => c.status === "pending" || c.status === "approved")
        .reduce((sum, c) => sum + parseFloat(c.commissionAmount), 0);
      const totalAllCommissions = allCommissions
        .reduce((sum, c) => sum + parseFloat(c.commissionAmount), 0);

      const affiliateCosts = {
        totalPaid: totalPaidCommissions,
        totalPending: totalPendingCommissions,
        totalAll: totalAllCommissions,
      };

      const monthlyAffiliateCostEstimate = totalAllCommissions > 0 ? totalAllCommissions / 6 : 0;
      const monthlyNetRevenue = monthlyPlatformFees + subscriptionMonthly - monthlyAffiliateCostEstimate;
      const totalNetRevenue = platformFeeRevenue + subscriptionRevenue.annual - totalAllCommissions;

      const netRevenue = {
        monthly: monthlyNetRevenue,
        total: totalNetRevenue,
      };

      const arpu = totalBakers > 0 ? totalNetRevenue / totalBakers : 0;
      const monthlyArpu = totalBakers > 0 ? monthlyNetRevenue / totalBakers : 0;

      const connectBakers = allBakers.filter(b => b.stripeConnectAccountId);
      const stripeConnectAdoption = totalBakers > 0 ? (connectBakers.length / totalBakers) * 100 : 0;

      const monthlyTrends: Array<{
        month: string;
        gmv: number;
        platformFees: number;
        subscriptionRevenue: number;
        newBakers: number;
        totalBakers: number;
      }> = [];

      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
        const monthLabel = d.toLocaleDateString("en-US", { month: "short", year: "numeric" });

        const monthPayments = succeeded.filter((p: any) => {
          const pd = new Date(p.createdAt);
          return pd.getFullYear() === d.getFullYear() && pd.getMonth() === d.getMonth();
        });

        const gmv = monthPayments.reduce((sum: number, p: any) => sum + parseFloat(p.amount), 0);
        const fees = monthPayments.reduce((sum: number, p: any) => sum + parseFloat(p.platformFee), 0);

        const newBakersThisMonth = allBakers.filter(b => {
          const bd = new Date(b.createdAt);
          return bd.getFullYear() === d.getFullYear() && bd.getMonth() === d.getMonth();
        }).length;

        const totalBakersAtMonth = allBakers.filter(b => new Date(b.createdAt) <= monthEnd).length;

        monthlyTrends.push({
          month: monthLabel,
          gmv,
          platformFees: fees,
          subscriptionRevenue: subscriptionMonthly,
          newBakers: newBakersThisMonth,
          totalBakers: totalBakersAtMonth,
        });
      }

      res.json({
        liveMetrics: {
          totalBakers,
          bakersByPlan,
          totalGMV,
          monthlyGMV,
          platformFeeRevenue,
          monthlyPlatformFees,
          subscriptionRevenue,
          affiliateCosts,
          netRevenue,
          arpu,
          monthlyArpu,
          stripeConnectAdoption,
          monthlyTrends,
        },
      });
    } catch (error) {
      console.error("Admin financials error:", error);
      res.status(500).json({ message: "Failed to fetch financial data" });
    }
  });

  // Suspend/unsuspend baker
  app.post("/api/admin/bakers/:id/suspend", requireSuperAdmin, async (req, res) => {
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

  app.post("/api/admin/bakers/:id/unsuspend", requireSuperAdmin, async (req, res) => {
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
  app.post("/api/admin/bakers/:id/reset-password", requireSuperAdmin, async (req, res) => {
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
  app.post("/api/admin/bakers/:id/reset-quote-limit", requireSuperAdmin, async (req, res) => {
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
  app.post("/api/admin/bakers/:id/impersonate", requireSuperAdmin, async (req, res) => {
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
  app.get("/api/admin/bakers/:id/activity", requireSuperAdmin, async (req, res) => {
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
  app.get("/api/admin/email-logs", requireSuperAdmin, async (req, res) => {
    try {
      const emailLogs = await storage.getAdminEmailLogs();
      res.json(emailLogs);
    } catch (error) {
      console.error("Get email logs error:", error);
      res.status(500).json({ message: "Failed to get email logs" });
    }
  });

  // Resend onboarding email manually
  app.post("/api/admin/bakers/:id/resend-email", requireSuperAdmin, async (req, res) => {
    try {
      const { emailDay, force } = req.body;
      const baker = await storage.getBaker(req.params.id);
      if (!baker) {
        return res.status(404).json({ message: "Baker not found" });
      }

      const stripeConnected = !!(baker.stripeConnectAccountId && baker.stripeConnectOnboarded && baker.stripeConnectPayoutsEnabled);
      const { getEmailKeyForDay } = await import("./email");
      const emailKey = getEmailKeyForDay(emailDay, stripeConnected);

      if (!force) {
        const alreadySent = await storage.hasOnboardingEmailKeyBeenSent(baker.id, emailKey);
        if (alreadySent) {
          return res.status(409).json({ message: `Email ${emailKey} already sent to this baker. Use force=true to resend.` });
        }
      }

      await storage.deleteOnboardingEmail(baker.id, emailDay);
      await storage.deleteOnboardingEmailSend(baker.id, emailKey);

      const baseUrl = `${req.protocol}://${req.get("host")}`;
      const result = await sendOnboardingEmail(baker.email, baker.businessName, emailDay, baseUrl, stripeConnected);

      if (result.success) {
        await storage.recordOnboardingEmail(baker.id, emailDay, "sent", undefined, result.emailKey, stripeConnected);
        const variant = stripeConnected ? "stripe_connected" : "stripe_not_connected";
        await storage.recordOnboardingEmailSend(baker.id, result.emailKey, variant);
        res.json({ message: `Email day ${emailDay} (${result.emailKey}) resent to ${baker.email}` });
      } else {
        await storage.recordOnboardingEmail(baker.id, emailDay, "failed", "Email send failed", result.emailKey, stripeConnected);
        res.status(500).json({ message: "Failed to send email" });
      }
    } catch (error) {
      console.error("Resend email error:", error);
      res.status(500).json({ message: "Failed to resend email" });
    }
  });

  app.get("/api/admin/onboarding-stats", requireSuperAdmin, async (req, res) => {
    try {
      const stats = await storage.getOnboardingEmailStats();
      const allBakers = await storage.getAllBakers();

      const withinWindow = (signupDate: Date | null, eventDate: Date | null, hours: number): boolean => {
        if (!signupDate || !eventDate) return false;
        return (eventDate.getTime() - signupDate.getTime()) <= hours * 60 * 60 * 1000;
      };

      const activationStats = {
        totalBakers: stats.totalBakers,
        stripeConnectedWithin7Days: stats.stripeConnectedWithin7Days,
        stripeAdoptionRate: stats.totalBakers > 0 ? ((stats.stripeConnectedWithin7Days / stats.totalBakers) * 100).toFixed(1) : "0",
        emailsSentByKey: stats.emailsSentByKey,
        activationMilestones: {
          stripeConnected: allBakers.filter(b => b.stripeConnectedAt).length,
          firstProductCreated: allBakers.filter(b => b.firstProductCreatedAt).length,
          firstQuoteSent: allBakers.filter(b => b.firstQuoteSentAt).length,
          firstInvoiceCreated: allBakers.filter(b => b.firstInvoiceCreatedAt).length,
          firstPaymentProcessed: allBakers.filter(b => b.firstPaymentProcessedAt).length,
        },
        conversionWindows: {
          stripeConnected24h: allBakers.filter(b => withinWindow(b.createdAt, b.stripeConnectedAt, 24)).length,
          stripeConnected72h: allBakers.filter(b => withinWindow(b.createdAt, b.stripeConnectedAt, 72)).length,
          stripeConnected7d: allBakers.filter(b => withinWindow(b.createdAt, b.stripeConnectedAt, 168)).length,
          firstQuoteSent7d: allBakers.filter(b => withinWindow(b.createdAt, b.firstQuoteSentAt, 168)).length,
          firstPayment14d: allBakers.filter(b => withinWindow(b.createdAt, b.firstPaymentProcessedAt, 336)).length,
        },
        featureFlagEnabled: process.env.ONBOARDING_CONDITIONALS_ENABLED === "true",
      };

      res.json(activationStats);
    } catch (error) {
      console.error("Get onboarding stats error:", error);
      res.status(500).json({ message: "Failed to get onboarding stats" });
    }
  });

  // Admin Invitation Routes
  app.post("/api/admin/invitations", requireSuperAdmin, async (req, res) => {
    try {
      const schema = z.object({
        email: z.string().email(),
        role: z.enum(["baker", "admin", "super_admin"]).default("baker"),
        giftedPlan: z.enum(["basic", "pro"]).nullable().optional(),
        giftedPlanDurationMonths: z.number().min(1).max(12).default(1),
      });
      const data = schema.parse(req.body);

      const existingBaker = await storage.getBakerByEmail(data.email);
      if (existingBaker) {
        return res.status(400).json({ message: "This email is already registered" });
      }

      const existingInvitation = await storage.getInvitationByEmail(data.email);
      if (existingInvitation && existingInvitation.status === "pending") {
        return res.status(400).json({ message: "A pending invitation already exists for this email" });
      }

      const token = crypto.randomBytes(32).toString("hex");
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

      const invitation = await storage.createInvitation({
        email: data.email,
        role: data.role,
        giftedPlan: data.giftedPlan || null,
        giftedPlanDurationMonths: data.giftedPlan ? data.giftedPlanDurationMonths : null,
        token,
        expiresAt,
        invitedByAdminId: req.session.bakerId!,
      });

      const baseUrl = `https://${req.get("host")}`;
      const inviteLink = `${baseUrl}/signup?invite=${token}`;

      try {
        await sendInvitationEmail(data.email, inviteLink, data.role, data.giftedPlan || null, data.giftedPlan ? data.giftedPlanDurationMonths : null);
      } catch (emailError) {
        console.error("Failed to send invitation email:", emailError);
      }

      await logAdminAction(req.session.bakerId!, "INVITATION_SENT", invitation.id, {
        email: data.email,
        role: data.role,
        giftedPlan: data.giftedPlan || null,
      });

      res.json(invitation);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      console.error("Create invitation error:", error);
      res.status(500).json({ message: "Failed to create invitation" });
    }
  });

  app.get("/api/admin/invitations", requireSuperAdmin, async (req, res) => {
    try {
      const allInvitations = await storage.getInvitations();
      res.json(allInvitations);
    } catch (error) {
      console.error("Get invitations error:", error);
      res.status(500).json({ message: "Failed to get invitations" });
    }
  });

  app.delete("/api/admin/invitations/:id", requireSuperAdmin, async (req, res) => {
    try {
      const invitations = await storage.getInvitations();
      const invitation = invitations.find(i => i.id === req.params.id);
      if (!invitation) {
        return res.status(404).json({ message: "Invitation not found" });
      }
      if (invitation.status !== "pending") {
        return res.status(400).json({ message: "Only pending invitations can be cancelled" });
      }
      await storage.updateInvitation(req.params.id, { status: "cancelled" });
      await logAdminAction(req.session.bakerId!, "INVITATION_CANCELLED", req.params.id, {
        email: invitation.email,
      });
      res.json({ message: "Invitation cancelled" });
    } catch (error) {
      console.error("Cancel invitation error:", error);
      res.status(500).json({ message: "Failed to cancel invitation" });
    }
  });

  app.get("/api/admin/gifted-plans", requireSuperAdmin, async (req, res) => {
    try {
      const allBakers = await storage.getAllBakers();
      const now = new Date();
      const sevenDaysFromNow = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

      const giftedBakers = allBakers
        .filter(b => b.giftedPlan)
        .map(b => {
          const expiresAt = b.giftedPlanExpiresAt ? new Date(b.giftedPlanExpiresAt) : null;
          const isActive = expiresAt ? expiresAt > now : false;
          const isExpiringSoon = expiresAt ? (expiresAt > now && expiresAt <= sevenDaysFromNow) : false;
          const isExpired = expiresAt ? expiresAt <= now : true;
          const convertedToPaid = isExpired && b.plan !== "free" && b.stripeSubscriptionId != null;
          const daysRemaining = expiresAt && isActive ? Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) : 0;

          const inviter = b.invitedByAdminId ? allBakers.find(a => a.id === b.invitedByAdminId) : null;

          return {
            id: b.id,
            businessName: b.businessName,
            email: b.email,
            giftedPlan: b.giftedPlan,
            giftedPlanExpiresAt: b.giftedPlanExpiresAt,
            currentPlan: b.plan,
            inviterName: inviter?.businessName || inviter?.email || "Unknown",
            isActive,
            isExpiringSoon,
            isExpired,
            convertedToPaid,
            daysRemaining,
            createdAt: b.createdAt,
            stripeConnectedAt: b.stripeConnectedAt,
            firstQuoteSentAt: b.firstQuoteSentAt,
            firstPaymentProcessedAt: b.firstPaymentProcessedAt,
          };
        })
        .sort((a, b) => {
          if (a.isActive && !b.isActive) return -1;
          if (!a.isActive && b.isActive) return 1;
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        });

      const stats = {
        total: giftedBakers.length,
        active: giftedBakers.filter(b => b.isActive).length,
        expiringSoon: giftedBakers.filter(b => b.isExpiringSoon).length,
        expired: giftedBakers.filter(b => b.isExpired).length,
        convertedToPaid: giftedBakers.filter(b => b.convertedToPaid).length,
      };

      res.json({ stats, bakers: giftedBakers });
    } catch (error) {
      console.error("Get gifted plans error:", error);
      res.status(500).json({ message: "Failed to get gifted plans data" });
    }
  });

  // Support Chat Routes
  app.post("/api/support/chat", requireAuth, async (req, res) => {
    try {
      const bakerId = req.session.bakerId!;
      const { message, conversationHistory } = req.body;
      
      if (!message || typeof message !== "string") {
        return res.status(400).json({ message: "Message is required" });
      }

      const baker = await storage.getBaker(bakerId);
      
      // Build messages for context
      const messages: { role: "system" | "user" | "assistant"; content: string }[] = [
        {
          role: "system",
          content: `You are a friendly and helpful support assistant for BakerIQ, a lead capture and quote management platform for custom cake bakers. 

Your job is to help bakers with questions about using the platform. Use the following knowledge base to answer questions:

${SUPPORT_KNOWLEDGE_BASE}

Guidelines:
- Be friendly, concise, and helpful
- If you can answer the question from the knowledge base, do so
- If the question is too complex, involves account issues, billing problems, or technical bugs, respond with: "I'd recommend reaching out to our support team for this. Would you like me to create a support ticket so an admin can help you?"
- If the user says yes to creating a ticket, respond with exactly: "[CREATE_TICKET]" followed by a brief summary of their issue
- Don't make up features or information not in the knowledge base
- The baker's business name is: ${baker?.businessName || 'Unknown'}`,
        },
      ];

      // Add conversation history
      if (Array.isArray(conversationHistory)) {
        for (const msg of conversationHistory.slice(-10)) {
          if (msg.role === "user" || msg.role === "assistant") {
            messages.push({ role: msg.role, content: msg.content });
          }
        }
      }

      // Add current message
      messages.push({ role: "user", content: message });

      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages,
        max_tokens: 500,
        temperature: 0.7,
      });

      const aiResponse = completion.choices[0]?.message?.content || "I'm sorry, I couldn't process that. Please try again.";

      res.json({ response: aiResponse });
    } catch (error) {
      console.error("Support chat error:", error);
      res.status(500).json({ message: "Failed to get response" });
    }
  });

  // Create support ticket (escalation)
  app.post("/api/support/tickets", requireAuth, async (req, res) => {
    try {
      const bakerId = req.session.bakerId!;
      const { subject, initialMessage } = req.body;

      if (!subject || !initialMessage) {
        return res.status(400).json({ message: "Subject and message are required" });
      }

      const ticket = await storage.createSupportTicket({
        bakerId,
        subject,
        status: "open",
        priority: "normal",
      });

      await storage.createTicketMessage({
        ticketId: ticket.id,
        senderType: "baker",
        senderId: bakerId,
        content: initialMessage,
      });

      res.status(201).json(ticket);
    } catch (error) {
      console.error("Create ticket error:", error);
      res.status(500).json({ message: "Failed to create ticket" });
    }
  });

  // Get baker's tickets
  app.get("/api/support/tickets", requireAuth, async (req, res) => {
    try {
      const bakerId = req.session.bakerId!;
      const tickets = await storage.getSupportTicketsByBaker(bakerId);
      res.json(tickets);
    } catch (error) {
      console.error("Get tickets error:", error);
      res.status(500).json({ message: "Failed to get tickets" });
    }
  });

  // Get unread support message count for baker
  app.get("/api/support/unread-count", requireAuth, async (req, res) => {
    try {
      const bakerId = req.session.bakerId!;
      const count = await storage.getUnreadSupportMessageCount(bakerId);
      res.json({ count });
    } catch (error) {
      console.error("Get unread count error:", error);
      res.status(500).json({ message: "Failed to get unread count" });
    }
  });

  // Mark ticket messages as read by baker
  app.post("/api/support/tickets/:id/mark-read", requireAuth, async (req, res) => {
    try {
      const bakerId = req.session.bakerId!;
      const ticket = await storage.getSupportTicket(req.params.id);
      
      if (!ticket || ticket.bakerId !== bakerId) {
        return res.status(404).json({ message: "Ticket not found" });
      }

      await storage.updateSupportTicket(ticket.id, { bakerLastReadAt: new Date() });
      res.json({ success: true });
    } catch (error) {
      console.error("Mark read error:", error);
      res.status(500).json({ message: "Failed to mark as read" });
    }
  });

  // Get ticket with messages
  app.get("/api/support/tickets/:id", requireAuth, async (req, res) => {
    try {
      const bakerId = req.session.bakerId!;
      const ticket = await storage.getSupportTicket(req.params.id);
      
      if (!ticket) {
        return res.status(404).json({ message: "Ticket not found" });
      }

      // Check ownership (unless admin)
      const baker = await storage.getBaker(bakerId);
      if (ticket.bakerId !== bakerId && baker?.role !== "super_admin") {
        return res.status(403).json({ message: "Not authorized" });
      }

      const messages = await storage.getTicketMessages(ticket.id);
      res.json({ ...ticket, messages });
    } catch (error) {
      console.error("Get ticket error:", error);
      res.status(500).json({ message: "Failed to get ticket" });
    }
  });

  // Add message to ticket (baker)
  app.post("/api/support/tickets/:id/messages", requireAuth, async (req, res) => {
    try {
      const bakerId = req.session.bakerId!;
      const ticket = await storage.getSupportTicket(req.params.id);
      
      if (!ticket) {
        return res.status(404).json({ message: "Ticket not found" });
      }

      const baker = await storage.getBaker(bakerId);
      const isAdmin = baker?.role === "super_admin";
      
      // Check ownership (unless admin)
      if (ticket.bakerId !== bakerId && !isAdmin) {
        return res.status(403).json({ message: "Not authorized" });
      }

      const { content } = req.body;
      if (!content) {
        return res.status(400).json({ message: "Content is required" });
      }

      const message = await storage.createTicketMessage({
        ticketId: ticket.id,
        senderType: isAdmin ? "admin" : "baker",
        senderId: bakerId,
        content,
      });

      // Update ticket status if admin responds
      if (isAdmin && ticket.status === "open") {
        await storage.updateSupportTicket(ticket.id, { status: "in_progress" });
      }

      res.status(201).json(message);
    } catch (error) {
      console.error("Add message error:", error);
      res.status(500).json({ message: "Failed to add message" });
    }
  });

  // Baker: Close own ticket
  app.patch("/api/support/tickets/:id/close", requireAuth, async (req, res) => {
    try {
      const bakerId = req.session.bakerId!;
      const ticket = await storage.getSupportTicket(req.params.id);
      
      if (!ticket) {
        return res.status(404).json({ message: "Ticket not found" });
      }

      // Only the ticket owner can close it
      if (ticket.bakerId !== bakerId) {
        return res.status(403).json({ message: "Not authorized" });
      }

      const updated = await storage.updateSupportTicket(req.params.id, { status: "closed" });
      res.json(updated);
    } catch (error) {
      console.error("Close ticket error:", error);
      res.status(500).json({ message: "Failed to close ticket" });
    }
  });

  // Admin: Get all support tickets
  app.get("/api/admin/support-tickets", requireAdmin, async (req, res) => {
    try {
      const tickets = await storage.getAllSupportTickets();
      res.json(tickets);
    } catch (error) {
      console.error("Get all tickets error:", error);
      res.status(500).json({ message: "Failed to get tickets" });
    }
  });

  // Admin: Update ticket status
  app.patch("/api/admin/support-tickets/:id", requireAdmin, async (req, res) => {
    try {
      const { status, priority } = req.body;
      const ticket = await storage.updateSupportTicket(req.params.id, { status, priority });
      
      if (!ticket) {
        return res.status(404).json({ message: "Ticket not found" });
      }

      await logAdminAction(req.session.bakerId!, "TICKET_STATUS_CHANGE", req.params.id, { status, priority });

      res.json(ticket);
    } catch (error) {
      console.error("Update ticket error:", error);
      res.status(500).json({ message: "Failed to update ticket" });
    }
  });

  // Admin: Reply to support ticket
  app.post("/api/admin/support-tickets/:id/reply", requireAdmin, async (req, res) => {
    try {
      const ticketId = req.params.id;
      const { content } = req.body;
      
      if (!content?.trim()) {
        return res.status(400).json({ message: "Content is required" });
      }

      const ticket = await storage.getSupportTicket(ticketId);
      if (!ticket) {
        return res.status(404).json({ message: "Ticket not found" });
      }

      const adminId = req.session.bakerId;
      const ticketMessage = await storage.createTicketMessage({
        ticketId,
        senderType: "admin",
        senderId: adminId,
        content: content,
      });

      await logAdminAction(adminId!, "TICKET_REPLY", ticketId);

      // Update ticket status to in_progress if it was open
      if (ticket.status === "open") {
        await storage.updateSupportTicket(ticketId, { status: "in_progress" });
      }

      res.status(201).json(ticketMessage);
    } catch (error) {
      console.error("Admin reply error:", error);
      res.status(500).json({ message: "Failed to send reply" });
    }
  });

  // Support admin: Get limited baker context for ticket resolution
  app.get("/api/admin/support-tickets/:id/baker-context", requireAdmin, async (req, res) => {
    try {
      const ticket = await storage.getSupportTicket(req.params.id);
      if (!ticket) {
        return res.status(404).json({ message: "Ticket not found" });
      }
      const baker = await storage.getBaker(ticket.bakerId);
      if (!baker) {
        return res.status(404).json({ message: "Baker not found" });
      }
      res.json({
        plan: baker.plan,
        stripeConnectedAt: baker.stripeConnectOnboarded,
        emailVerified: !!baker.emailVerified,
        createdAt: baker.createdAt,
        businessName: baker.businessName,
        email: baker.email,
        firstQuoteSentAt: baker.firstQuoteSentAt,
        firstPaymentProcessedAt: baker.firstPaymentProcessedAt,
      });
    } catch (error) {
      console.error("Baker context error:", error);
      res.status(500).json({ message: "Failed to get baker context" });
    }
  });

  // ============================================
  // RETENTION EMAIL ADMIN ROUTES
  // ============================================
  
  app.get("/api/admin/retention/templates", requireSuperAdmin, async (req, res) => {
    try {
      const { getRetentionTemplates } = await import("./retention-admin");
      const templates = await getRetentionTemplates();
      res.json(templates);
    } catch (error) {
      console.error("Error getting retention templates:", error);
      res.status(500).json({ message: "Failed to get templates" });
    }
  });

  app.patch("/api/admin/retention/templates/:id", requireSuperAdmin, async (req, res) => {
    try {
      const { updateRetentionTemplate } = await import("./retention-admin");
      const template = await updateRetentionTemplate(req.params.id, req.body);
      res.json(template);
    } catch (error) {
      console.error("Error updating retention template:", error);
      res.status(500).json({ message: "Failed to update template" });
    }
  });

  app.get("/api/admin/retention/stats", requireSuperAdmin, async (req, res) => {
    try {
      const { getRetentionEmailStats } = await import("./retention-scheduler");
      const stats = await getRetentionEmailStats();
      res.json(stats);
    } catch (error) {
      console.error("Error getting retention stats:", error);
      res.status(500).json({ message: "Failed to get stats" });
    }
  });

  app.get("/api/admin/retention/segments", requireSuperAdmin, async (req, res) => {
    try {
      const { getSegmentDistribution } = await import("./segmentation");
      const distribution = await getSegmentDistribution();
      res.json(distribution);
    } catch (error) {
      console.error("Error getting segment distribution:", error);
      res.status(500).json({ message: "Failed to get segments" });
    }
  });

  app.post("/api/admin/retention/run", requireSuperAdmin, async (req, res) => {
    try {
      const { runRetentionEmailScheduler } = await import("./retention-scheduler");
      const result = await runRetentionEmailScheduler();
      res.json(result);
    } catch (error) {
      console.error("Error running retention scheduler:", error);
      res.status(500).json({ message: "Failed to run scheduler" });
    }
  });

  // Admin: Preview announcement email HTML
  app.get("/api/admin/announcement/preview", requireSuperAdmin, async (req, res) => {
    try {
      const html = getAnnouncementEmailHtml("{{Baker Name}}");
      res.json({ html });
    } catch (error) {
      res.status(500).json({ message: "Failed to generate preview" });
    }
  });

  // Admin: Send announcement email to all bakers
  app.post("/api/admin/announcement/send", requireSuperAdmin, async (req, res) => {
    try {
      const allBakers = await storage.getAllBakers();
      const activeBakers = allBakers.filter(b => !b.suspended);
      let sent = 0;
      let failed = 0;

      for (const baker of activeBakers) {
        try {
          const firstName = baker.businessName.split(" ")[0];
          const success = await sendAnnouncementEmail(baker.email, firstName);
          if (success) sent++;
          else failed++;
        } catch {
          failed++;
        }
      }

      res.json({ total: activeBakers.length, sent, failed });
    } catch (error) {
      console.error("Announcement email error:", error);
      res.status(500).json({ message: "Failed to send announcement emails" });
    }
  });

  // Admin: Send test announcement email to admin only
  app.post("/api/admin/announcement/test", requireSuperAdmin, async (req, res) => {
    try {
      const baker = await storage.getBaker(req.session.bakerId!);
      if (!baker) return res.status(404).json({ message: "Baker not found" });

      const success = await sendAnnouncementEmail(baker.email, baker.businessName.split(" ")[0]);
      res.json({ success, sentTo: baker.email });
    } catch (error) {
      console.error("Test announcement email error:", error);
      res.status(500).json({ message: "Failed to send test email" });
    }
  });

  // Serve calculator pages with dynamic meta tags for social sharing
  app.get("/c/:slug", async (req, res, next) => {
    const userAgent = req.headers["user-agent"] || "";
    
    // Only serve static HTML with meta tags to social crawlers
    // Normal browsers should get the full Vite-transformed SPA
    const socialCrawlers = [
      "facebookexternalhit",
      "Facebot",
      "Twitterbot",
      "LinkedInBot",
      "WhatsApp",
      "Slackbot",
      "Discordbot",
      "TelegramBot",
      "Pinterest",
      "Googlebot",
      "bingbot",
    ];
    
    const isCrawler = socialCrawlers.some(crawler => 
      userAgent.toLowerCase().includes(crawler.toLowerCase())
    );
    
    if (!isCrawler) {
      return next(); // Let Vite handle normal browsers
    }
    
    const slug = req.params.slug;
    
    try {
      const baker = await storage.getBakerBySlug(slug);
      
      if (!baker) {
        return next(); // Let Vite handle 404
      }
      
      // HTML escape function to prevent injection
      const escapeHtml = (str: string) => 
        str.replace(/&/g, "&amp;")
           .replace(/</g, "&lt;")
           .replace(/>/g, "&gt;")
           .replace(/"/g, "&quot;")
           .replace(/'/g, "&#39;");
      
      // Read the index.html template
      const fs = await import("fs/promises");
      const path = await import("path");
      const templatePath = path.resolve(import.meta.dirname, "..", "client", "index.html");
      let html = await fs.readFile(templatePath, "utf-8");
      
      // Create dynamic meta content with escaping
      const businessName = escapeHtml(baker.businessName || "Custom Baker");
      const title = `Get a Quote from ${businessName} | BakerIQ`;
      const description = `Get a quick price estimate for custom cakes and treats from ${businessName}. Fast, easy, and no obligation.`;
      const pageUrl = `${req.protocol}://${req.get("host")}/c/${slug}`;
      
      // Replace default meta tags with dynamic ones
      html = html.replace(
        /<title>.*?<\/title>/,
        `<title>${title}</title>`
      );
      html = html.replace(
        /<meta name="description" content=".*?" \/>/,
        `<meta name="description" content="${description}" />`
      );
      html = html.replace(
        /<meta property="og:type" content=".*?" \/>/,
        `<meta property="og:type" content="website" />\n    <meta property="og:url" content="${pageUrl}" />`
      );
      html = html.replace(
        /<meta property="og:title" content=".*?" \/>/,
        `<meta property="og:title" content="${title}" />`
      );
      html = html.replace(
        /<meta property="og:description" content=".*?" \/>/,
        `<meta property="og:description" content="${description}" />`
      );
      const ogImage = baker.calculatorHeaderImage || "/calc-social.png";
      const fullImageUrl = ogImage.startsWith("http") ? ogImage : `${req.protocol}://${req.get("host")}${ogImage}`;
      html = html.replace(
        /<meta property="og:image" content=".*?" \/>/,
        `<meta property="og:image" content="${fullImageUrl}" />`
      );
      html = html.replace(
        /<meta name="twitter:card" content=".*?" \/>/,
        `<meta name="twitter:card" content="summary_large_image" />\n    <meta name="twitter:url" content="${pageUrl}" />`
      );
      html = html.replace(
        /<meta name="twitter:title" content=".*?" \/>/,
        `<meta name="twitter:title" content="${title}" />`
      );
      html = html.replace(
        /<meta name="twitter:description" content=".*?" \/>/,
        `<meta name="twitter:description" content="${description}" />`
      );
      html = html.replace(
        /<meta name="twitter:image" content=".*?" \/>/,
        `<meta name="twitter:image" content="${fullImageUrl}" />`
      );
      
      res.status(200).set({ "Content-Type": "text/html" }).send(html);
    } catch (error) {
      console.error("Calculator meta tags error:", error);
      next(); // Fall back to Vite
    }
  });

  // Survey submission endpoint
  app.post("/api/survey/submit", requireAuth, async (req, res) => {
    try {
      const bakerId = req.session.bakerId!;
      
      // Check if already submitted
      const existing = await storage.getSurveyResponseByBaker(bakerId);
      if (existing) {
        return res.status(400).json({ message: "You've already completed the survey" });
      }

      const schema = z.object({
        signupReason: z.string().min(1),
        setupBlocker: z.string().min(1),
        mostValuableFeature: z.string().min(1),
        businessStage: z.string().min(1),
        additionalFeedback: z.string().optional(),
      });

      const data = schema.parse(req.body);

      // Create survey response
      const response = await storage.createSurveyResponse({
        bakerId,
        signupReason: data.signupReason,
        setupBlocker: data.setupBlocker,
        mostValuableFeature: data.mostValuableFeature,
        businessStage: data.businessStage,
        additionalFeedback: data.additionalFeedback || null,
        trialGranted: true,
      });

      // Grant 30 days of Pro trial
      const trialEndDate = new Date();
      trialEndDate.setDate(trialEndDate.getDate() + 30);
      
      await storage.updateBaker(bakerId, {
        surveyTrialEndDate: trialEndDate,
      });

      res.json({ success: true, trialEndDate });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      console.error("Error submitting survey:", error);
      res.status(500).json({ message: "Failed to submit survey" });
    }
  });

  // Get survey responses (admin only)
  app.get("/api/admin/survey-responses", requireSuperAdmin, async (req, res) => {
    try {
      const responses = await storage.getAllSurveyResponses();
      res.json(responses);
    } catch (error) {
      console.error("Error fetching survey responses:", error);
      res.status(500).json({ message: "Failed to fetch survey responses" });
    }
  });

  // ============================================
  // AFFILIATE REQUEST ENDPOINTS (PUBLIC + ADMIN)
  // ============================================

  app.post("/api/affiliate-requests", async (req, res) => {
    try {
      const { name, email, socialMedia, followers, niche, message } = req.body;
      if (!name || !email || !socialMedia) {
        return res.status(400).json({ message: "Name, email, and social media link are required" });
      }
      const request = await storage.createAffiliateRequest({
        name,
        email,
        socialMedia,
        followers: followers || null,
        niche: niche || null,
        message: message || null,
      });
      res.status(201).json(request);
    } catch (error) {
      console.error("Error creating affiliate request:", error);
      res.status(500).json({ message: "Failed to submit request" });
    }
  });

  app.get("/api/admin/affiliate-requests", requireSuperAdmin, async (req, res) => {
    try {
      const status = req.query.status as string | undefined;
      const requests = await storage.getAffiliateRequests(status);
      res.json(requests);
    } catch (error) {
      console.error("Error fetching affiliate requests:", error);
      res.status(500).json({ message: "Failed to fetch requests" });
    }
  });

  app.post("/api/admin/affiliate-requests/:id/approve", requireSuperAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const { adminNotes } = req.body;
      const updated = await storage.updateAffiliateRequest(id, {
        status: "approved",
        adminNotes: adminNotes || null,
        reviewedAt: new Date(),
      });
      if (!updated) {
        return res.status(404).json({ message: "Request not found" });
      }
      res.json(updated);
    } catch (error) {
      console.error("Error approving affiliate request:", error);
      res.status(500).json({ message: "Failed to approve request" });
    }
  });

  app.post("/api/admin/affiliate-requests/:id/deny", requireSuperAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const { adminNotes } = req.body;
      const updated = await storage.updateAffiliateRequest(id, {
        status: "denied",
        adminNotes: adminNotes || null,
        reviewedAt: new Date(),
      });
      if (!updated) {
        return res.status(404).json({ message: "Request not found" });
      }
      res.json(updated);
    } catch (error) {
      console.error("Error denying affiliate request:", error);
      res.status(500).json({ message: "Failed to deny request" });
    }
  });

  // ============================================
  // PRETTY AFFILIATE / REFERRAL JOIN ROUTES
  // ============================================

  // GET /join/r/:code - Baker referral link
  app.get("/join/r/:code", async (req, res) => {
    try {
      const { code } = req.params;
      const referringBaker = await storage.getBakerByReferralCode(code);
      if (!referringBaker) {
        return res.redirect("/signup");
      }

      res.cookie("bakeriq_baker_ref", code, {
        maxAge: 45 * 24 * 60 * 60 * 1000,
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
      });

      res.redirect("/signup");
    } catch (error) {
      console.error("Baker referral link error:", error);
      res.redirect("/signup");
    }
  });

  // GET /join/:slug - Affiliate/influencer referral link
  app.get("/join/:slug", async (req, res) => {
    try {
      const { slug } = req.params;

      // Look up affiliate by slug first, then fall back to affiliateCode
      let affiliate = await storage.getAffiliateBySlug(slug);
      if (!affiliate) {
        affiliate = await storage.getAffiliateByCode(slug);
      }
      if (!affiliate || !affiliate.isAffiliate) {
        return res.redirect("/signup");
      }

      const affiliateCode = affiliate.affiliateCode!;

      // Hash IP for privacy
      const ipHash = crypto.createHash("sha256").update(req.ip || "unknown").digest("hex").substring(0, 16);

      await storage.createReferralClick({
        affiliateCode,
        ipHash,
        referrerUrl: req.get("referer") || null,
        userAgent: req.get("user-agent") || null,
      });

      res.cookie("bakeriq_ref", affiliateCode, {
        maxAge: 45 * 24 * 60 * 60 * 1000,
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
      });

      res.redirect("/signup");
    } catch (error) {
      console.error("Affiliate join link error:", error);
      res.redirect("/signup");
    }
  });

  // ============================================
  // AFFILIATE PROGRAM ROUTES
  // ============================================

  // Track referral click and set 45-day cookie (backward compat)
  app.get("/api/ref/:code", async (req, res) => {
    try {
      const { code } = req.params;
      const affiliate = await storage.getAffiliateByCode(code);
      if (!affiliate) {
        return res.redirect("/signup");
      }

      // Hash IP for privacy
      const ipHash = crypto.createHash("sha256").update(req.ip || "unknown").digest("hex").substring(0, 16);

      await storage.createReferralClick({
        affiliateCode: code,
        ipHash,
        referrerUrl: req.get("referer") || null,
        userAgent: req.get("user-agent") || null,
      });

      // Set 45-day cookie
      res.cookie("bakeriq_ref", code, {
        maxAge: 45 * 24 * 60 * 60 * 1000,
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
      });

      res.redirect("/signup");
    } catch (error) {
      console.error("Referral click tracking error:", error);
      res.redirect("/signup");
    }
  });

  // Admin: Get all affiliates with stats
  app.get("/api/admin/affiliates", requireSuperAdmin, async (req, res) => {
    try {
      const affiliates = await storage.getAffiliates();
      const affiliatesWithStats = await Promise.all(
        affiliates.map(async (a) => {
          const stats = await storage.getAffiliateStats(a.id);
          return {
            ...a,
            passwordHash: undefined,
            stats,
          };
        })
      );
      res.json(affiliatesWithStats);
    } catch (error) {
      console.error("Error fetching affiliates:", error);
      res.status(500).json({ message: "Failed to fetch affiliates" });
    }
  });

  // Admin: Enable baker as affiliate
  app.post("/api/admin/affiliates/:bakerId/enable", requireSuperAdmin, async (req, res) => {
    try {
      const { bakerId } = req.params;
      const { commissionRate, commissionMonths } = req.body;

      const baker = await storage.getBaker(bakerId);
      if (!baker) {
        return res.status(404).json({ message: "Baker not found" });
      }

      // Generate unique affiliate code from slug
      let code = baker.slug;
      const existing = await storage.getAffiliateByCode(code);
      if (existing && existing.id !== bakerId) {
        code = `${baker.slug}-${crypto.randomBytes(3).toString("hex")}`;
      }

      const updated = await storage.enableAffiliate(
        bakerId,
        code,
        commissionRate || "20.00",
        commissionMonths || 3
      );

      // Also set the affiliateSlug to match the code initially
      await storage.updateBaker(bakerId, { affiliateSlug: code });

      res.json({ ...updated, passwordHash: undefined, affiliateSlug: code });
    } catch (error) {
      console.error("Error enabling affiliate:", error);
      res.status(500).json({ message: "Failed to enable affiliate" });
    }
  });

  // Admin: Disable affiliate
  app.post("/api/admin/affiliates/:bakerId/disable", requireSuperAdmin, async (req, res) => {
    try {
      const updated = await storage.disableAffiliate(req.params.bakerId);
      res.json({ ...updated, passwordHash: undefined });
    } catch (error) {
      console.error("Error disabling affiliate:", error);
      res.status(500).json({ message: "Failed to disable affiliate" });
    }
  });

  // Admin: Update affiliate settings
  app.patch("/api/admin/affiliates/:bakerId", requireSuperAdmin, async (req, res) => {
    try {
      const { commissionRate, commissionMonths } = req.body;
      const updated = await storage.updateBaker(req.params.bakerId, {
        affiliateCommissionRate: commissionRate,
        affiliateCommissionMonths: commissionMonths,
      });
      res.json({ ...updated, passwordHash: undefined });
    } catch (error) {
      console.error("Error updating affiliate:", error);
      res.status(500).json({ message: "Failed to update affiliate" });
    }
  });

  // Admin: Get all commissions
  app.get("/api/admin/affiliates/commissions", requireSuperAdmin, async (req, res) => {
    try {
      const affiliates = await storage.getAffiliates();
      const allCommissions = [];
      for (const affiliate of affiliates) {
        const commissions = await storage.getCommissionsByAffiliate(affiliate.id);
        for (const c of commissions) {
          allCommissions.push({
            ...c,
            affiliateName: affiliate.businessName,
            affiliateCode: affiliate.affiliateCode,
          });
        }
      }
      allCommissions.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      res.json(allCommissions);
    } catch (error) {
      console.error("Error fetching commissions:", error);
      res.status(500).json({ message: "Failed to fetch commissions" });
    }
  });

  // Admin: Mark commission as paid
  app.post("/api/admin/affiliates/commissions/:commissionId/payout", requireSuperAdmin, async (req, res) => {
    try {
      const { commissionId } = req.params;
      const updated = await storage.updateCommissionStatus(commissionId, "paid", new Date());
      if (!updated) {
        return res.status(404).json({ message: "Commission not found" });
      }
      res.json(updated);
    } catch (error) {
      console.error("Error processing payout:", error);
      res.status(500).json({ message: "Failed to process payout" });
    }
  });

  // Admin: Search affiliates
  app.get("/api/admin/affiliates/search", requireSuperAdmin, async (req, res) => {
    try {
      const q = ((req.query.q as string) || "").toLowerCase().trim();
      if (!q) {
        return res.json([]);
      }
      const affiliates = await storage.getAffiliates();
      const filtered = affiliates.filter(a =>
        a.businessName.toLowerCase().includes(q) ||
        a.email.toLowerCase().includes(q) ||
        (a.affiliateCode && a.affiliateCode.toLowerCase().includes(q)) ||
        (a.affiliateSlug && a.affiliateSlug.toLowerCase().includes(q))
      );
      const results = await Promise.all(
        filtered.map(async (a) => {
          const stats = await storage.getAffiliateStats(a.id);
          return { ...a, passwordHash: undefined, stats };
        })
      );
      res.json(results);
    } catch (error) {
      console.error("Error searching affiliates:", error);
      res.status(500).json({ message: "Failed to search affiliates" });
    }
  });

  // Baker: Get own referral stats (baker-to-baker referral program)
  app.get("/api/referral/stats", requireAuth, async (req, res) => {
    try {
      let baker = await storage.getBaker(req.session.bakerId!);
      if (!baker) {
        return res.status(404).json({ message: "Baker not found" });
      }

      if (!baker.referralCode) {
        const referralCode = crypto.randomBytes(4).toString("hex");
        await storage.updateBaker(baker.id, { referralCode });
        baker = { ...baker, referralCode };
      }

      const referrals = await storage.getBakerReferralsByReferrer(baker.id);
      const referredBakers = await Promise.all(
        referrals.map(async (r) => {
          const referred = await storage.getBaker(r.referredBakerId);
          return {
            id: r.id,
            referredBakerId: r.referredBakerId,
            businessName: referred?.businessName || "Unknown",
            plan: referred?.plan || "free",
            creditAwarded: r.creditAwarded,
            creditType: r.creditType,
            createdAt: r.createdAt,
          };
        })
      );

      res.json({
        referralCode: baker.referralCode,
        referralCredits: baker.referralCredits,
        quickQuoteCredits: baker.quickQuoteCredits,
        plan: baker.plan,
        stripeConnectOnboarded: baker.stripeConnectOnboarded || false,
        referrals: referredBakers,
        totalCreditsEarned: referrals.filter(r => r.creditAwarded).length,
      });
    } catch (error) {
      console.error("Error fetching referral stats:", error);
      res.status(500).json({ message: "Failed to fetch referral stats" });
    }
  });

  // Affiliate: Update affiliate slug
  app.patch("/api/affiliate/slug", requireAuth, async (req, res) => {
    try {
      const baker = await storage.getBaker(req.session.bakerId!);
      if (!baker || !baker.isAffiliate) {
        return res.status(403).json({ message: "Must be an affiliate to update slug" });
      }

      const schema = z.object({
        slug: z.string()
          .min(3, "Slug must be at least 3 characters")
          .max(30, "Slug must be 30 characters or less")
          .regex(/^[a-z0-9][a-z0-9-]*[a-z0-9]$/, "Only lowercase letters, numbers, and hyphens allowed")
          .transform(s => s.toLowerCase().trim()),
      });
      const { slug: newSlug } = schema.parse(req.body);

      // Check uniqueness against other affiliates' slugs
      const existingAffiliate = await storage.getAffiliateBySlug(newSlug);
      if (existingAffiliate && existingAffiliate.id !== baker.id) {
        return res.status(409).json({ message: "This slug is already taken by another affiliate" });
      }

      // Check uniqueness against baker slugs
      const existingBaker = await storage.getBakerBySlug(newSlug);
      if (existingBaker && existingBaker.id !== baker.id) {
        return res.status(409).json({ message: "This slug is already taken" });
      }

      const updated = await storage.updateBaker(baker.id, { affiliateSlug: newSlug });
      res.json({ ...updated, passwordHash: undefined });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      console.error("Error updating affiliate slug:", error);
      res.status(500).json({ message: "Failed to update affiliate slug" });
    }
  });

  // Baker: Get own affiliate stats (Referrals tab)
  app.get("/api/affiliate/stats", requireAuth, async (req, res) => {
    try {
      const baker = await storage.getBaker(req.session.bakerId!);
      if (!baker?.isAffiliate) {
        return res.json({ isAffiliate: false });
      }

      const stats = await storage.getAffiliateStats(baker.id);
      const referrals = await storage.getReferralsByAffiliate(baker.id);
      const commissions = await storage.getCommissionsByAffiliate(baker.id);

      res.json({
        isAffiliate: true,
        affiliateCode: baker.affiliateCode,
        affiliateSlug: baker.affiliateSlug,
        commissionRate: baker.affiliateCommissionRate,
        commissionMonths: baker.affiliateCommissionMonths,
        stats,
        referrals: referrals.map(r => ({
          id: r.id,
          businessName: r.businessName,
          plan: r.plan,
          createdAt: r.createdAt,
        })),
        commissions: commissions.map(c => ({
          id: c.id,
          subscriptionAmount: c.subscriptionAmount,
          commissionRate: c.commissionRate,
          commissionAmount: c.commissionAmount,
          monthNumber: c.monthNumber,
          status: c.status,
          createdAt: c.createdAt,
        })),
      });
    } catch (error) {
      console.error("Error fetching affiliate stats:", error);
      res.status(500).json({ message: "Failed to fetch affiliate stats" });
    }
  });

  // Seed retention email templates on startup
  try {
    const { seedRetentionTemplates } = await import("./seed-retention-templates");
    await seedRetentionTemplates();
  } catch (error) {
    console.error("Failed to seed retention templates:", error);
  }

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

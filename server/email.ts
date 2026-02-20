import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";
import sanitizeHtml from "sanitize-html";

function getAwsRegion(): string {
  const regionValue = process.env.AWS_SES_REGION || process.env.AWS_REGION || "us-east-1";
  if (regionValue.includes("email-smtp.")) {
    const match = regionValue.match(/email-smtp\.([^.]+)\./);
    return match ? match[1] : "us-east-1";
  }
  return regionValue;
}

const sesClient = new SESClient({
  region: getAwsRegion(),
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
  },
});

// Platform emails (to bakers): "BakerIQ"
const PLATFORM_FROM_EMAIL = process.env.AWS_SES_PLATFORM_EMAIL || process.env.AWS_SES_FROM_EMAIL || "noreply@bakeriq.app";
const PLATFORM_FROM_NAME = "BakerIQ";

// Customer-facing emails: "Your Baker at [Business Name]"
const CUSTOMER_FROM_EMAIL = process.env.AWS_SES_CUSTOMER_EMAIL || process.env.AWS_SES_FROM_EMAIL || "noreply@bakeriq.app";

export type EmailSenderType = "platform" | "customer";

interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
  text?: string;
  senderType?: EmailSenderType;
  businessName?: string; // Required for customer emails
}

function formatSender(senderType: EmailSenderType, businessName?: string): string {
  if (senderType === "customer" && businessName) {
    return `"Your Baker at ${businessName}" <${CUSTOMER_FROM_EMAIL}>`;
  }
  return `"${PLATFORM_FROM_NAME}" <${PLATFORM_FROM_EMAIL}>`;
}

export function getBakerEmailFooterHtml(emailPrefsToken?: string | null): string {
  const prefsUrl = emailPrefsToken 
    ? `https://bakeriq.app/email-preferences/${emailPrefsToken}`
    : "https://bakeriq.app/settings";
  return `<div class="footer" style="text-align: center; padding: 20px; color: #666; font-size: 12px;">
      <p>You're receiving this email because you have a <a href="https://bakeriq.app/" style="color: #E91E63; text-decoration: none;">BakerIQ</a> account.</p>
      <p><a href="${prefsUrl}" style="color: #E91E63; text-decoration: none;">Manage email preferences</a></p>
    </div>`;
}

export function getBakerEmailFooterText(emailPrefsToken?: string | null): string {
  const prefsUrl = emailPrefsToken 
    ? `https://bakeriq.app/email-preferences/${emailPrefsToken}`
    : "https://bakeriq.app/settings";
  return `\n---\nYou're receiving this email because you have a BakerIQ account.\nManage email preferences: ${prefsUrl}\n`;
}

export function getCustomerEmailFooterHtml(): string {
  return `<div class="footer" style="text-align: center; padding: 20px; color: #666; font-size: 12px;">
      <p>Powered by <a href="https://bakeriq.app/" style="color: #E91E63; text-decoration: none;">BakerIQ</a></p>
    </div>`;
}

export function getCustomerEmailFooterText(): string {
  return `\n---\nPowered by BakerIQ - https://bakeriq.app\n`;
}

export async function sendEmail({
  to,
  subject,
  html,
  text,
  senderType = "platform",
  businessName,
}: SendEmailParams): Promise<boolean> {
  // Check for AWS credentials
  if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
    console.log("AWS SES credentials not configured, skipping email send");
    return false;
  }
  
  // Check for at least one valid sender email configuration
  const hasFromEmail = process.env.AWS_SES_FROM_EMAIL;
  const hasPlatformEmail = process.env.AWS_SES_PLATFORM_EMAIL;
  const hasCustomerEmail = process.env.AWS_SES_CUSTOMER_EMAIL;
  
  if (!hasFromEmail && !hasPlatformEmail && !hasCustomerEmail) {
    console.log("No AWS SES sender email configured, skipping email send");
    return false;
  }
  
  // Warn if customer email is requested but businessName is missing
  if (senderType === "customer" && !businessName) {
    console.warn("Customer email requested without businessName, falling back to platform sender");
  }

  const source = formatSender(senderType, businessName);

  try {
    const command = new SendEmailCommand({
      Source: source,
      Destination: {
        ToAddresses: [to],
      },
      Message: {
        Subject: {
          Data: subject,
          Charset: "UTF-8",
        },
        Body: {
          Html: {
            Data: html,
            Charset: "UTF-8",
          },
          ...(text && {
            Text: {
              Data: text,
              Charset: "UTF-8",
            },
          }),
        },
      },
    });

    await sesClient.send(command);
    console.log(`Email sent successfully to ${to} from ${source}`);
    return true;
  } catch (error) {
    console.error("Failed to send email:", error);
    return false;
  }
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}

export async function sendNewLeadNotification(
  bakerEmail: string,
  bakerName: string,
  lead: {
    customerName: string;
    customerEmail: string;
    customerPhone?: string;
    eventType?: string;
    eventDate?: string;
    estimatedTotal: number;
  },
  emailPrefsToken?: string | null
): Promise<boolean> {
  const html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: 'Inter', Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #E91E63, #F06292); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 8px 8px; }
    .detail-row { display: flex; padding: 10px 0; border-bottom: 1px solid #e9ecef; }
    .label { font-weight: 600; min-width: 120px; color: #666; }
    .value { color: #333; }
    .cta { display: inline-block; background: #E91E63; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 20px; }
    .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>New Lead Received!</h1>
      <p>A customer is interested in your creations</p>
    </div>
    <div class="content">
      <h2>Lead Details</h2>
      <div class="detail-row">
        <span class="label">Customer:</span>
        <span class="value">${lead.customerName}</span>
      </div>
      <div class="detail-row">
        <span class="label">Email:</span>
        <span class="value">${lead.customerEmail}</span>
      </div>
      ${
        lead.customerPhone
          ? `
      <div class="detail-row">
        <span class="label">Phone:</span>
        <span class="value">${lead.customerPhone}</span>
      </div>
      `
          : ""
      }
      ${
        lead.eventType
          ? `
      <div class="detail-row">
        <span class="label">Event Type:</span>
        <span class="value">${lead.eventType}</span>
      </div>
      `
          : ""
      }
      ${
        lead.eventDate
          ? `
      <div class="detail-row">
        <span class="label">Event Date:</span>
        <span class="value">${lead.eventDate}</span>
      </div>
      `
          : ""
      }
      <div class="detail-row">
        <span class="label">Estimated Total:</span>
        <span class="value" style="font-weight: bold; color: #E91E63;">${formatCurrency(lead.estimatedTotal)}</span>
      </div>
      <p style="margin-top: 20px;">Log in to your BakerIQ dashboard to view full details and follow up with this lead.</p>
    </div>
    ${getBakerEmailFooterHtml(emailPrefsToken)}
  </div>
</body>
</html>
`;

  const text = `
New Lead Received!

Customer: ${lead.customerName}
Email: ${lead.customerEmail}
${lead.customerPhone ? `Phone: ${lead.customerPhone}` : ""}
${lead.eventType ? `Event Type: ${lead.eventType}` : ""}
${lead.eventDate ? `Event Date: ${lead.eventDate}` : ""}
Estimated Total: ${formatCurrency(lead.estimatedTotal)}

Log in to your BakerIQ dashboard to view full details and follow up with this lead.
${getBakerEmailFooterText(emailPrefsToken)}`;

  return sendEmail({
    to: bakerEmail,
    subject: `New Lead: ${lead.customerName} - ${formatCurrency(lead.estimatedTotal)}`,
    html,
    text,
  });
}

export async function sendLeadConfirmationToCustomer(
  customerEmail: string,
  customerName: string,
  bakerBusinessName: string,
  lead: {
    eventType?: string;
    eventDate?: string;
    estimatedTotal: number;
    category?: "cake" | "treat";
  }
): Promise<boolean> {
  const orderType = lead.category === "treat" ? "treats" : "custom cakes";
  const html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: 'Inter', Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #E91E63, #F06292); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 8px 8px; }
    .highlight { background: white; padding: 20px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #E91E63; }
    .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Thank You for Your Inquiry!</h1>
      <p>${bakerBusinessName}</p>
    </div>
    <div class="content">
      <p>Hi ${customerName},</p>
      <p>Thank you for your interest in our ${orderType}! We've received your inquiry and will get back to you soon.</p>
      <div class="highlight">
        <h3 style="margin-top: 0;">Your Estimate Summary</h3>
        ${lead.eventType ? `<p><strong>Event:</strong> ${lead.eventType}</p>` : ""}
        ${lead.eventDate ? `<p><strong>Date:</strong> ${lead.eventDate}</p>` : ""}
        <p><strong>Estimated Total:</strong> <span style="color: #E91E63; font-size: 1.2em;">${formatCurrency(lead.estimatedTotal)}</span></p>
      </div>
      <p>This is an estimate based on the options you selected. Final pricing may vary based on design complexity and specific requirements.</p>
      <p>We typically respond within 24-48 hours. If you have any urgent questions, feel free to reach out directly.</p>
      <p style="margin-top: 30px;">Sweet regards,<br><strong>${bakerBusinessName}</strong></p>
    </div>
    ${getCustomerEmailFooterHtml()}
  </div>
</body>
</html>
`;

  const subjectType = lead.category === "treat" ? "Treats" : "Cake";
  const text = `
Hi ${customerName},

Thank you for your interest in our ${orderType}! We've received your inquiry and will get back to you soon.

Your Estimate Summary:
${lead.eventType ? `Event: ${lead.eventType}` : ""}
${lead.eventDate ? `Date: ${lead.eventDate}` : ""}
Estimated Total: ${formatCurrency(lead.estimatedTotal)}

This is an estimate based on the options you selected. Final pricing may vary based on design complexity and specific requirements.

We typically respond within 24-48 hours.

Sweet regards,
${bakerBusinessName}
${getCustomerEmailFooterText()}`;

  return sendEmail({
    to: customerEmail,
    subject: `Your ${subjectType} Inquiry - ${bakerBusinessName}`,
    html,
    text,
    senderType: "customer",
    businessName: bakerBusinessName,
  });
}

interface QuoteItem {
  name: string;
  description?: string | null;
  quantity: number;
  totalPrice: string;
  category: string;
}

export async function sendQuoteNotification(
  customerEmail: string,
  customerName: string,
  bakerBusinessName: string,
  bakerContact: {
    email?: string | null;
    phone?: string | null;
    address?: string | null;
  },
  quote: {
    quoteNumber: string;
    total: number;
    subtotal: number;
    taxAmount: number;
    taxRate: number;
    eventDate?: string;
    notes?: string;
    items: QuoteItem[];
    depositPercentage?: number; // Baker's default deposit percentage
    viewUrl: string;
  }
): Promise<boolean> {
  const items = quote.items || [];
  const cakeItems = items.filter(i => i.category === "cake");
  const treatItems = items.filter(i => i.category === "treat");
  const decorationItems = items.filter(i => i.category === "decoration");
  const addonItems = items.filter(i => i.category === "addon");
  const deliveryItems = items.filter(i => i.category === "delivery");
  const otherItems = items.filter(i => i.category === "other" && i.name);

  // Calculate deposit using baker's global deposit percentage
  let depositAmount = 0;
  let depositLabel = "";
  if (quote.depositPercentage && quote.depositPercentage > 0) {
    depositAmount = quote.total * (quote.depositPercentage / 100);
    depositLabel = `(${quote.depositPercentage}%)`;
  }

  // Determine order type for dynamic text
  const hasCake = cakeItems.length > 0;
  const hasTreats = treatItems.length > 0;
  let orderType = "order";
  if (hasCake && !hasTreats) {
    orderType = "cake order";
  } else if (hasTreats && !hasCake) {
    orderType = "treats order";
  } else if (hasCake && hasTreats) {
    orderType = "order";
  }

  const renderItems = (items: QuoteItem[]) => items.map(item => `
    <tr>
      <td style="padding: 8px 0; border-bottom: 1px solid #eee;">${item.name}${item.description ? `<br><span style="color: #666; font-size: 12px;">${item.description}</span>` : ""}</td>
      <td style="padding: 8px 0; border-bottom: 1px solid #eee; text-align: right;">${formatCurrency(parseFloat(item.totalPrice))}</td>
    </tr>
  `).join("");

  const html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: 'Inter', Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #E91E63, #F06292); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 8px 8px; }
    .quote-summary { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
    .quote-number { color: #666; font-size: 14px; margin-bottom: 5px; }
    .section-title { font-weight: bold; color: #E91E63; margin: 20px 0 10px 0; font-size: 14px; text-transform: uppercase; }
    .total-row { font-size: 1.4em; color: #E91E63; font-weight: bold; }
    .cta { display: inline-block; background: #E91E63; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; margin: 20px 0; font-weight: 600; }
    .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
    table { width: 100%; border-collapse: collapse; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="margin: 0;">Your Quote is Ready!</h1>
      <p style="margin: 10px 0 0 0; opacity: 0.9; font-size: 1.1em;">${bakerBusinessName}</p>
      <div style="margin-top: 10px; font-size: 13px; opacity: 0.85;">
        ${bakerContact.address ? `<p style="margin: 3px 0;">${bakerContact.address}</p>` : ""}
        ${bakerContact.email ? `<p style="margin: 3px 0;">${bakerContact.email}</p>` : ""}
        ${bakerContact.phone ? `<p style="margin: 3px 0;">${bakerContact.phone}</p>` : ""}
      </div>
    </div>
    <div class="content">
      ${quote.notes?.includes("demo quote created during onboarding") 
        ? `<p>Here's your custom quote preview &#128071;</p>`
        : `<p>Hi ${customerName},</p>
      <p>Great news! We've prepared a custom quote for your ${orderType}.</p>`}
      
      <div class="quote-summary">
        <p class="quote-number">Quote #${quote.quoteNumber}</p>
        ${quote.eventDate ? `<p style="margin: 5px 0; color: #666;">Event Date: <strong>${new Date(quote.eventDate).toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</strong></p>` : ""}
        
        ${cakeItems.length > 0 ? `
          <p class="section-title">Cake</p>
          <table>${renderItems(cakeItems)}</table>
        ` : ""}
        
        ${treatItems.length > 0 ? `
          <p class="section-title">Treats</p>
          <table>${renderItems(treatItems)}</table>
        ` : ""}
        
        ${decorationItems.length > 0 ? `
          <p class="section-title">Decorations</p>
          <table>${renderItems(decorationItems)}</table>
        ` : ""}
        
        ${addonItems.length > 0 ? `
          <p class="section-title">Extras</p>
          <table>${renderItems(addonItems)}</table>
        ` : ""}
        
        ${deliveryItems.length > 0 ? `
          <p class="section-title">Delivery</p>
          <table>${renderItems(deliveryItems)}</table>
        ` : ""}
        
        ${otherItems.length > 0 ? `
          <p class="section-title">Other</p>
          <table>${renderItems(otherItems)}</table>
        ` : ""}
        
        <table style="margin-top: 20px; border-top: 2px solid #eee; padding-top: 15px;">
          <tr>
            <td style="padding: 5px 0; color: #666;">Subtotal</td>
            <td style="padding: 5px 0; text-align: right;">${formatCurrency(quote.subtotal)}</td>
          </tr>
          <tr>
            <td style="padding: 5px 0; color: #666;">Tax (${(quote.taxRate * 100).toFixed(1)}%)</td>
            <td style="padding: 5px 0; text-align: right;">${formatCurrency(quote.taxAmount)}</td>
          </tr>
          <tr class="total-row">
            <td style="padding: 15px 0 5px 0;"><strong>Total</strong></td>
            <td style="padding: 15px 0 5px 0; text-align: right;"><strong>${formatCurrency(quote.total)}</strong></td>
          </tr>
          ${depositAmount > 0 ? `
          <tr>
            <td style="padding: 5px 0; color: #666;">Deposit Required ${depositLabel}</td>
            <td style="padding: 5px 0; text-align: right; font-weight: bold;">${formatCurrency(depositAmount)}</td>
          </tr>
          ` : ""}
        </table>
      </div>
      
      ${quote.notes?.includes("demo quote created during onboarding")
        ? ""
        : quote.notes ? `<p style="background: #fff3cd; padding: 15px; border-radius: 6px;"><strong>Notes:</strong> ${quote.notes}</p>` : ""}
      
      <p style="text-align: center;">
        <a href="${quote.viewUrl}" class="cta">${quote.notes?.includes("demo quote created during onboarding") ? "Review Your Custom Quote" : "View Full Quote &amp; Payment Details"}</a>
      </p>
      
      ${quote.notes?.includes("demo quote created during onboarding") 
        ? `<p style="text-align: center; color: #999; font-size: 11px; margin-top: 4px;">This is a demo quote created during onboarding setup.</p>` 
        : ""}
      
      <p>To confirm your order, please respond to this email or contact us directly.</p>
      <p style="margin-top: 30px;">Sweet regards,<br><strong>${bakerBusinessName}</strong></p>
    </div>
    ${getCustomerEmailFooterHtml()}
  </div>
</body>
</html>
`;

  const itemsText = items
    .filter(i => i.name)
    .map(i => `  - ${i.name}: ${formatCurrency(parseFloat(i.totalPrice))}`)
    .join("\n");

  const isDemoQuote = !!quote.notes?.includes("demo quote created during onboarding");

  const text = `
${isDemoQuote ? "Here's your custom quote preview:" : `Hi ${customerName},

Great news! We've prepared a custom quote for your ${orderType}.`}

Quote #${quote.quoteNumber}
${quote.eventDate ? `Event Date: ${new Date(quote.eventDate).toLocaleDateString()}` : ""}

Items:
${itemsText}

Subtotal: ${formatCurrency(quote.subtotal)}
Tax (${(quote.taxRate * 100).toFixed(1)}%): ${formatCurrency(quote.taxAmount)}
Total: ${formatCurrency(quote.total)}
${depositAmount > 0 ? `Deposit Required ${depositLabel}: ${formatCurrency(depositAmount)}` : ""}

${isDemoQuote ? "" : quote.notes ? `Notes: ${quote.notes}` : ""}

${isDemoQuote ? `Review your custom quote: ${quote.viewUrl}` : `View your full quote with payment details: ${quote.viewUrl}`}
${isDemoQuote ? "\n(This is a demo quote created during onboarding setup.)" : ""}

To confirm your order, please respond to this email or contact us directly.

Sweet regards,
${bakerBusinessName}
${getCustomerEmailFooterText()}`;

  return sendEmail({
    to: customerEmail,
    subject: `Your Quote from ${bakerBusinessName} - ${formatCurrency(quote.total)}`,
    html,
    text,
    senderType: "customer",
    businessName: bakerBusinessName,
  });
}

export async function sendPasswordResetEmail(
  email: string,
  resetToken: string,
  baseUrl: string,
  emailPrefsToken?: string | null
): Promise<boolean> {
  const resetUrl = `${baseUrl}/reset-password?token=${resetToken}`;
  
  const html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: 'Inter', Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #E91E63, #F06292); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 8px 8px; }
    .cta { display: inline-block; background: #E91E63; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; margin: 20px 0; font-weight: 600; }
    .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Password Reset Request</h1>
    </div>
    <div class="content">
      <p>Hi,</p>
      <p>We received a request to reset your BakerIQ password. Click the button below to create a new password:</p>
      <p style="text-align: center;">
        <a href="${resetUrl}" class="cta">Reset Password</a>
      </p>
      <p style="color: #666; font-size: 14px;">This link will expire in 1 hour.</p>
      <p style="color: #666; font-size: 14px;">If you didn't request a password reset, you can safely ignore this email.</p>
    </div>
    ${getBakerEmailFooterHtml(emailPrefsToken)}
  </div>
</body>
</html>
`;

  const text = `
Password Reset Request

We received a request to reset your BakerIQ password.

Reset your password here: ${resetUrl}

This link will expire in 1 hour.

If you didn't request a password reset, you can safely ignore this email.
${getBakerEmailFooterText(emailPrefsToken)}`;

  return sendEmail({
    to: email,
    subject: "Reset Your BakerIQ Password",
    html,
    text,
  });
}

export async function sendAdminPasswordReset(
  email: string,
  tempPassword: string,
  businessName: string,
  baseUrl: string,
  emailPrefsToken?: string | null
): Promise<boolean> {
  const loginUrl = `${baseUrl}/login`;
  
  const html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: 'Inter', Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #E91E63, #F06292); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 8px 8px; }
    .password-box { background: #fff; border: 2px solid #E91E63; padding: 15px; text-align: center; border-radius: 6px; margin: 20px 0; font-family: monospace; font-size: 18px; letter-spacing: 2px; }
    .cta { display: inline-block; background: #E91E63; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; margin: 20px 0; font-weight: 600; }
    .warning { background: #fff3cd; border: 1px solid #ffc107; padding: 15px; border-radius: 6px; margin: 15px 0; }
    .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Password Reset by Admin</h1>
    </div>
    <div class="content">
      <p>Hi ${businessName},</p>
      <p>A BakerIQ administrator has reset your password. Your temporary password is:</p>
      <div class="password-box">${tempPassword}</div>
      <div class="warning">
        <strong>Important:</strong> Please log in and change your password immediately for security.
      </div>
      <p style="text-align: center;">
        <a href="${loginUrl}" class="cta">Log In Now</a>
      </p>
      <p style="color: #666; font-size: 14px;">If you did not request this password reset, please contact support immediately.</p>
    </div>
    ${getBakerEmailFooterHtml(emailPrefsToken)}
  </div>
</body>
</html>
`;

  const text = `
Password Reset by Admin

Hi ${businessName},

A BakerIQ administrator has reset your password.

Your temporary password is: ${tempPassword}

IMPORTANT: Please log in and change your password immediately for security.

Log in here: ${loginUrl}

If you did not request this password reset, please contact support immediately.
${getBakerEmailFooterText(emailPrefsToken)}`;

  return sendEmail({
    to: email,
    subject: "Your BakerIQ Password Has Been Reset",
    html,
    text,
  });
}

export async function sendEmailVerification(
  email: string,
  verificationToken: string,
  baseUrl: string,
  emailPrefsToken?: string | null
): Promise<boolean> {
  const verifyUrl = `${baseUrl}/verify-email?token=${verificationToken}`;
  
  const html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: 'Inter', Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #E91E63, #F06292); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 8px 8px; }
    .cta { display: inline-block; background: #E91E63; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; margin: 20px 0; font-weight: 600; }
    .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Welcome to BakerIQ!</h1>
    </div>
    <div class="content">
      <p>Hi,</p>
      <p>Thanks for signing up! Please verify your email address by clicking the button below:</p>
      <p style="text-align: center;">
        <a href="${verifyUrl}" class="cta">Verify Email</a>
      </p>
      <p style="color: #666; font-size: 14px;">This link will expire in 24 hours.</p>
    </div>
    ${getBakerEmailFooterHtml(emailPrefsToken)}
  </div>
</body>
</html>
`;

  const text = `
Welcome to BakerIQ!

Thanks for signing up! Please verify your email address by clicking the link below:

${verifyUrl}

This link will expire in 24 hours.
${getBakerEmailFooterText(emailPrefsToken)}`;

  return sendEmail({
    to: email,
    subject: "Verify Your BakerIQ Account",
    html,
    text,
  });
}

// Quote response notification (accept/decline)
export async function sendQuoteResponseNotification(
  bakerEmail: string,
  bakerName: string,
  response: {
    customerName: string;
    customerEmail: string;
    quoteNumber: string;
    quoteTitle: string;
    total: number;
    action: "accepted" | "declined";
    dashboardUrl: string;
  },
  emailPrefsToken?: string | null
): Promise<boolean> {
  const actionColor = response.action === "accepted" ? "#22C55E" : "#EF4444";
  const actionText = response.action === "accepted" ? "Accepted" : "Declined";
  const actionEmoji = response.action === "accepted" ? "✓" : "✗";
  
  const html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: 'Inter', Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: ${actionColor}; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 8px 8px; }
    .detail-row { display: flex; padding: 10px 0; border-bottom: 1px solid #e9ecef; }
    .label { font-weight: 600; min-width: 120px; color: #666; }
    .value { color: #333; }
    .status-badge { display: inline-block; background: ${actionColor}; color: white; padding: 4px 12px; border-radius: 4px; font-weight: 600; }
    .cta { display: inline-block; background: #E91E63; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 20px; }
    .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="margin: 0;">${actionEmoji} Quote ${actionText}!</h1>
      <p style="margin: 10px 0 0 0; opacity: 0.9;">A customer has responded to your quote</p>
    </div>
    <div class="content">
      <h2>Quote Response</h2>
      <div class="detail-row">
        <span class="label">Customer:</span>
        <span class="value">${response.customerName}</span>
      </div>
      <div class="detail-row">
        <span class="label">Email:</span>
        <span class="value">${response.customerEmail}</span>
      </div>
      <div class="detail-row">
        <span class="label">Quote:</span>
        <span class="value">#${response.quoteNumber} - ${response.quoteTitle}</span>
      </div>
      <div class="detail-row">
        <span class="label">Total:</span>
        <span class="value" style="font-weight: bold;">${formatCurrency(response.total)}</span>
      </div>
      <div class="detail-row">
        <span class="label">Status:</span>
        <span class="status-badge">${actionText}</span>
      </div>
      ${response.action === "accepted" ? `
      <p style="margin-top: 20px; color: #22C55E; font-weight: 600;">Great news! Your customer has accepted this quote. Time to confirm the order details and collect the deposit.</p>
      ` : `
      <p style="margin-top: 20px; color: #666;">The customer has declined this quote. You may want to follow up to understand their needs better.</p>
      `}
      <p style="text-align: center;">
        <a href="${response.dashboardUrl}" class="cta">View in Dashboard</a>
      </p>
    </div>
    ${getBakerEmailFooterHtml(emailPrefsToken)}
  </div>
</body>
</html>
`;

  const text = `
Quote ${actionText}!

Customer: ${response.customerName}
Email: ${response.customerEmail}
Quote: #${response.quoteNumber} - ${response.quoteTitle}
Total: ${formatCurrency(response.total)}
Status: ${actionText}

${response.action === "accepted" 
  ? "Great news! Your customer has accepted this quote. Time to confirm the order details and collect the deposit."
  : "The customer has declined this quote. You may want to follow up to understand their needs better."}

View in Dashboard: ${response.dashboardUrl}
${getBakerEmailFooterText(emailPrefsToken)}`;

  return sendEmail({
    to: bakerEmail,
    subject: `Quote ${actionText}: ${response.customerName} - ${formatCurrency(response.total)}`,
    html,
    text,
  });
}

// Onboarding email templates with conditional Stripe logic
interface OnboardingEmailTemplate {
  emailKey: string;
  day: number;
  subject: string;
  content: string;
  ctaText: string;
  ctaUrl: string;
  stripePsHtml?: string;
  stripePsText?: string;
}

function getConditionalOnboardingTemplate(day: number, stripeConnected: boolean): OnboardingEmailTemplate | undefined {
  const templates: Record<string, OnboardingEmailTemplate> = {
    day0_welcome: {
      emailKey: "day0_welcome",
      day: 0,
      subject: "Your order page is getting set up",
      content: `
        <p>Welcome to BakerIQ — this is your new system for turning DM inquiries into professional quotes (without the back-and-forth).</p>
        <p>Here's the move: finish setup and launch your order page.</p>
        <p>In a few minutes you'll have:</p>
        <ul style="padding-left: 20px;">
          <li>A public order page customers can use for instant estimates</li>
          <li>A clean request that hits your dashboard (no messy DMs)</li>
          <li>A professional quote you can send in one click</li>
        </ul>
        <p>You'll see payments later — but first, let's get you live.</p>
      `,
      ctaText: "Finish Setup",
      ctaUrl: "/onboarding",
    },
    day1_pricing: {
      emailKey: "day1_pricing",
      day: 1,
      subject: "We set the foundation — you set the standard",
      content: `
        <p>Your order page comes with pricing and offerings preloaded as a starting point.</p>
        <p>Now make it yours. Take 3 minutes to review:</p>
        <ul style="padding-left: 20px;">
          <li>Sizes & tiers</li>
          <li>Flavors & frosting options</li>
          <li>Decorations + add-ons</li>
        </ul>
        <p>Once pricing looks right, you're ready to launch your link.</p>
      `,
      ctaText: "Review Your Pricing",
      ctaUrl: "/pricing",
    },
    day2_launch: {
      emailKey: "day2_launch",
      day: 2,
      subject: "Put this link in your bio today",
      content: `
        <p>Your order page is the whole game.</p>
        <p>When someone asks "how much?" you don't explain pricing — you send the link.</p>
        <p>Best places to add it:</p>
        <ul style="padding-left: 20px;">
          <li>Instagram bio</li>
          <li>Facebook pinned post</li>
          <li>Link-in-bio tools</li>
          <li>DM auto-replies</li>
        </ul>
      `,
      ctaText: "Launch Your Order Page",
      ctaUrl: "/share",
    },
    day3_first_request: {
      emailKey: "day3_first_request",
      day: 3,
      subject: "Stop typing prices — route them here",
      content: `
        <p>Today's goal is simple: get ONE real inquiry through your order page.</p>
        <p>Next time someone messages you:</p>
        <ol style="padding-left: 20px;">
          <li>Reply with your link</li>
          <li>Let them build their request + get an estimate</li>
          <li>You receive the full details (no guessing)</li>
        </ol>
      `,
      ctaText: "Copy Your Order Page Link",
      ctaUrl: "/share",
    },
    day4_stripe_connected: {
      emailKey: "day4_stripe_connected",
      day: 4,
      subject: "You're ready to collect deposits automatically",
      content: `
        <p>You're connected — that means when a customer accepts your quote, the deposit can be collected automatically.</p>
        <p>Next time a request comes in:</p>
        <ul style="padding-left: 20px;">
          <li>Open the request</li>
          <li>Convert to a quote</li>
          <li>Send the quote with a deposit option</li>
        </ul>
        <p>This is the part where you stop chasing money in DMs.</p>
      `,
      ctaText: "Go to Quotes",
      ctaUrl: "/quotes",
    },
    day4_stripe_not_connected: {
      emailKey: "day4_stripe_not_connected",
      day: 4,
      subject: "Want deposits to collect automatically?",
      content: `
        <p>You can run BakerIQ without payments… but the upgrade is automatic deposits.</p>
        <p>When payments are enabled:</p>
        <ul style="padding-left: 20px;">
          <li>Customers can accept quotes and pay deposits online</li>
          <li>No awkward follow-ups</li>
          <li>No "did you send it?" messages</li>
        </ul>
        <p>No rush — but once you're getting real requests, this saves time fast.</p>
      `,
      ctaText: "Enable Automatic Deposits",
      ctaUrl: "/settings",
    },
    day5_workflow: {
      emailKey: "day5_workflow",
      day: 5,
      subject: "Here's the full BakerIQ flow (the simple version)",
      content: `
        <p>Here's the clean workflow:</p>
        <ol style="padding-left: 20px;">
          <li>Customer uses your order page</li>
          <li>You receive a detailed request</li>
          <li>You convert it into a quote</li>
          <li>Customer accepts (and pays deposit if enabled)</li>
        </ol>
        <p>If you're still pricing in DMs, you're working too hard.</p>
      `,
      ctaText: "Go to Requests",
      ctaUrl: "/leads",
    },
    day6_habit: {
      emailKey: "day6_habit",
      day: 6,
      subject: "The habit that makes this work",
      content: `
        <p>BakerIQ works best when it becomes your default move:</p>
        <p><strong>Every pricing question → send the link.</strong></p>
        <p>Review pricing occasionally (only when ingredient costs change), but otherwise this is a set-and-forget system.</p>
      `,
      ctaText: "Copy Your Order Page Link",
      ctaUrl: "/share",
    },
  };

  switch (day) {
    case 0: return templates.day0_welcome;
    case 1: return templates.day1_pricing;
    case 2: return templates.day2_launch;
    case 3: return templates.day3_first_request;
    case 4: return stripeConnected ? templates.day4_stripe_connected : templates.day4_stripe_not_connected;
    case 5: return templates.day5_workflow;
    case 6: return templates.day6_habit;
    default: return undefined;
  }
}

export function getEmailKeyForDay(day: number, stripeConnected: boolean): string {
  switch (day) {
    case 0: return "day0_welcome";
    case 1: return "day1_pricing";
    case 2: return "day2_launch";
    case 3: return "day3_first_request";
    case 4: return stripeConnected ? "day4_stripe_connected" : "day4_stripe_not_connected";
    case 5: return "day5_workflow";
    case 6: return "day6_habit";
    default: return `day${day}_unknown`;
  }
}

export async function sendOnboardingEmail(
  bakerEmail: string,
  businessName: string,
  day: number,
  baseUrl: string,
  stripeConnected: boolean = false,
  emailPrefsToken?: string | null
): Promise<{ success: boolean; emailKey: string }> {
  const template = getConditionalOnboardingTemplate(day, stripeConnected);
  if (!template) {
    console.error(`No onboarding email template found for day ${day}`);
    return { success: false, emailKey: `day${day}_unknown` };
  }

  const resolvedContent = template.content.replace(/\{\{baseUrl\}\}/g, baseUrl);
  const resolvedPs = template.stripePsHtml?.replace(/\{\{baseUrl\}\}/g, baseUrl) || '';
  const ctaUrl = `${baseUrl}${template.ctaUrl}`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: 'Inter', Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #E91E63, #F06292); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 8px 8px; }
    .cta { display: inline-block; background: #E91E63; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; margin: 20px 0; font-weight: 600; }
    .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
    ul, ol { margin: 16px 0; }
    li { margin: 8px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="margin: 0; font-size: 22px;">BakerIQ</h1>
    </div>
    <div class="content">
      <p>Hi ${businessName},</p>
      ${resolvedContent}
      <p style="text-align: center; margin-top: 24px;">
        <a href="${ctaUrl}" class="cta">${template.ctaText}</a>
      </p>
      ${resolvedPs}
    </div>
    ${getBakerEmailFooterHtml(emailPrefsToken)}
  </div>
</body>
</html>
`;

  const textContent = resolvedContent
    .replace(/<h3[^>]*>/g, '\n\n')
    .replace(/<\/h3>/g, '\n')
    .replace(/<li><strong>([^<]+)<\/strong>/g, '- $1')
    .replace(/<li>/g, '- ')
    .replace(/<\/li>/g, '')
    .replace(/<ul[^>]*>/g, '')
    .replace(/<\/ul>/g, '')
    .replace(/<ol[^>]*>/g, '')
    .replace(/<\/ol>/g, '')
    .replace(/<p[^>]*>/g, '\n')
    .replace(/<\/p>/g, '')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .trim();

  const text = `Hi ${businessName},\n\n${textContent}\n\n${template.ctaText}: ${ctaUrl}${template.stripePsText || ''}${getBakerEmailFooterText(emailPrefsToken)}`;

  const success = await sendEmail({
    to: bakerEmail,
    subject: template.subject,
    html,
    text,
  });

  return { success, emailKey: template.emailKey };
}

type MilestoneType = "pricing_live" | "first_lead" | "first_quote" | "first_payment";

interface MilestoneEmailConfig {
  subject: string;
  body: string;
  ctaText: string;
  ctaPath: string;
}

const MILESTONE_EMAILS: Record<MilestoneType, MilestoneEmailConfig> = {
  pricing_live: {
    subject: "Your order page is officially live \u{1F389}",
    body: `<p>You did it.</p>
<p>Your pricing is confirmed — which means your order page is ready to receive real requests.</p>
<p>This is where most bakers hesitate. Don't.</p>
<p>Add your link to your bio and start routing inquiries through it.</p>`,
    ctaText: "Copy Your Order Page Link",
    ctaPath: "/share",
  },
  first_lead: {
    subject: "You just got your first request \u{1F680}",
    body: `<p>That wasn't a test.</p>
<p>Someone just used your order page to request a custom quote.</p>
<p>This is the system working.</p>
<p>Open the request, convert it to a quote, and keep the momentum going.</p>`,
    ctaText: "View Request",
    ctaPath: "/leads",
  },
  first_quote: {
    subject: "You just sent your first professional quote \u{1F4AA}",
    body: `<p>You just moved from pricing in DMs to running a structured system.</p>
<p>Clean quote. Clear breakdown. Deposit option.</p>
<p>This is how serious businesses operate.</p>
<p>Keep routing inquiries through your order page.</p>`,
    ctaText: "Go to Quotes",
    ctaPath: "/quotes",
  },
  first_payment: {
    subject: "You just got paid through BakerIQ \u{1F4B0}",
    body: `<p>A deposit just landed.</p>
<p>No chasing. No screenshots. No awkward follow-ups.</p>
<p>This is what automated payments feel like.</p>
<p>Keep using your order page — this is only the beginning.</p>`,
    ctaText: "View Dashboard",
    ctaPath: "/dashboard",
  },
};

export async function sendMilestoneEmail(
  bakerEmail: string,
  businessName: string,
  milestone: MilestoneType,
  baseUrl: string,
  emailPrefsToken?: string | null
): Promise<boolean> {
  const config = MILESTONE_EMAILS[milestone];
  if (!config) return false;

  const ctaUrl = `${baseUrl}${config.ctaPath}`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: 'Inter', Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #E91E63, #F06292); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 8px 8px; }
    .cta { display: inline-block; background: #E91E63; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; margin: 20px 0; font-weight: 600; }
    .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="margin: 0; font-size: 22px;">BakerIQ</h1>
    </div>
    <div class="content">
      <p>Hi ${businessName},</p>
      ${config.body}
      <p style="text-align: center; margin-top: 24px;">
        <a href="${ctaUrl}" class="cta">${config.ctaText}</a>
      </p>
    </div>
    ${getBakerEmailFooterHtml(emailPrefsToken)}
  </div>
</body>
</html>
`;

  const textBody = config.body
    .replace(/<p[^>]*>/g, '\n')
    .replace(/<\/p>/g, '')
    .replace(/<[^>]+>/g, '')
    .trim();

  const text = `Hi ${businessName},\n\n${textBody}\n\n${config.ctaText}: ${ctaUrl}${getBakerEmailFooterText(emailPrefsToken)}`;

  const success = await sendEmail({
    to: bakerEmail,
    subject: config.subject,
    html,
    text,
  });

  if (success) {
    console.log(`[Milestone] Sent ${milestone} email to ${bakerEmail}`);
  } else {
    console.error(`[Milestone] Failed to send ${milestone} email to ${bakerEmail}`);
  }

  return success;
}

export async function sendRetentionEmail(
  bakerEmail: string,
  subject: string,
  bodyHtml: string,
  bodyText: string,
  emailPrefsToken?: string | null
): Promise<boolean> {
  const html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: 'Inter', Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #E91E63, #F06292); color: white; padding: 24px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 8px 8px; }
    .cta { display: inline-block; background: #E91E63; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; margin: 20px 0; font-weight: 600; }
    .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="margin: 0; font-size: 24px;">BakerIQ</h1>
    </div>
    <div class="content">
      ${bodyHtml}
    </div>
    ${getBakerEmailFooterHtml(emailPrefsToken)}
  </div>
</body>
</html>
`;

  return sendEmail({
    to: bakerEmail,
    subject,
    html,
    text: bodyText + getBakerEmailFooterText(emailPrefsToken),
  });
}

export async function sendPaymentReceivedNotification(
  bakerEmail: string,
  bakerName: string,
  payment: {
    customerName: string;
    quoteTitle: string;
    quoteNumber: string;
    amount: number;
    paymentType: string;
    totalQuoteAmount: number;
    totalPaid: number;
  },
  emailPrefsToken?: string | null
): Promise<boolean> {
  const paymentTypeLabel = payment.paymentType === "deposit" ? "Deposit" : "Full Payment";
  const isPaidInFull = payment.totalPaid >= payment.totalQuoteAmount;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: 'Inter', Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #16a34a, #22c55e); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 8px 8px; }
    .amount { font-size: 32px; font-weight: bold; color: #16a34a; text-align: center; margin: 20px 0; }
    .detail-row { display: flex; padding: 10px 0; border-bottom: 1px solid #e9ecef; }
    .label { font-weight: 600; min-width: 120px; color: #666; }
    .value { color: #333; }
    .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Payment Received!</h1>
      <p>${paymentTypeLabel} for Quote #${payment.quoteNumber}</p>
    </div>
    <div class="content">
      <div class="amount">${formatCurrency(payment.amount)}</div>
      <div class="detail-row">
        <span class="label">Customer:</span>
        <span class="value">${payment.customerName}</span>
      </div>
      <div class="detail-row">
        <span class="label">Quote:</span>
        <span class="value">${payment.quoteTitle} (#${payment.quoteNumber})</span>
      </div>
      <div class="detail-row">
        <span class="label">Payment Type:</span>
        <span class="value">${paymentTypeLabel}</span>
      </div>
      <div class="detail-row">
        <span class="label">Quote Total:</span>
        <span class="value">${formatCurrency(payment.totalQuoteAmount)}</span>
      </div>
      <div class="detail-row">
        <span class="label">Total Paid:</span>
        <span class="value">${formatCurrency(payment.totalPaid)}</span>
      </div>
      ${isPaidInFull ? '<p style="text-align: center; color: #16a34a; font-weight: bold; margin-top: 20px;">This quote is now paid in full!</p>' : `<p style="text-align: center; color: #666; margin-top: 20px;">Remaining balance: ${formatCurrency(payment.totalQuoteAmount - payment.totalPaid)}</p>`}
    </div>
    ${getBakerEmailFooterHtml(emailPrefsToken)}
  </div>
</body>
</html>
`;

  const text = `Payment Received! ${formatCurrency(payment.amount)} ${paymentTypeLabel} from ${payment.customerName} for Quote #${payment.quoteNumber} (${payment.quoteTitle}). Total paid: ${formatCurrency(payment.totalPaid)} of ${formatCurrency(payment.totalQuoteAmount)}.${getBakerEmailFooterText(emailPrefsToken)}`;

  return sendEmail({
    to: bakerEmail,
    subject: `Payment Received: ${formatCurrency(payment.amount)} from ${payment.customerName}`,
    html,
    text,
  });
}

export function getAnnouncementEmailHtml(bakerName: string, emailPrefsToken?: string | null): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <style>
    body { font-family: 'Inter', Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background: #f0f0f0; }
    .wrapper { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #E91E63, #AD1457); color: white; padding: 40px 30px; text-align: center; border-radius: 12px 12px 0 0; }
    .header h1 { margin: 0 0 8px 0; font-size: 28px; font-weight: 700; }
    .header p { margin: 0; opacity: 0.9; font-size: 16px; }
    .content { background: #ffffff; padding: 32px; }
    .greeting { font-size: 18px; margin-bottom: 16px; }
    .intro { color: #555; margin-bottom: 28px; font-size: 15px; }
    .section { margin-bottom: 28px; }
    .section-title { font-size: 18px; font-weight: 700; color: #E91E63; margin-bottom: 12px; display: flex; align-items: center; gap: 8px; }
    .section-icon { font-size: 20px; }
    .feature-list { list-style: none; padding: 0; margin: 0; }
    .feature-list li { padding: 10px 0; border-bottom: 1px solid #f0f0f0; font-size: 15px; color: #444; }
    .feature-list li:last-child { border-bottom: none; }
    .feature-list li strong { color: #333; }
    .highlight-box { background: linear-gradient(135deg, #fce4ec, #f8bbd0); border-radius: 10px; padding: 24px; margin: 24px 0; }
    .highlight-box h3 { margin: 0 0 12px 0; color: #AD1457; font-size: 17px; }
    .highlight-box p { margin: 0; color: #6d3049; font-size: 14px; line-height: 1.6; }
    .plan-grid { display: flex; gap: 8px; margin-top: 16px; }
    .plan-card { flex: 1; background: white; border-radius: 8px; padding: 16px; text-align: center; }
    .plan-card .plan-name { font-weight: 700; font-size: 14px; color: #E91E63; margin-bottom: 4px; }
    .plan-card .plan-quotes { font-size: 22px; font-weight: 700; color: #333; }
    .plan-card .plan-label { font-size: 11px; color: #888; text-transform: uppercase; letter-spacing: 0.5px; }
    .plan-card .plan-fee { font-size: 12px; color: #666; margin-top: 4px; }
    .cta-section { text-align: center; margin: 32px 0 16px 0; }
    .cta-button { display: inline-block; background: #E91E63; color: white; padding: 14px 36px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; }
    .teaser { background: #f8f9fa; border-radius: 10px; padding: 20px; margin: 24px 0; border-left: 4px solid #E91E63; }
    .teaser h3 { margin: 0 0 8px 0; font-size: 16px; color: #333; }
    .teaser p { margin: 0; color: #666; font-size: 14px; }
    .footer { background: #fafafa; padding: 24px 32px; border-radius: 0 0 12px 12px; text-align: center; border-top: 1px solid #f0f0f0; }
    .footer p { margin: 4px 0; color: #999; font-size: 12px; }
    .footer a { color: #E91E63; text-decoration: none; }
    @media (max-width: 480px) {
      .plan-grid { flex-direction: column; }
      .header { padding: 30px 20px; }
      .content { padding: 24px 20px; }
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <h1>Exciting Updates from BakerIQ</h1>
      <p>New features to help you grow your business</p>
    </div>
    <div class="content">
      <p class="greeting">Hi ${bakerName},</p>
      <p class="intro">We've been busy building new tools to help you capture more leads, close more orders, and get paid faster. Here's what's new:</p>

      <div class="section">
        <div class="section-title"><span class="section-icon">&#128179;</span> Accept Payments with Stripe</div>
        <ul class="feature-list">
          <li><strong>Get paid directly through quotes</strong> &mdash; Customers can pay deposits or full amounts right from the quote you send them.</li>
          <li><strong>Stripe Connect</strong> &mdash; Connect your Stripe account in Settings and funds go straight to your bank. Setup takes just a few minutes.</li>
          <li><strong>Automatic tracking</strong> &mdash; All payments are logged in your dashboard with no extra work on your end.</li>
        </ul>
      </div>

      <div class="section">
        <div class="section-title"><span class="section-icon">&#128200;</span> Updated Pricing &amp; Quote Limits</div>
        <p style="color: #555; font-size: 14px; margin-bottom: 12px;">We've increased limits across the board so you can do more:</p>
        <div class="plan-grid">
          <div class="plan-card">
            <div class="plan-name">Free</div>
            <div class="plan-quotes">15</div>
            <div class="plan-label">quotes/month</div>
            <div class="plan-fee">7% platform fee</div>
          </div>
          <div class="plan-card">
            <div class="plan-name">Basic</div>
            <div class="plan-quotes">&infin;</div>
            <div class="plan-label">unlimited</div>
            <div class="plan-fee">5% platform fee</div>
          </div>
          <div class="plan-card">
            <div class="plan-name">Pro</div>
            <div class="plan-quotes">&infin;</div>
            <div class="plan-label">unlimited</div>
            <div class="plan-fee">3% platform fee</div>
          </div>
        </div>
      </div>

      <div class="section">
        <div class="section-title"><span class="section-icon">&#10024;</span> More New Features</div>
        <ul class="feature-list">
          <li><strong>Custom calculator URL</strong> &mdash; Personalize your pricing calculator link (e.g., /c/your-bakery-name) from Settings.</li>
          <li><strong>Custom header image</strong> &mdash; Upload your own banner image for your public calculator page to match your brand.</li>
          <li><strong>Video tutorials</strong> &mdash; New help center with walkthrough videos to get you up and running faster.</li>
          <li><strong>Improved dashboard</strong> &mdash; Quick actions, revenue tracking, and upcoming order views all in one place.</li>
        </ul>
      </div>

      <div class="highlight-box">
        <h3>&#128161; Tip: Share Your Calculator Link</h3>
        <p>The fastest way to start receiving leads is to share your pricing calculator. Post it on your social media, add it to your bio, or text it to potential customers. They can get instant estimates and you'll receive every inquiry as a lead in your dashboard.</p>
      </div>

      <div class="teaser">
        <h3>&#127873; Earn Free Months &mdash; Refer a Friend</h3>
        <p>Love BakerIQ? Share it with fellow bakers and earn rewards! Every baker who signs up through your referral link and subscribes to a paid plan earns you a free month. You can stack up to 12 free months. Find your referral link on the <strong>Refer a Friend</strong> page in your dashboard.</p>
      </div>

      <div class="cta-section">
        <a href="https://bakeriq.app/login" class="cta-button">Log In to Your Dashboard</a>
      </div>

      <p style="color: #888; font-size: 13px; text-align: center; margin-top: 24px;">Thank you for being part of the BakerIQ community. We're here to help you succeed.</p>
    </div>
    ${getBakerEmailFooterHtml(emailPrefsToken)}
  </div>
</body>
</html>
`;
}

export function getAnnouncementEmailText(bakerName: string, emailPrefsToken?: string | null): string {
  return `Hi ${bakerName},

We've been busy building new tools for BakerIQ. Here's what's new:

ACCEPT PAYMENTS WITH STRIPE
- Get paid directly through quotes — customers can pay deposits or full amounts
- Connect your Stripe account in Settings (takes just a few minutes)
- All payments are automatically tracked in your dashboard

UPDATED PRICING & QUOTE LIMITS
- Free: 15 quotes/month (7% platform fee)
- Basic: Unlimited quotes (5% platform fee)
- Pro: Unlimited quotes (3% platform fee)

MORE NEW FEATURES
- Custom calculator URL — personalize your pricing calculator link
- Custom header image — upload your own banner for your calculator page
- Video tutorials — new help center with walkthrough videos
- Improved dashboard — quick actions, revenue tracking, upcoming orders

TIP: Share your calculator link on social media to start receiving leads!

REFER A FRIEND: Love BakerIQ? Share your referral link with fellow bakers. When they sign up and subscribe, you earn a free month — stack up to 12! Find your link on the Refer a Friend page in your dashboard.

Log in to your dashboard: https://bakeriq.app/login

Thank you for being part of the BakerIQ community!
— The BakerIQ Team
${getBakerEmailFooterText(emailPrefsToken)}`;
}

export async function sendInvitationEmail(
  to: string,
  inviteLink: string,
  role: string,
  giftedPlan: string | null,
  giftedPlanDurationMonths: number | null,
  emailPrefsToken?: string | null,
): Promise<boolean> {
  const planDetails = giftedPlan && giftedPlanDurationMonths
    ? `<p style="background: #fff3e0; border: 1px solid #ffe0b2; padding: 12px; border-radius: 6px; margin: 16px 0;">
        As part of this invitation, you'll receive <strong>${giftedPlanDurationMonths} month${giftedPlanDurationMonths > 1 ? "s" : ""}</strong> of our <strong>${giftedPlan.charAt(0).toUpperCase() + giftedPlan.slice(1)} plan</strong> at no cost!
      </p>`
    : "";

  const roleLabel = role === "super_admin" ? "Super Admin" : role.charAt(0).toUpperCase() + role.slice(1);

  const html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: 'Inter', Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #E91E63, #F06292); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 8px 8px; }
    .cta { display: inline-block; background: #E91E63; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; margin: 20px 0; font-weight: 600; }
    .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>You're Invited to BakerIQ</h1>
    </div>
    <div class="content">
      <p>Hi there,</p>
      <p>You've been invited to join <strong>BakerIQ</strong> as a <strong>${roleLabel}</strong>. BakerIQ is a lead capture and quote management platform designed specifically for custom cake bakers.</p>
      <p>With BakerIQ you can:</p>
      <ul>
        <li>Capture leads with a customizable cake pricing calculator</li>
        <li>Create and send professional quotes</li>
        <li>Accept payments through Stripe</li>
        <li>Manage orders and customer relationships</li>
      </ul>
      ${planDetails}
      <p style="text-align: center;">
        <a href="${inviteLink}" class="cta">Accept Invitation</a>
      </p>
      <p style="color: #666; font-size: 14px;">This invitation link will expire in 7 days.</p>
    </div>
    ${getBakerEmailFooterHtml(emailPrefsToken)}
  </div>
</body>
</html>
`;

  const text = `You're Invited to BakerIQ

Hi there,

You've been invited to join BakerIQ as a ${roleLabel}.

BakerIQ is a lead capture and quote management platform designed specifically for custom cake bakers.

${giftedPlan && giftedPlanDurationMonths ? `You'll receive ${giftedPlanDurationMonths} month(s) of the ${giftedPlan.charAt(0).toUpperCase() + giftedPlan.slice(1)} plan at no cost!` : ""}

Accept your invitation here: ${inviteLink}

This invitation link will expire in 7 days.
${getBakerEmailFooterText(emailPrefsToken)}`;

  return sendEmail({
    to,
    subject: "You've been invited to join BakerIQ",
    html,
    text,
    senderType: "platform",
  });
}

export async function sendAnnouncementEmail(
  to: string,
  bakerName: string,
  emailPrefsToken?: string | null,
): Promise<boolean> {
  return sendEmail({
    to,
    subject: "What's New at BakerIQ: Stripe Payments, More Quotes & New Features",
    html: getAnnouncementEmailHtml(bakerName, emailPrefsToken),
    text: getAnnouncementEmailText(bakerName, emailPrefsToken),
  });
}

export interface AdminEmailTokens {
  bakerName: string;
  businessName: string;
  calculatorLink: string;
  email: string;
  plan: string;
  referralLink: string;
}

function replaceTokens(content: string, tokens: AdminEmailTokens): string {
  return content
    .replace(/\{\{Baker Name\}\}/g, tokens.bakerName)
    .replace(/\{\{Business Name\}\}/g, tokens.businessName)
    .replace(/\{\{Calculator Link\}\}/g, tokens.calculatorLink)
    .replace(/\{\{Email\}\}/g, tokens.email)
    .replace(/\{\{Plan\}\}/g, tokens.plan)
    .replace(/\{\{Referral Link\}\}/g, tokens.referralLink);
}

function convertBodyToHtml(body: string): string {
  return body
    .split("\n\n")
    .map(block => {
      const trimmed = block.trim();
      if (!trimmed) return "";
      if (trimmed.startsWith("# ")) return `<h1 style="font-size:24px;font-weight:700;color:#333;margin:20px 0 12px 0;">${trimmed.slice(2)}</h1>`;
      if (trimmed.startsWith("## ")) return `<h2 style="font-size:20px;font-weight:700;color:#333;margin:18px 0 10px 0;">${trimmed.slice(3)}</h2>`;
      if (trimmed.startsWith("### ")) return `<h3 style="font-size:17px;font-weight:700;color:#333;margin:16px 0 8px 0;">${trimmed.slice(4)}</h3>`;
      const lines = trimmed.split("\n");
      const isList = lines.every(l => l.trim().startsWith("• ") || l.trim().startsWith("- ") || l.trim() === "");
      if (isList) {
        const items = lines.filter(l => l.trim().startsWith("• ") || l.trim().startsWith("- ")).map(l => `<li style="padding:4px 0;color:#444;">${l.trim().replace(/^[•\-]\s*/, "")}</li>`).join("");
        return `<ul style="list-style:disc;padding-left:24px;margin:8px 0;">${items}</ul>`;
      }
      return lines.map(l => {
        const t = l.trim();
        if (!t) return "<br/>";
        return `<p style="color:#444;font-size:15px;margin:4px 0;line-height:1.6;">${t}</p>`;
      }).join("");
    })
    .join("");
}

function isHtml(text: string): boolean {
  return /<[a-z][\s\S]*>/i.test(text);
}

function sanitizeEmailHtml(html: string): string {
  return sanitizeHtml(html, {
    allowedTags: ["h1", "h2", "h3", "p", "br", "strong", "b", "em", "i", "u", "ul", "ol", "li", "a", "span", "div", "blockquote", "hr"],
    allowedAttributes: {
      a: ["href", "target"],
      "*": ["style"],
    },
    allowedSchemes: ["http", "https", "mailto"],
  });
}

function inlineEmailStyles(html: string): string {
  const clean = sanitizeEmailHtml(html);
  return clean
    .replace(/<h1(?:\s[^>]*)?>/g, '<h1 style="font-size:24px;font-weight:700;color:#333;margin:20px 0 12px 0;">')
    .replace(/<h2(?:\s[^>]*)?>/g, '<h2 style="font-size:20px;font-weight:700;color:#333;margin:18px 0 10px 0;">')
    .replace(/<h3(?:\s[^>]*)?>/g, '<h3 style="font-size:17px;font-weight:700;color:#333;margin:16px 0 8px 0;">')
    .replace(/<p(?:\s[^>]*)?>/g, '<p style="color:#444;font-size:15px;margin:4px 0;line-height:1.6;">')
    .replace(/<ul(?:\s[^>]*)?>/g, '<ul style="list-style:disc;padding-left:24px;margin:8px 0;">')
    .replace(/<ol(?:\s[^>]*)?>/g, '<ol style="list-style:decimal;padding-left:24px;margin:8px 0;">')
    .replace(/<li(?:\s[^>]*)?>/g, '<li style="padding:4px 0;color:#444;">')
    .replace(/<a /g, '<a style="color:#E91E63;text-decoration:underline;" ')
    .replace(/<strong(?:\s[^>]*)?>/g, '<strong style="font-weight:700;">')
    .replace(/<em(?:\s[^>]*)?>/g, '<em style="font-style:italic;">')
    .replace(/<u(?:\s[^>]*)?>/g, '<u style="text-decoration:underline;">');
}

export function getDynamicEmailHtml(subject: string, bodyContent: string, tokens: AdminEmailTokens, emailPrefsToken?: string | null): string {
  const processedBody = replaceTokens(bodyContent, tokens);
  const bodyHtml = isHtml(processedBody) ? inlineEmailStyles(processedBody) : convertBodyToHtml(processedBody);
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <style>
    body { font-family: 'Inter', Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background: #f0f0f0; }
    .wrapper { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #E91E63, #AD1457); color: white; padding: 40px 30px; text-align: center; border-radius: 12px 12px 0 0; }
    .header h1 { margin: 0 0 8px 0; font-size: 24px; font-weight: 700; }
    .content { background: #ffffff; padding: 32px; }
    .cta-section { text-align: center; margin: 32px 0 16px 0; }
    .cta-button { display: inline-block; background: #E91E63; color: white; padding: 14px 36px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; }
    .footer { background: #fafafa; padding: 24px 32px; border-radius: 0 0 12px 12px; text-align: center; border-top: 1px solid #f0f0f0; }
    .footer p { margin: 4px 0; color: #999; font-size: 12px; }
    .footer a { color: #E91E63; text-decoration: none; }
    @media (max-width: 480px) {
      .header { padding: 30px 20px; }
      .content { padding: 24px 20px; }
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <h1>${replaceTokens(subject, tokens)}</h1>
    </div>
    <div class="content">
      ${bodyHtml}
      <div class="cta-section">
        <a href="https://bakeriq.app/login" class="cta-button">Log In to Your Dashboard</a>
      </div>
    </div>
    ${getBakerEmailFooterHtml(emailPrefsToken)}
  </div>
</body>
</html>`;
}

function stripHtmlToText(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<\/h[1-3]>/gi, "\n\n")
    .replace(/<\/li>/gi, "\n")
    .replace(/<li[^>]*>/gi, "- ")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function getDynamicEmailText(bodyContent: string, tokens: AdminEmailTokens, emailPrefsToken?: string | null): string {
  const processedBody = replaceTokens(bodyContent, tokens);
  const text = isHtml(processedBody) ? stripHtmlToText(processedBody) : processedBody
    .replace(/^#{1,3}\s/gm, "")
    .replace(/^[•\-]\s/gm, "- ");
  return text + "\n\nLog in to your dashboard: https://bakeriq.app/login\n\n\u2014 The BakerIQ Team" + getBakerEmailFooterText(emailPrefsToken);
}

export async function sendDynamicAdminEmail(
  to: string,
  subject: string,
  bodyContent: string,
  tokens: AdminEmailTokens,
  emailPrefsToken?: string | null,
): Promise<boolean> {
  return sendEmail({
    to,
    subject: replaceTokens(subject, tokens),
    html: getDynamicEmailHtml(subject, bodyContent, tokens, emailPrefsToken),
    text: getDynamicEmailText(bodyContent, tokens, emailPrefsToken),
  });
}

export async function sendAffiliateApplicationConfirmation(applicantEmail: string, applicantName: string): Promise<boolean> {
  const safeName = applicantName.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  const html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: 'Inter', Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #E91E63, #F06292); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 8px 8px; }
    .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Application Received!</h1>
      <p>BakerIQ Founding Partners Program</p>
    </div>
    <div class="content">
      <p>Hi ${safeName},</p>
      <p>Thanks for applying to the BakerIQ Founding Partners Program! We've received your application and are excited to review it.</p>
      <p>Our team reviews every application personally. You can expect to hear back from us within a few business days.</p>
      <p>In the meantime, feel free to explore <a href="https://bakeriq.app" style="color: #E91E63; text-decoration: none;">BakerIQ</a> to learn more about the platform and what your audience will love about it.</p>
      <p style="margin-top: 24px;">Thanks for your interest,<br><strong>The BakerIQ Team</strong></p>
    </div>
    ${getCustomerEmailFooterHtml()}
  </div>
</body>
</html>`;
  const text = `Thanks for applying, ${applicantName}!\n\nWe've received your application to the BakerIQ Founding Partners Program.\n\nOur team reviews every application personally. You can expect to hear back from us within a few business days.\n\nIn the meantime, feel free to explore BakerIQ at https://bakeriq.app to learn more about the platform.\n\nThanks for your interest,\nThe BakerIQ Team\n${getCustomerEmailFooterText()}`;

  return sendEmail({
    to: applicantEmail,
    subject: "We received your BakerIQ partner application",
    html,
    text,
    senderType: "platform",
  });
}

export async function sendAffiliateApplicationNotification(application: {
  name: string;
  email: string;
  socialMedia: string;
  followers: string | null;
  niche: string | null;
  message: string | null;
}, adminEmails: string[]): Promise<void> {
  const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  const safeName = esc(application.name);
  const safeEmail = esc(application.email);
  const safeSocial = esc(application.socialMedia);
  const safeFollowers = application.followers ? esc(application.followers) : "Not specified";
  const safeNiche = application.niche ? esc(application.niche) : "Not specified";
  const safeMessage = application.message ? esc(application.message) : "No message";
  const socialUrl = application.socialMedia.startsWith("http") ? application.socialMedia : "https://" + application.socialMedia;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: 'Inter', Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #E91E63, #F06292); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 8px 8px; }
    .detail-row { display: flex; padding: 10px 0; border-bottom: 1px solid #e9ecef; }
    .label { font-weight: 600; min-width: 120px; color: #666; }
    .value { color: #333; }
    .cta { display: inline-block; background: #E91E63; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 20px; }
    .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>New Partner Application</h1>
      <p>Someone wants to join the BakerIQ affiliate program</p>
    </div>
    <div class="content">
      <h2 style="margin-top: 0;">Application Details</h2>
      <div class="detail-row">
        <span class="label">Name:</span>
        <span class="value">${safeName}</span>
      </div>
      <div class="detail-row">
        <span class="label">Email:</span>
        <span class="value">${safeEmail}</span>
      </div>
      <div class="detail-row">
        <span class="label">Social Media:</span>
        <span class="value"><a href="${encodeURI(socialUrl)}" style="color: #E91E63; text-decoration: none;">${safeSocial}</a></span>
      </div>
      <div class="detail-row">
        <span class="label">Followers:</span>
        <span class="value">${safeFollowers}</span>
      </div>
      <div class="detail-row">
        <span class="label">Niche:</span>
        <span class="value">${safeNiche}</span>
      </div>
      <div class="detail-row">
        <span class="label">Message:</span>
        <span class="value">${safeMessage}</span>
      </div>
      <div style="text-align: center;">
        <a href="https://bakeriq.app/admin" class="cta">Review in Admin Dashboard</a>
      </div>
    </div>
    ${getBakerEmailFooterHtml()}
  </div>
</body>
</html>`;
  const text = `New Partner Application\n\nName: ${application.name}\nEmail: ${application.email}\nSocial Media: ${application.socialMedia}\nFollowers: ${application.followers || "Not specified"}\nNiche: ${application.niche || "Not specified"}\nMessage: ${application.message || "No message"}\n\nReview in the Admin Dashboard: https://bakeriq.app/admin\n${getBakerEmailFooterText()}`;

  for (const adminEmail of adminEmails.filter(e => e && e.includes("@"))) {
    await sendEmail({
      to: adminEmail,
      subject: `New Partner Application: ${application.name}`,
      html,
      text,
      senderType: "platform",
    });
  }
}

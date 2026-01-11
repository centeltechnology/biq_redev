import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";

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

const FROM_EMAIL = process.env.AWS_SES_FROM_EMAIL || "noreply@bakeriq.app";

interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export async function sendEmail({
  to,
  subject,
  html,
  text,
}: SendEmailParams): Promise<boolean> {
  if (
    !process.env.AWS_ACCESS_KEY_ID ||
    !process.env.AWS_SECRET_ACCESS_KEY ||
    !process.env.AWS_SES_FROM_EMAIL
  ) {
    console.log("AWS SES credentials not configured, skipping email send");
    return false;
  }

  try {
    const command = new SendEmailCommand({
      Source: FROM_EMAIL,
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
    console.log(`Email sent successfully to ${to}`);
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
  }
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
    <div class="footer">
      <p>This email was sent by BakerIQ</p>
    </div>
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
`;

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
    <div class="footer">
      <p>This email was sent via BakerIQ</p>
    </div>
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
`;

  return sendEmail({
    to: customerEmail,
    subject: `Your ${subjectType} Inquiry - ${bakerBusinessName}`,
    html,
    text,
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
    depositPercentage?: number;
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

  const depositAmount = quote.depositPercentage ? quote.total * (quote.depositPercentage / 100) : 0;

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
      <p>Hi ${customerName},</p>
      <p>Great news! We've prepared a custom quote for your ${orderType}.</p>
      
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
          ${quote.depositPercentage && quote.depositPercentage > 0 ? `
          <tr>
            <td style="padding: 5px 0; color: #666;">Deposit Required (${quote.depositPercentage}%)</td>
            <td style="padding: 5px 0; text-align: right; font-weight: bold;">${formatCurrency(depositAmount)}</td>
          </tr>
          ` : ""}
        </table>
      </div>
      
      ${quote.notes ? `<p style="background: #fff3cd; padding: 15px; border-radius: 6px;"><strong>Notes:</strong> ${quote.notes}</p>` : ""}
      
      <p style="text-align: center;">
        <a href="${quote.viewUrl}" class="cta">View Full Quote & Payment Details</a>
      </p>
      
      <p>To confirm your order, please respond to this email or contact us directly.</p>
      <p style="margin-top: 30px;">Sweet regards,<br><strong>${bakerBusinessName}</strong></p>
    </div>
    <div class="footer">
      <p>This email was sent via BakerIQ</p>
    </div>
  </div>
</body>
</html>
`;

  const itemsText = items
    .filter(i => i.name)
    .map(i => `  - ${i.name}: ${formatCurrency(parseFloat(i.totalPrice))}`)
    .join("\n");

  const text = `
Hi ${customerName},

Great news! We've prepared a custom quote for your ${orderType}.

Quote #${quote.quoteNumber}
${quote.eventDate ? `Event Date: ${new Date(quote.eventDate).toLocaleDateString()}` : ""}

Items:
${itemsText}

Subtotal: ${formatCurrency(quote.subtotal)}
Tax (${(quote.taxRate * 100).toFixed(1)}%): ${formatCurrency(quote.taxAmount)}
Total: ${formatCurrency(quote.total)}
${quote.depositPercentage ? `Deposit Required (${quote.depositPercentage}%): ${formatCurrency(depositAmount)}` : ""}

${quote.notes ? `Notes: ${quote.notes}` : ""}

View your full quote with payment details: ${quote.viewUrl}

To confirm your order, please respond to this email or contact us directly.

Sweet regards,
${bakerBusinessName}
`;

  return sendEmail({
    to: customerEmail,
    subject: `Your Quote from ${bakerBusinessName} - ${formatCurrency(quote.total)}`,
    html,
    text,
  });
}

export async function sendPasswordResetEmail(
  email: string,
  resetToken: string,
  baseUrl: string
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
    <div class="footer">
      <p>This email was sent by BakerIQ</p>
    </div>
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
`;

  return sendEmail({
    to: email,
    subject: "Reset Your BakerIQ Password",
    html,
    text,
  });
}

export async function sendEmailVerification(
  email: string,
  verificationToken: string,
  baseUrl: string
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
    <div class="footer">
      <p>This email was sent by BakerIQ</p>
    </div>
  </div>
</body>
</html>
`;

  const text = `
Welcome to BakerIQ!

Thanks for signing up! Please verify your email address by clicking the link below:

${verifyUrl}

This link will expire in 24 hours.
`;

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
  }
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
    <div class="footer">
      <p>This email was sent by BakerIQ</p>
    </div>
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
`;

  return sendEmail({
    to: bakerEmail,
    subject: `Quote ${actionText}: ${response.customerName} - ${formatCurrency(response.total)}`,
    html,
    text,
  });
}

// Onboarding email templates
interface OnboardingEmailData {
  day: number;
  subject: string;
  title: string;
  content: string;
  ctaText?: string;
  ctaUrl?: string;
}

const ONBOARDING_EMAILS: OnboardingEmailData[] = [
  {
    day: 0,
    subject: "Welcome to BakerIQ! Let's get you started",
    title: "Welcome to BakerIQ!",
    content: `
      <p>Congratulations on taking the first step to streamline your bakery business!</p>
      <p>BakerIQ helps you capture leads, create professional quotes, and manage your orders all in one place.</p>
      <h3 style="color: #E91E63; margin-top: 24px;">Quick Start Checklist:</h3>
      <ul style="padding-left: 20px;">
        <li><strong>Set your prices</strong> - Go to Calculator Pricing to customize your rates</li>
        <li><strong>Share your calculator</strong> - Copy your unique link from Settings</li>
        <li><strong>Wait for leads</strong> - You'll get an email when customers submit inquiries</li>
      </ul>
      <p style="margin-top: 20px;">You're on the <strong>Free plan</strong> with 5 quotes per month. Upgrade anytime for more!</p>
    `,
    ctaText: "Go to Dashboard",
    ctaUrl: "/dashboard",
  },
  {
    day: 1,
    subject: "Set up your pricing - Day 1 of getting started",
    title: "Set Up Your Pricing",
    content: `
      <p>Your public calculator is ready - now let's customize your prices!</p>
      <h3 style="color: #E91E63; margin-top: 24px;">What you can customize:</h3>
      <ul style="padding-left: 20px;">
        <li><strong>Cake sizes</strong> - Set base prices for each tier size</li>
        <li><strong>Flavors & frostings</strong> - Add premiums for specialty options</li>
        <li><strong>Decorations</strong> - Price your artistic touches</li>
        <li><strong>Addons</strong> - Dipped strawberries, sweets tables, and more</li>
        <li><strong>Delivery fees</strong> - Standard, rush, and setup service pricing</li>
      </ul>
      <p style="margin-top: 20px;">Customers will see estimates based on YOUR prices when they use your calculator.</p>
      <h3 style="color: #E91E63; margin-top: 24px;">Need help calculating prices?</h3>
      <p>Use our <strong>Price Calculator</strong> tool to figure out how much to charge based on your material costs, labor time, and desired profit margin. Find it in your dashboard sidebar!</p>
    `,
    ctaText: "Set Your Prices",
    ctaUrl: "/pricing",
  },
  {
    day: 2,
    subject: "Create professional quotes - Day 2",
    title: "Creating Professional Quotes",
    content: `
      <p>When a customer is interested, turn their inquiry into a polished quote!</p>
      <h3 style="color: #E91E63; margin-top: 24px;">Quote builder features:</h3>
      <ul style="padding-left: 20px;">
        <li><strong>Pre-filled details</strong> - Lead information carries over automatically</li>
        <li><strong>Line items</strong> - Add cakes, decorations, delivery, and custom items</li>
        <li><strong>Professional emails</strong> - Send quotes directly to customers</li>
        <li><strong>Status tracking</strong> - See when quotes are viewed and accepted</li>
      </ul>
      <p style="margin-top: 20px;"><strong>Tip:</strong> Draft quotes don't count toward your monthly limit - only sent quotes do!</p>
    `,
    ctaText: "View Your Leads",
    ctaUrl: "/leads",
  },
  {
    day: 3,
    subject: "Managing leads effectively - Day 3",
    title: "Managing Your Leads",
    content: `
      <p>Every calculator submission becomes a lead you can track and convert.</p>
      <h3 style="color: #E91E63; margin-top: 24px;">Lead management tips:</h3>
      <ul style="padding-left: 20px;">
        <li><strong>Update status</strong> - Mark leads as Contacted, Quoted, Won, or Lost</li>
        <li><strong>Add notes</strong> - Keep track of conversations and details</li>
        <li><strong>Quick actions</strong> - Create quotes or convert to customers in one click</li>
        <li><strong>Email notifications</strong> - Get alerted when new leads come in</li>
      </ul>
      <p style="margin-top: 20px;">Leads are <strong>unlimited on all plans</strong> - never miss an opportunity!</p>
    `,
    ctaText: "View Leads",
    ctaUrl: "/leads",
  },
  {
    day: 4,
    subject: "Your order calendar - Day 4",
    title: "Using the Order Calendar",
    content: `
      <p>Once a quote is accepted, convert it to an order and track it on your calendar.</p>
      <h3 style="color: #E91E63; margin-top: 24px;">Calendar features:</h3>
      <ul style="padding-left: 20px;">
        <li><strong>Visual timeline</strong> - See all upcoming orders at a glance</li>
        <li><strong>Payment tracking</strong> - Monitor deposits and balances due</li>
        <li><strong>Order details</strong> - Click any order for full specifications</li>
        <li><strong>Search</strong> - Find orders by customer name or event type</li>
      </ul>
      <p style="margin-top: 20px;">Never miss a delivery date again!</p>
    `,
    ctaText: "View Calendar",
    ctaUrl: "/orders/calendar",
  },
  {
    day: 5,
    subject: "Customize your treats menu - Day 5",
    title: "Customizing Your Treats",
    content: `
      <p>Your calculator can offer more than just cakes! Customize what treats you sell.</p>
      <h3 style="color: #E91E63; margin-top: 24px;">Available treats:</h3>
      <ul style="padding-left: 20px;">
        <li>Cupcakes (standard & gourmet)</li>
        <li>Cake pops</li>
        <li>Decorated cookies</li>
        <li>Brownies & rice treats</li>
        <li>Dipped strawberries & chocolate apples</li>
        <li>And more!</li>
      </ul>
      <p style="margin-top: 20px;">In Calculator Pricing, you can <strong>enable or disable</strong> any treat item and set your own prices.</p>
    `,
    ctaText: "Customize Treats",
    ctaUrl: "/calculator-pricing",
  },
  {
    day: 6,
    subject: "Grow with the right plan - Day 6",
    title: "Choose Your Plan",
    content: `
      <p>As your business grows, BakerIQ grows with you!</p>
      <h3 style="color: #E91E63; margin-top: 24px;">Plans to fit your needs:</h3>
      <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
        <tr style="background: #f8f9fa;">
          <td style="padding: 12px; border: 1px solid #e9ecef;"><strong>Free</strong></td>
          <td style="padding: 12px; border: 1px solid #e9ecef;">5 quotes/month</td>
          <td style="padding: 12px; border: 1px solid #e9ecef;">$0</td>
        </tr>
        <tr>
          <td style="padding: 12px; border: 1px solid #e9ecef;"><strong>Basic</strong></td>
          <td style="padding: 12px; border: 1px solid #e9ecef;">25 quotes/month</td>
          <td style="padding: 12px; border: 1px solid #e9ecef;">$9.97/mo</td>
        </tr>
        <tr style="background: #fce4ec;">
          <td style="padding: 12px; border: 1px solid #e9ecef;"><strong>Pro</strong></td>
          <td style="padding: 12px; border: 1px solid #e9ecef;">Unlimited quotes</td>
          <td style="padding: 12px; border: 1px solid #e9ecef;">$29.97/mo</td>
        </tr>
      </table>
      <p><strong>Remember:</strong> Leads are always unlimited, and draft quotes don't count!</p>
    `,
    ctaText: "View Plans",
    ctaUrl: "/settings",
  },
  {
    day: 7,
    subject: "Tips for success - Day 7",
    title: "Tips for Success",
    content: `
      <p>You're all set! Here are some final tips to make the most of BakerIQ:</p>
      <h3 style="color: #E91E63; margin-top: 24px;">Pro tips from successful bakers:</h3>
      <ul style="padding-left: 20px;">
        <li><strong>Share your link everywhere</strong> - Instagram bio, Facebook, business cards</li>
        <li><strong>Respond quickly</strong> - Leads go cold fast, so quote them promptly</li>
        <li><strong>Add social links</strong> - Help customers find you on social media</li>
        <li><strong>Set your payment methods</strong> - Make it easy for customers to pay</li>
        <li><strong>Check your calendar weekly</strong> - Stay organized with upcoming orders</li>
      </ul>
      <p style="margin-top: 20px;">Thank you for choosing BakerIQ. We're here to help your bakery thrive!</p>
    `,
    ctaText: "Go to Dashboard",
    ctaUrl: "/dashboard",
  },
];

export function getOnboardingEmailTemplate(day: number): OnboardingEmailData | undefined {
  return ONBOARDING_EMAILS.find(e => e.day === day);
}

export async function sendOnboardingEmail(
  bakerEmail: string,
  businessName: string,
  day: number,
  baseUrl: string
): Promise<boolean> {
  const template = getOnboardingEmailTemplate(day);
  if (!template) {
    console.error(`No onboarding email template found for day ${day}`);
    return false;
  }

  const ctaUrl = template.ctaUrl ? `${baseUrl}${template.ctaUrl}` : null;

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
    ul { margin: 16px 0; }
    li { margin: 8px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="margin: 0;">${template.title}</h1>
      ${day > 0 ? `<p style="margin: 10px 0 0 0; opacity: 0.9;">Day ${day} of your onboarding journey</p>` : ''}
    </div>
    <div class="content">
      <p>Hi ${businessName},</p>
      ${template.content}
      ${ctaUrl && template.ctaText ? `
      <p style="text-align: center; margin-top: 24px;">
        <a href="${ctaUrl}" class="cta">${template.ctaText}</a>
      </p>
      ` : ''}
    </div>
    <div class="footer">
      <p>This email was sent by BakerIQ to help you get started.</p>
      <p style="margin-top: 8px;"><a href="${baseUrl}/settings" style="color: #666;">Manage email preferences</a></p>
    </div>
  </div>
</body>
</html>
`;

  const textContent = template.content
    .replace(/<h3[^>]*>/g, '\n\n')
    .replace(/<\/h3>/g, '\n')
    .replace(/<li><strong>([^<]+)<\/strong>/g, '- $1')
    .replace(/<li>/g, '- ')
    .replace(/<\/li>/g, '')
    .replace(/<ul[^>]*>/g, '')
    .replace(/<\/ul>/g, '')
    .replace(/<p[^>]*>/g, '\n')
    .replace(/<\/p>/g, '')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .trim();

  const text = `
Hi ${businessName},

${template.title}
${day > 0 ? `Day ${day} of your onboarding journey` : ''}

${textContent}

${ctaUrl ? `${template.ctaText}: ${ctaUrl}` : ''}

---
This email was sent by BakerIQ to help you get started.
`;

  return sendEmail({
    to: bakerEmail,
    subject: template.subject,
    html,
    text,
  });
}

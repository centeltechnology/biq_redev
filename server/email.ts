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
      <p>A customer is interested in your cakes</p>
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
      <p>Thank you for your interest in our custom cakes! We've received your inquiry and will get back to you soon.</p>
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

  const text = `
Hi ${customerName},

Thank you for your interest in our custom cakes! We've received your inquiry and will get back to you soon.

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
    subject: `Your Cake Inquiry - ${bakerBusinessName}`,
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
  const decorationItems = items.filter(i => i.category === "decoration");
  const addonItems = items.filter(i => i.category === "addon");
  const deliveryItems = items.filter(i => i.category === "delivery");
  const otherItems = items.filter(i => i.category === "other" && i.name);

  const depositAmount = quote.depositPercentage ? quote.total * (quote.depositPercentage / 100) : 0;

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
      <p style="margin: 10px 0 0 0; opacity: 0.9;">${bakerBusinessName}</p>
    </div>
    <div class="content">
      <p>Hi ${customerName},</p>
      <p>Great news! We've prepared a custom quote for your cake order.</p>
      
      <div class="quote-summary">
        <p class="quote-number">Quote #${quote.quoteNumber}</p>
        ${quote.eventDate ? `<p style="margin: 5px 0; color: #666;">Event Date: <strong>${new Date(quote.eventDate).toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</strong></p>` : ""}
        
        ${cakeItems.length > 0 ? `
          <p class="section-title">Cake</p>
          <table>${renderItems(cakeItems)}</table>
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

Great news! We've prepared a custom quote for your cake order.

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

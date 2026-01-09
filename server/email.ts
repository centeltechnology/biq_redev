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

export async function sendQuoteNotification(
  customerEmail: string,
  customerName: string,
  bakerBusinessName: string,
  quote: {
    quoteNumber: string;
    total: number;
    expiresAt?: string;
    notes?: string;
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
    .quote-box { background: white; padding: 25px; border-radius: 8px; text-align: center; margin: 20px 0; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
    .quote-number { color: #666; font-size: 14px; }
    .quote-total { font-size: 2em; color: #E91E63; font-weight: bold; margin: 10px 0; }
    .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Your Quote is Ready!</h1>
      <p>${bakerBusinessName}</p>
    </div>
    <div class="content">
      <p>Hi ${customerName},</p>
      <p>Great news! We've prepared a custom quote for your cake order.</p>
      <div class="quote-box">
        <p class="quote-number">Quote #${quote.quoteNumber}</p>
        <p class="quote-total">${formatCurrency(quote.total)}</p>
        ${quote.expiresAt ? `<p style="color: #666; font-size: 14px;">Valid until: ${quote.expiresAt}</p>` : ""}
      </div>
      ${quote.notes ? `<p><strong>Notes:</strong> ${quote.notes}</p>` : ""}
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

  const text = `
Hi ${customerName},

Great news! We've prepared a custom quote for your cake order.

Quote #${quote.quoteNumber}
Total: ${formatCurrency(quote.total)}
${quote.expiresAt ? `Valid until: ${quote.expiresAt}` : ""}

${quote.notes ? `Notes: ${quote.notes}` : ""}

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

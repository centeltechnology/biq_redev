import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Cake, ArrowLeft } from "lucide-react";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/">
            <div className="flex items-center gap-2 cursor-pointer" data-testid="link-home-logo">
              <Cake className="h-8 w-8 text-primary" />
              <span className="text-xl font-bold">BakerIQ</span>
            </div>
          </Link>
          <nav className="flex items-center gap-4">
            <Link href="/help">
              <Button variant="ghost" data-testid="link-help">Help</Button>
            </Link>
            <Link href="/faq">
              <Button variant="ghost" data-testid="link-faq">FAQ</Button>
            </Link>
            <Link href="/login">
              <Button variant="outline" data-testid="link-login">Log In</Button>
            </Link>
          </nav>
        </div>
      </header>

      <main className="py-12 md:py-20">
        <div className="container max-w-4xl mx-auto px-4">
          <div className="mb-8">
            <Link href="/">
              <Button variant="ghost" size="sm" className="gap-2 -ml-3 mb-4" data-testid="button-back-home">
                <ArrowLeft className="h-4 w-4" />
                Back to Home
              </Button>
            </Link>
            <h1 className="text-3xl md:text-4xl font-bold mb-4">Privacy Policy</h1>
            <p className="text-muted-foreground">Last updated: January 2025</p>
          </div>

          <div className="prose prose-neutral dark:prose-invert max-w-none space-y-8">
            <section>
              <h2 className="text-xl font-semibold mb-4">1. Introduction</h2>
              <p className="text-muted-foreground leading-relaxed">
                BakerIQ ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our lead capture and quote management platform.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-4">2. Information We Collect</h2>
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium mb-2">Account Information</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    When you register for an account, we collect your email address, business name, phone number, and address. We also store your password in a securely hashed format.
                  </p>
                </div>
                <div>
                  <h3 className="font-medium mb-2">Business Data</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    We store the business data you enter, including pricing configurations, customer records, leads, quotes, and orders. This data is necessary to provide the Service.
                  </p>
                </div>
                <div>
                  <h3 className="font-medium mb-2">Customer Data</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    When your customers use your public calculator, we collect their name, email, phone number, event details, and cake/treat preferences. This information is stored in your account and accessible only to you.
                  </p>
                </div>
                <div>
                  <h3 className="font-medium mb-2">Usage Information</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    We may collect information about how you access and use the Service, including your IP address, browser type, pages visited, and time spent on pages.
                  </p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-4">3. How We Use Your Information</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                We use the information we collect to:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2">
                <li>Provide, maintain, and improve the Service</li>
                <li>Process your subscription and billing</li>
                <li>Send you transactional emails (account verification, password reset, lead notifications)</li>
                <li>Send onboarding and educational emails about using the platform</li>
                <li>Respond to your inquiries and provide customer support</li>
                <li>Monitor and analyze usage patterns to improve the Service</li>
                <li>Protect against fraudulent or unauthorized activity</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-4">4. Data Sharing and Disclosure</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                We do not sell your personal information. We may share your information in the following circumstances:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2">
                <li><strong>Service Providers:</strong> We use third-party services including Stripe (payment processing), AWS SES (email delivery), and PostgreSQL (database hosting) to operate the Service.</li>
                <li><strong>Legal Requirements:</strong> We may disclose information if required by law or in response to valid legal requests.</li>
                <li><strong>Business Transfers:</strong> In the event of a merger, acquisition, or sale of assets, your information may be transferred as part of that transaction.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-4">5. Data Security</h2>
              <p className="text-muted-foreground leading-relaxed">
                We implement appropriate technical and organizational security measures to protect your information. Passwords are hashed using bcrypt, sessions are securely managed, and data is transmitted over HTTPS. However, no method of transmission over the Internet is 100% secure, and we cannot guarantee absolute security.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-4">6. Data Retention</h2>
              <p className="text-muted-foreground leading-relaxed">
                We retain your account and business data for as long as your account is active. If you delete your account, we will delete or anonymize your personal information within 30 days, except where retention is required by law or for legitimate business purposes.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-4">7. Your Rights</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                Depending on your location, you may have certain rights regarding your personal information:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2">
                <li><strong>Access:</strong> Request a copy of the personal information we hold about you</li>
                <li><strong>Correction:</strong> Request correction of inaccurate personal information</li>
                <li><strong>Deletion:</strong> Request deletion of your personal information</li>
                <li><strong>Portability:</strong> Request a copy of your data in a portable format</li>
                <li><strong>Opt-out:</strong> Unsubscribe from marketing communications</li>
              </ul>
              <p className="text-muted-foreground leading-relaxed mt-4">
                To exercise any of these rights, please contact us at{" "}
                <a href="mailto:support@bakeriq.app" className="text-primary hover:underline">
                  support@bakeriq.app
                </a>
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-4">8. Cookies</h2>
              <p className="text-muted-foreground leading-relaxed">
                We use cookies and similar technologies to maintain your session, remember your preferences, and understand how you use the Service. These are essential for the Service to function properly.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-4">9. Children's Privacy</h2>
              <p className="text-muted-foreground leading-relaxed">
                The Service is not intended for use by children under 13 years of age. We do not knowingly collect personal information from children under 13. If we learn we have collected such information, we will delete it promptly.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-4">10. Changes to This Policy</h2>
              <p className="text-muted-foreground leading-relaxed">
                We may update this Privacy Policy from time to time. We will notify you of any material changes by posting the new policy on this page and updating the "Last updated" date. Your continued use of the Service after any changes constitutes acceptance of the updated policy.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-4">11. Contact Us</h2>
              <p className="text-muted-foreground leading-relaxed">
                If you have any questions about this Privacy Policy or our data practices, please contact us at{" "}
                <a href="mailto:support@bakeriq.app" className="text-primary hover:underline">
                  support@bakeriq.app
                </a>
              </p>
            </section>
          </div>
        </div>
      </main>

      <footer className="py-12 border-t">
        <div className="container max-w-7xl mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <Link href="/">
              <div className="flex items-center gap-2 cursor-pointer" data-testid="footer-link-home-logo">
                <Cake className="h-6 w-6 text-primary" />
                <span className="font-semibold">BakerIQ</span>
              </div>
            </Link>
            <div className="flex items-center gap-6 flex-wrap justify-center">
              <Link href="/help">
                <span className="text-sm text-muted-foreground hover:text-foreground" data-testid="footer-link-help">Help</span>
              </Link>
              <Link href="/faq">
                <span className="text-sm text-muted-foreground hover:text-foreground" data-testid="footer-link-faq">FAQ</span>
              </Link>
              <Link href="/terms">
                <span className="text-sm text-muted-foreground hover:text-foreground" data-testid="footer-link-terms">Terms</span>
              </Link>
              <Link href="/privacy">
                <span className="text-sm text-muted-foreground hover:text-foreground" data-testid="footer-link-privacy">Privacy</span>
              </Link>
              <a href="mailto:support@bakeriq.app" className="text-sm text-muted-foreground hover:text-foreground" data-testid="footer-link-support">
                Contact
              </a>
            </div>
            <p className="text-sm text-muted-foreground">
              Made with love for cake bakers everywhere
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

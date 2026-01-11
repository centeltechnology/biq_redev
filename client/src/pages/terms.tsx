import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Cake, ArrowLeft } from "lucide-react";

export default function TermsPage() {
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
            <h1 className="text-3xl md:text-4xl font-bold mb-4">Terms of Service</h1>
            <p className="text-muted-foreground">Last updated: January 2025</p>
          </div>

          <div className="prose prose-neutral dark:prose-invert max-w-none space-y-8">
            <section>
              <h2 className="text-xl font-semibold mb-4">1. Acceptance of Terms</h2>
              <p className="text-muted-foreground leading-relaxed">
                By accessing or using BakerIQ ("the Service"), you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use the Service. We reserve the right to update these terms at any time, and your continued use of the Service constitutes acceptance of any changes.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-4">2. Description of Service</h2>
              <p className="text-muted-foreground leading-relaxed">
                BakerIQ is a lead capture and quote management platform designed for custom cake bakers and bakery businesses. The Service provides tools for creating public pricing calculators, managing customer leads, generating quotes, and tracking orders.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-4">3. Account Registration</h2>
              <p className="text-muted-foreground leading-relaxed">
                To use certain features of the Service, you must register for an account. You agree to provide accurate, current, and complete information during registration and to update such information to keep it accurate. You are responsible for safeguarding your password and for all activities that occur under your account.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-4">4. Subscription Plans and Billing</h2>
              <p className="text-muted-foreground leading-relaxed">
                BakerIQ offers free and paid subscription plans. Paid plans are billed monthly through Stripe. You may cancel your subscription at any time through your account settings. Refunds are handled on a case-by-case basis. Quote limits and feature access vary by plan as described on our pricing page.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-4">5. Acceptable Use</h2>
              <p className="text-muted-foreground leading-relaxed">
                You agree to use the Service only for lawful purposes and in accordance with these Terms. You agree not to: (a) use the Service in any way that violates applicable laws; (b) attempt to gain unauthorized access to the Service or its systems; (c) interfere with or disrupt the Service; (d) use the Service to send spam or unsolicited communications; or (e) impersonate any person or entity.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-4">6. Your Content</h2>
              <p className="text-muted-foreground leading-relaxed">
                You retain ownership of all content you submit to the Service, including business information, pricing data, customer records, and quotes. You grant BakerIQ a limited license to use, store, and display your content solely for the purpose of providing the Service. You are responsible for ensuring you have the right to use and share any content you upload.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-4">7. Intellectual Property</h2>
              <p className="text-muted-foreground leading-relaxed">
                The Service and its original content, features, and functionality are owned by BakerIQ and are protected by copyright, trademark, and other intellectual property laws. You may not copy, modify, distribute, or reverse engineer any part of the Service without our written consent.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-4">8. Disclaimer of Warranties</h2>
              <p className="text-muted-foreground leading-relaxed">
                THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED. WE DO NOT WARRANT THAT THE SERVICE WILL BE UNINTERRUPTED, ERROR-FREE, OR SECURE. YOUR USE OF THE SERVICE IS AT YOUR OWN RISK.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-4">9. Limitation of Liability</h2>
              <p className="text-muted-foreground leading-relaxed">
                TO THE MAXIMUM EXTENT PERMITTED BY LAW, BAKERIQ SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING LOSS OF PROFITS, DATA, OR BUSINESS OPPORTUNITIES, ARISING FROM YOUR USE OF THE SERVICE.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-4">10. Termination</h2>
              <p className="text-muted-foreground leading-relaxed">
                We may terminate or suspend your account and access to the Service at our sole discretion, without prior notice, for conduct that we believe violates these Terms or is harmful to other users, us, or third parties. Upon termination, your right to use the Service will immediately cease.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-4">11. Governing Law</h2>
              <p className="text-muted-foreground leading-relaxed">
                These Terms shall be governed by and construed in accordance with the laws of the United States, without regard to its conflict of law provisions.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-4">12. Contact Us</h2>
              <p className="text-muted-foreground leading-relaxed">
                If you have any questions about these Terms of Service, please contact us at{" "}
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

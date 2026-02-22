import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Share2, MessageSquareText, FileText, CreditCard, ArrowRight, Mail, HelpCircle } from "lucide-react";

function WorkflowStep({ step, icon, title, description }: { step: number; icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="text-center" data-testid={`lashell-workflow-step-${step}`}>
      <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
        {icon}
      </div>
      <h3 className="text-base font-semibold mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
    </div>
  );
}

export default function LaShellPage() {
  const scrollToWorkflow = () => {
    document.getElementById("workflow-section")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-background">
      <section className="py-16 md:py-24" data-testid="section-lashell-hero">
        <div className="container max-w-7xl mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 md:gap-16 items-center">
            <div className="space-y-6">
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight leading-tight" data-testid="text-lashell-headline">
                The system I recommend for serious bakers.
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground leading-relaxed" data-testid="text-lashell-subheadline">
                If you're learning from me and planning to sell professionally, you need structure — not DMs.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <Link href="/signup">
                  <Button size="lg" className="w-full sm:w-auto" data-testid="button-lashell-start-free">
                    Start Free
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
                <Button
                  size="lg"
                  variant="outline"
                  className="w-full sm:w-auto"
                  onClick={scrollToWorkflow}
                  data-testid="button-lashell-see-how"
                >
                  See How It Works
                </Button>
              </div>
              <p className="text-sm text-muted-foreground" data-testid="text-lashell-trust-line">
                Free to start. You only pay when you process.
              </p>
            </div>

            <div className="space-y-6">
              <div className="aspect-[4/5] max-w-sm mx-auto bg-muted rounded-2xl flex items-center justify-center overflow-hidden" data-testid="img-lashell-photo">
                <div className="text-center text-muted-foreground p-8">
                  <div className="h-24 w-24 rounded-full bg-muted-foreground/10 flex items-center justify-center mx-auto mb-4">
                    <span className="text-3xl font-bold text-muted-foreground/40">LH</span>
                  </div>
                  <p className="text-sm">lashell.jpg</p>
                </div>
              </div>
              <blockquote className="border-l-4 border-primary pl-4 py-2" data-testid="text-lashell-quote">
                <p className="text-base italic text-foreground/90 leading-relaxed">
                  "I don't believe in running a business through DMs. If you're serious about selling, you need a structured system."
                </p>
                <footer className="mt-2 text-sm font-medium text-muted-foreground">
                  — LaShell Howard
                </footer>
              </blockquote>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 md:py-20 bg-muted/30" data-testid="section-lashell-baton">
        <div className="container max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6" data-testid="text-baton-title">
            Built for serious baking businesses.
          </h2>
          <div className="space-y-4 text-lg text-muted-foreground leading-relaxed">
            <p>
              LaShell recommends structure.<br />
              BakerIQ provides the system.
            </p>
            <p>
              From lead capture to deposits and revenue tracking, everything runs through one professional workflow.
            </p>
          </div>
        </div>
      </section>

      <section id="workflow-section" className="py-20 md:py-28 bg-background" data-testid="section-lashell-workflow">
        <div className="container max-w-7xl mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold mb-16 text-center" data-testid="text-workflow-title">
            From inquiry to deposit — one system.
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-10 max-w-5xl mx-auto">
            <WorkflowStep
              step={1}
              icon={<Share2 className="h-6 w-6 text-primary" />}
              title="Share your order page"
              description="One link. Customers see your pricing and submit a structured request."
            />
            <WorkflowStep
              step={2}
              icon={<MessageSquareText className="h-6 w-6 text-primary" />}
              title="Customer submits a structured request"
              description="No more back-and-forth DMs. Every detail captured upfront."
            />
            <WorkflowStep
              step={3}
              icon={<FileText className="h-6 w-6 text-primary" />}
              title="Send a professional quote"
              description="Itemized pricing. One click to send. Customer sees it instantly."
            />
            <WorkflowStep
              step={4}
              icon={<CreditCard className="h-6 w-6 text-primary" />}
              title="Collect deposits through Stripe"
              description="Secure payments processed directly to your account."
            />
          </div>
        </div>
      </section>

      <section className="py-16 md:py-20 bg-muted/30" data-testid="section-lashell-pricing">
        <div className="container max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4" data-testid="text-pricing-title">
            Free to start. Built to scale.
          </h2>
          <div className="space-y-4 text-lg text-muted-foreground leading-relaxed mb-10">
            <p>
              You don't pay for logging in.<br />
              You only pay when you process payments through your quotes.
            </p>
          </div>
          <div className="grid sm:grid-cols-3 gap-6 max-w-lg mx-auto mb-10">
            <div className="bg-background border rounded-xl p-6 text-center" data-testid="card-plan-free">
              <p className="text-sm font-medium text-muted-foreground mb-1">Free</p>
              <p className="text-3xl font-bold text-primary">7%</p>
            </div>
            <div className="bg-background border rounded-xl p-6 text-center" data-testid="card-plan-basic">
              <p className="text-sm font-medium text-muted-foreground mb-1">Basic</p>
              <p className="text-3xl font-bold text-primary">5%</p>
            </div>
            <div className="bg-background border rounded-xl p-6 text-center" data-testid="card-plan-pro">
              <p className="text-sm font-medium text-muted-foreground mb-1">Pro</p>
              <p className="text-3xl font-bold text-primary">3%</p>
            </div>
          </div>
          <Link href="/signup">
            <Button size="lg" data-testid="button-lashell-pricing-cta">
              Start Free
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>

      <section className="py-12 md:py-16 bg-background" data-testid="section-lashell-support">
        <div className="container max-w-2xl mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-3">
            <HelpCircle className="h-5 w-5 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Questions about setup or account support?
            </p>
          </div>
          <p className="text-sm text-muted-foreground">
            Visit our{" "}
            <Link href="/help" className="text-primary hover:underline" data-testid="link-lashell-help">
              Help Center
            </Link>
            {" "}or contact{" "}
            <a href="mailto:support@bakeriq.app" className="text-primary hover:underline" data-testid="link-lashell-email">
              support@bakeriq.app
            </a>
            .
          </p>
        </div>
      </section>
    </div>
  );
}

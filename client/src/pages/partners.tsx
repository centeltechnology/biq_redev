import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Link } from "wouter";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  DollarSign,
  TrendingUp,
  Users,
  Link2,
  CheckCircle2,
  ArrowRight,
  Cake,
  Calculator,
  FileText,
  CreditCard,
} from "lucide-react";

export default function PartnersPage() {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    socialMedia: "",
    followers: "",
    niche: "",
    message: "",
  });
  const [submitted, setSubmitted] = useState(false);

  const submitMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/affiliate-requests", formData);
      return res.json();
    },
    onSuccess: () => {
      setSubmitted(true);
      toast({ title: "Application submitted!" });
    },
    onError: () => {
      toast({ title: "Something went wrong. Please try again.", variant: "destructive" });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.socialMedia) {
      toast({ title: "Please fill in all required fields", variant: "destructive" });
      return;
    }
    submitMutation.mutate();
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <Link href="/">
            <span className="flex items-center gap-2 font-semibold text-lg cursor-pointer" data-testid="link-home">
              <Cake className="h-5 w-5" />
              BakerIQ
            </span>
          </Link>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Link href="/login">
              <Button variant="outline" data-testid="link-login">Log In</Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <Badge variant="secondary" className="mb-4">Founding Partners</Badge>
          <h1 className="text-4xl font-bold tracking-tight mb-4" data-testid="text-partners-title">
            Turn your baking audience into recurring income.
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-3">
            Bakers are tired of pricing in DMs, chasing deposits, and looking unprofessional. BakerIQ gives them a pricing calculator, professional quotes, and Stripe payments. Share your link and earn on every new subscription.
          </p>
          <p className="text-sm text-muted-foreground max-w-xl mx-auto mb-2">
            We're onboarding a limited number of founding partners.
          </p>
          <p className="text-xs text-muted-foreground max-w-xl mx-auto">
            Example: 25 Pro subscribers = ~$50/month in commission for 3 months.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3 mb-16">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-md bg-green-50 dark:bg-green-950 shrink-0">
                  <DollarSign className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">20% for 3 Months</h3>
                  <p className="text-sm text-muted-foreground">
                    Earn 20% of subscription revenue on every baker who signs up through your link — paid on their first 3 months of Basic or Pro.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-md bg-blue-50 dark:bg-blue-950 shrink-0">
                  <Link2 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Custom Link, 45-Day Cookie</h3>
                  <p className="text-sm text-muted-foreground">
                    Drop your link in your bio, video description, or pinned comment. A 45-day cookie means you get credit even if they sign up later.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-md bg-purple-50 dark:bg-purple-950 shrink-0">
                  <TrendingUp className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Full Transparency</h3>
                  <p className="text-sm text-muted-foreground">
                    Track every click, signup, and commission in real time from your partner dashboard. No guesswork.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="mb-16">
          <h2 className="text-2xl font-bold text-center mb-8">How It Works</h2>
          <div className="grid gap-6 md:grid-cols-4">
            {[
              { step: "1", title: "Apply", desc: "Fill out the form below with your platform, audience, and how you'd introduce BakerIQ." },
              { step: "2", title: "Get Approved", desc: "Approved partners get a personal dashboard with a custom referral link you can edit." },
              { step: "3", title: "Share", desc: "Add your link to your bio, videos, posts, or wherever you connect with bakers." },
              { step: "4", title: "Earn", desc: "When a baker signs up through your link and subscribes to Basic or Pro, you earn 20% for their first 3 months." },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center mx-auto mb-3 text-sm font-bold">
                  {item.step}
                </div>
                <h3 className="font-semibold mb-1">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="mb-16 max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-6">Why Bakers Love BakerIQ</h2>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="flex items-start gap-2">
              <div className="p-1.5 rounded-md bg-muted shrink-0 mt-0.5">
                <Calculator className="h-4 w-4 text-muted-foreground" />
              </div>
              <span className="text-sm">Pricing calculator link they can share with customers</span>
            </div>
            <div className="flex items-start gap-2">
              <div className="p-1.5 rounded-md bg-muted shrink-0 mt-0.5">
                <FileText className="h-4 w-4 text-muted-foreground" />
              </div>
              <span className="text-sm">Professional quotes with deposit requests built in</span>
            </div>
            <div className="flex items-start gap-2">
              <div className="p-1.5 rounded-md bg-muted shrink-0 mt-0.5">
                <CreditCard className="h-4 w-4 text-muted-foreground" />
              </div>
              <span className="text-sm">Online payments through Stripe Connect — no chasing deposits</span>
            </div>
          </div>
        </div>

        <div className="mb-16">
          <h2 className="text-2xl font-bold text-center mb-2">Who Is This For?</h2>
          <p className="text-center text-muted-foreground mb-8">Best fit for educators and creators whose audience asks about pricing, deposits, and running a baking business.</p>
          <div className="grid gap-4 md:grid-cols-2 max-w-3xl mx-auto">
            {[
              "Baking content creators on Instagram, TikTok, or YouTube",
              "Cake decorating educators and course creators",
              "Baking supply shops and e-commerce owners",
              "Business coaches for cottage food and home bakers",
              "Wedding and event planners who work with bakers",
              "Baking community group admins and moderators",
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5 shrink-0" />
                <span className="text-sm">{item}</span>
              </div>
            ))}
          </div>
        </div>

        <Card className="max-w-2xl mx-auto" id="apply">
          <CardHeader>
            <CardTitle data-testid="text-apply-title">
              {submitted ? "Application Submitted" : "Apply to the Founding Partners Program"}
            </CardTitle>
            <CardDescription>
              {submitted
                ? "Thanks for your interest! We'll review your application and get back to you within a few business days."
                : "Share your primary platform, audience size, and how you plan to introduce BakerIQ. We review applications within a few business days."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {submitted ? (
              <div className="text-center py-8">
                <CheckCircle2 className="h-12 w-12 text-green-600 dark:text-green-400 mx-auto mb-4" />
                <p className="text-muted-foreground mb-4">
                  We'll reach out to the email you provided once your application has been reviewed.
                </p>
                <Link href="/">
                  <Button variant="outline" data-testid="button-back-home">
                    <ArrowRight className="h-4 w-4 mr-2" />
                    Back to Home
                  </Button>
                </Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-1 block">Name *</label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Your name"
                    data-testid="input-affiliate-name"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Email *</label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="you@example.com"
                    data-testid="input-affiliate-email"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Primary Social Media Link *</label>
                  <Input
                    value={formData.socialMedia}
                    onChange={(e) => setFormData(prev => ({ ...prev, socialMedia: e.target.value }))}
                    placeholder="https://instagram.com/yourhandle"
                    data-testid="input-affiliate-social"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Approximate Followers / Audience Size</label>
                  <Input
                    value={formData.followers}
                    onChange={(e) => setFormData(prev => ({ ...prev, followers: e.target.value }))}
                    placeholder="e.g. 5,000"
                    data-testid="input-affiliate-followers"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Your Niche / Focus Area</label>
                  <Input
                    value={formData.niche}
                    onChange={(e) => setFormData(prev => ({ ...prev, niche: e.target.value }))}
                    placeholder="e.g. Cake decorating, home baking, wedding cakes"
                    data-testid="input-affiliate-niche"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">How would you introduce BakerIQ to your audience?</label>
                  <Textarea
                    value={formData.message}
                    onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
                    placeholder="Tell us your primary platform, content style, and how you'd share BakerIQ..."
                    rows={4}
                    data-testid="input-affiliate-message"
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full"
                  disabled={submitMutation.isPending}
                  data-testid="button-submit-affiliate-request"
                >
                  {submitMutation.isPending ? "Submitting..." : "Submit Application"}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>

        <div className="max-w-2xl mx-auto mt-8 p-4 rounded-md bg-muted/50 border">
          <p className="text-sm text-muted-foreground text-center">
            <strong className="text-foreground">Already a BakerIQ user?</strong> This Partners program is for creators and educators earning commission. If you're a baker, use your in-app referral link instead to earn free months and Quick Quote access.{" "}
            <Link href="/login">
              <span className="underline cursor-pointer">Log in</span>
            </Link>{" "}
            and visit your Refer a Friend page.
          </p>
        </div>
      </main>

      <footer className="border-t py-6 mt-8">
        <div className="max-w-5xl mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>BakerIQ &mdash; Pricing & Quote Tool for Custom Bakers</p>
        </div>
      </footer>
    </div>
  );
}

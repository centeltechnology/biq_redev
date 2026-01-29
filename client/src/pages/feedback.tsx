import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  Gift, 
  Sparkles, 
  CheckCircle2, 
  Cake, 
  ArrowRight,
  MessageSquare,
  Clock,
  Loader2
} from "lucide-react";
import type { Baker } from "@shared/schema";

const SIGNUP_REASONS = [
  { value: "tired_of_dms", label: "Tired of answering 'how much?' DMs" },
  { value: "need_organization", label: "Need to organize my orders better" },
  { value: "want_professional_quotes", label: "Want to send professional quotes" },
  { value: "saw_recommendation", label: "Someone recommended BakerIQ" },
  { value: "curious", label: "Just curious to check it out" },
];

const SETUP_BLOCKERS = [
  { value: "no_time", label: "Haven't had time to set it up" },
  { value: "seemed_complicated", label: "It seemed complicated at first" },
  { value: "not_sure_how", label: "Wasn't sure where to start" },
  { value: "waiting_for_orders", label: "Waiting until I have more orders" },
  { value: "already_setup", label: "I already set it up!" },
];

const VALUABLE_FEATURES = [
  { value: "public_calculator", label: "Public pricing calculator" },
  { value: "quote_builder", label: "Professional quote builder" },
  { value: "lead_tracking", label: "Lead & customer tracking" },
  { value: "order_calendar", label: "Order calendar view" },
  { value: "all_of_them", label: "All of them equally" },
];

const BUSINESS_STAGES = [
  { value: "just_starting", label: "Just starting out (0-10 orders/month)" },
  { value: "growing", label: "Growing steadily (10-30 orders/month)" },
  { value: "established", label: "Established business (30+ orders/month)" },
  { value: "side_hustle", label: "Side hustle alongside other work" },
];

export default function FeedbackPage() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [submitted, setSubmitted] = useState(false);
  
  const [signupReason, setSignupReason] = useState("");
  const [setupBlocker, setSetupBlocker] = useState("");
  const [mostValuableFeature, setMostValuableFeature] = useState("");
  const [businessStage, setBusinessStage] = useState("");
  const [additionalFeedback, setAdditionalFeedback] = useState("");

  const { data: session, isLoading: sessionLoading } = useQuery<{ baker: Baker } | null>({
    queryKey: ["/api/auth/session"],
  });

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!sessionLoading && !session?.baker) {
      navigate("/login?redirect=/feedback");
    }
  }, [session, sessionLoading, navigate]);

  const submitMutation = useMutation({
    mutationFn: async (data: {
      signupReason: string;
      setupBlocker: string;
      mostValuableFeature: string;
      businessStage: string;
      additionalFeedback: string;
    }) => {
      const response = await apiRequest("POST", "/api/survey/submit", data);
      return response.json();
    },
    onSuccess: () => {
      setSubmitted(true);
      toast({
        title: "Thank you for your feedback!",
        description: "Your free month of Pro has been activated.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error submitting survey",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = () => {
    if (!signupReason || !setupBlocker || !mostValuableFeature || !businessStage) {
      toast({
        title: "Please answer all questions",
        description: "We need your input on all questions to unlock your free Pro month.",
        variant: "destructive",
      });
      return;
    }
    
    submitMutation.mutate({
      signupReason,
      setupBlocker,
      mostValuableFeature,
      businessStage,
      additionalFeedback,
    });
  };

  // Show loading while checking session
  if (sessionLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Don't render if not authenticated (will redirect)
  if (!session?.baker) {
    return null;
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-primary/10 flex items-center justify-center p-4">
        <Card className="max-w-lg w-full text-center">
          <CardContent className="pt-12 pb-8">
            <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-6">
              <CheckCircle2 className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-2xl font-bold mb-2">You're all set!</h1>
            <p className="text-muted-foreground mb-6">
              Your feedback means the world to us. We've activated your free month of Pro access - enjoy all the premium features!
            </p>
            <div className="bg-primary/5 rounded-lg p-4 mb-6">
              <div className="flex items-center justify-center gap-2 text-primary font-medium">
                <Sparkles className="h-5 w-5" />
                <span>Pro Access Active</span>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                Valid for 30 days from today
              </p>
            </div>
            <Button onClick={() => navigate("/dashboard")} className="gap-2" data-testid="button-go-dashboard">
              Go to Dashboard
              <ArrowRight className="h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-primary/10">
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Cake className="h-8 w-8 text-primary" />
            <span className="text-xl font-bold">BakerIQ</span>
          </div>
          {session?.baker && (
            <span className="text-sm text-muted-foreground">
              Hey, {session.baker.businessName}!
            </span>
          )}
        </div>
      </header>

      <main className="container max-w-2xl mx-auto px-4 py-12">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary mb-4">
            <Gift className="h-4 w-4" />
            <span className="text-sm font-medium">Get a free month of Pro</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-4">
            Help us make BakerIQ better
          </h1>
          <p className="text-lg text-muted-foreground max-w-lg mx-auto">
            Share your thoughts in 2 minutes and unlock a free month of Pro - no strings attached.
          </p>
        </div>

        <Card className="mb-8">
          <CardHeader className="flex flex-row items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Clock className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">4 quick questions</CardTitle>
              <CardDescription>Takes about 2 minutes to complete</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-8">
            <div className="space-y-4">
              <Label className="text-base font-medium">
                1. What made you sign up for BakerIQ?
              </Label>
              <RadioGroup value={signupReason} onValueChange={setSignupReason}>
                {SIGNUP_REASONS.map((option) => (
                  <div key={option.value} className="flex items-center space-x-3 p-3 rounded-lg border hover-elevate cursor-pointer" onClick={() => setSignupReason(option.value)}>
                    <RadioGroupItem value={option.value} id={`signup-${option.value}`} data-testid={`radio-signup-${option.value}`} />
                    <Label htmlFor={`signup-${option.value}`} className="cursor-pointer flex-1">
                      {option.label}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>

            <div className="space-y-4">
              <Label className="text-base font-medium">
                2. What's held you back from setting up your calculator?
              </Label>
              <RadioGroup value={setupBlocker} onValueChange={setSetupBlocker}>
                {SETUP_BLOCKERS.map((option) => (
                  <div key={option.value} className="flex items-center space-x-3 p-3 rounded-lg border hover-elevate cursor-pointer" onClick={() => setSetupBlocker(option.value)}>
                    <RadioGroupItem value={option.value} id={`blocker-${option.value}`} data-testid={`radio-blocker-${option.value}`} />
                    <Label htmlFor={`blocker-${option.value}`} className="cursor-pointer flex-1">
                      {option.label}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>

            <div className="space-y-4">
              <Label className="text-base font-medium">
                3. Which feature interests you most?
              </Label>
              <RadioGroup value={mostValuableFeature} onValueChange={setMostValuableFeature}>
                {VALUABLE_FEATURES.map((option) => (
                  <div key={option.value} className="flex items-center space-x-3 p-3 rounded-lg border hover-elevate cursor-pointer" onClick={() => setMostValuableFeature(option.value)}>
                    <RadioGroupItem value={option.value} id={`feature-${option.value}`} data-testid={`radio-feature-${option.value}`} />
                    <Label htmlFor={`feature-${option.value}`} className="cursor-pointer flex-1">
                      {option.label}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>

            <div className="space-y-4">
              <Label className="text-base font-medium">
                4. Where is your baking business at right now?
              </Label>
              <RadioGroup value={businessStage} onValueChange={setBusinessStage}>
                {BUSINESS_STAGES.map((option) => (
                  <div key={option.value} className="flex items-center space-x-3 p-3 rounded-lg border hover-elevate cursor-pointer" onClick={() => setBusinessStage(option.value)}>
                    <RadioGroupItem value={option.value} id={`stage-${option.value}`} data-testid={`radio-stage-${option.value}`} />
                    <Label htmlFor={`stage-${option.value}`} className="cursor-pointer flex-1">
                      {option.label}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>
          </CardContent>
        </Card>

        <Card className="mb-8">
          <CardHeader className="flex flex-row items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <MessageSquare className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">Anything else? (optional)</CardTitle>
              <CardDescription>Share any thoughts, ideas, or frustrations</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <Textarea
              placeholder="What would make BakerIQ perfect for your business?"
              value={additionalFeedback}
              onChange={(e) => setAdditionalFeedback(e.target.value)}
              className="min-h-[120px] resize-none"
              data-testid="textarea-feedback"
            />
          </CardContent>
        </Card>

        <div className="flex flex-col items-center gap-4">
          <Button 
            size="lg" 
            className="gap-2 text-lg px-8" 
            onClick={handleSubmit}
            disabled={submitMutation.isPending}
            data-testid="button-submit-survey"
          >
            {submitMutation.isPending ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <Gift className="h-5 w-5" />
                Submit & Get Free Pro Month
              </>
            )}
          </Button>
          <p className="text-sm text-muted-foreground text-center">
            Your Pro access will be activated immediately after submitting
          </p>
        </div>
      </main>
    </div>
  );
}

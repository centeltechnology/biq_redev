import { useState, useEffect } from "react";
import Joyride, { CallBackProps, STATUS, Step, ACTIONS, EVENTS } from "react-joyride";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Sparkles, ArrowRight, X } from "lucide-react";

const tourSteps: Step[] = [
  {
    target: '[data-testid="nav-pricing"]',
    content: "Start here! Set up your pricing so your public calculator shows accurate estimates to customers.",
    title: "Set Your Prices",
    disableBeacon: true,
    placement: "right",
  },
  {
    target: '[data-testid="nav-price calculator"]',
    content: "Need help figuring out what to charge? Use this tool to calculate prices based on your costs and desired profit.",
    title: "Price Calculator",
    disableBeacon: true,
    placement: "right",
  },
  {
    target: '[data-testid="nav-leads"]',
    content: "When customers use your calculator and submit inquiries, they'll appear here as new leads.",
    title: "Manage Leads",
    disableBeacon: true,
    placement: "right",
  },
  {
    target: '[data-testid="nav-quotes"]',
    content: "Convert leads into detailed quotes. Send them to customers with just a click!",
    title: "Create Quotes",
    disableBeacon: true,
    placement: "right",
  },
  {
    target: '[data-testid="nav-calendar"]',
    content: "Track your upcoming orders and event dates. Never miss a delivery!",
    title: "Order Calendar",
    disableBeacon: true,
    placement: "right",
  },
  {
    target: '[data-testid="nav-settings"]',
    content: "Add your business details, payment info, and social media links here.",
    title: "Your Settings",
    disableBeacon: true,
    placement: "right",
  },
];

interface OnboardingTourProps {
  tourStatus: string;
}

export function OnboardingTour({ tourStatus }: OnboardingTourProps) {
  const [showWelcome, setShowWelcome] = useState(false);
  const [runTour, setRunTour] = useState(false);
  const [startingTour, setStartingTour] = useState(false);
  const [, setLocation] = useLocation();

  const updateTourMutation = useMutation({
    mutationFn: async (status: string) => {
      const res = await apiRequest("PATCH", "/api/baker/onboarding-tour", { status });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/session"] });
    },
  });

  useEffect(() => {
    if (tourStatus === "pending") {
      setShowWelcome(true);
    }
  }, [tourStatus]);

  const handleStartTour = () => {
    setStartingTour(true);
    setShowWelcome(false);
    setTimeout(() => {
      setRunTour(true);
      setStartingTour(false);
    }, 300);
  };

  const handleSkipTour = () => {
    setShowWelcome(false);
    updateTourMutation.mutate("skipped");
  };

  const handleJoyrideCallback = (data: CallBackProps) => {
    const { status, action, type } = data;
    
    if (status === STATUS.FINISHED) {
      setRunTour(false);
      updateTourMutation.mutate("completed");
    } else if (status === STATUS.SKIPPED || (action === ACTIONS.CLOSE && type === EVENTS.STEP_AFTER)) {
      setRunTour(false);
      updateTourMutation.mutate("skipped");
    }
  };

  return (
    <>
      <Dialog open={showWelcome} onOpenChange={(open) => {
        if (!open && !startingTour) {
          handleSkipTour();
        }
      }}>
        <DialogContent className="sm:max-w-md" data-testid="dialog-welcome-tour">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Welcome to BakerIQ!
            </DialogTitle>
            <DialogDescription className="pt-2">
              Let's take a quick tour to help you get started. We'll show you where to set up your pricing, 
              manage leads, and send quotes to your customers.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="bg-muted/50 rounded-lg p-4 space-y-2">
              <p className="text-sm font-medium">In about 30 seconds, you'll learn:</p>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• How to set up your pricing</li>
                <li>• Where to find new customer leads</li>
                <li>• How to create and send quotes</li>
                <li>• How to track your orders</li>
              </ul>
            </div>
          </div>
          <DialogFooter className="flex gap-2 sm:gap-0">
            <Button
              variant="ghost"
              onClick={handleSkipTour}
              data-testid="button-skip-tour"
            >
              <X className="h-4 w-4 mr-1" />
              Skip for now
            </Button>
            <Button onClick={handleStartTour} data-testid="button-start-tour">
              Start Tour
              <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Joyride
        steps={tourSteps}
        run={runTour}
        continuous
        showSkipButton
        showProgress
        callback={handleJoyrideCallback}
        styles={{
          options: {
            primaryColor: "hsl(var(--primary))",
            zIndex: 10000,
          },
          tooltip: {
            borderRadius: "8px",
            padding: "16px",
          },
          tooltipContainer: {
            textAlign: "left",
          },
          tooltipTitle: {
            fontSize: "16px",
            fontWeight: 600,
            marginBottom: "8px",
          },
          tooltipContent: {
            fontSize: "14px",
            padding: 0,
          },
          buttonNext: {
            backgroundColor: "hsl(var(--primary))",
            borderRadius: "6px",
            padding: "8px 16px",
            fontSize: "14px",
          },
          buttonBack: {
            color: "hsl(var(--muted-foreground))",
            marginRight: "8px",
          },
          buttonSkip: {
            color: "hsl(var(--muted-foreground))",
          },
          spotlight: {
            borderRadius: "8px",
          },
        }}
        locale={{
          back: "Back",
          close: "Close",
          last: "Done",
          next: "Next",
          skip: "Skip tour",
        }}
      />
    </>
  );
}

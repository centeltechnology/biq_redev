import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Cookie } from "lucide-react";
import { Link } from "wouter";

const COOKIE_CONSENT_KEY = "bakeriq_cookie_consent";

export function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem(COOKIE_CONSENT_KEY);
    if (!consent) {
      const timer = setTimeout(() => setVisible(true), 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  function accept() {
    localStorage.setItem(COOKIE_CONSENT_KEY, "accepted");
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-[9999] border-t bg-card p-4 shadow-lg"
      data-testid="banner-cookie-consent"
    >
      <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <Cookie className="h-5 w-5 shrink-0 text-foreground" />
          <span>
            This site uses cookies for login sessions and referral tracking.
            See our{" "}
            <Link
              href="/privacy"
              className="underline text-foreground"
              data-testid="link-cookie-privacy"
            >
              Privacy Policy
            </Link>{" "}
            for details.
          </span>
        </div>
        <Button
          size="sm"
          onClick={accept}
          data-testid="button-cookie-accept"
        >
          Got it
        </Button>
      </div>
    </div>
  );
}

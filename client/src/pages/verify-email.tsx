import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";
import { usePageTitle } from "@/hooks/usePageTitle";

export default function VerifyEmail() {
  usePageTitle("Verify Email");
  const [, setLocation] = useLocation();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");

    if (!token) {
      setStatus("error");
      setMessage("No verification token provided.");
      return;
    }

    fetch(`/api/auth/verify-email?token=${token}`)
      .then(async (res) => {
        const data = await res.json();
        if (res.ok) {
          setStatus("success");
          setMessage(data.message || "Your email has been verified successfully!");
        } else {
          setStatus("error");
          setMessage(data.message || "Failed to verify email. The link may be expired or invalid.");
        }
      })
      .catch(() => {
        setStatus("error");
        setMessage("An error occurred while verifying your email.");
      });
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Email Verification</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-6">
          {status === "loading" && (
            <>
              <Loader2 className="h-16 w-16 text-primary animate-spin" data-testid="icon-loading" />
              <p className="text-muted-foreground">Verifying your email...</p>
            </>
          )}
          
          {status === "success" && (
            <>
              <CheckCircle className="h-16 w-16 text-green-500" data-testid="icon-success" />
              <p className="text-center text-muted-foreground">{message}</p>
              <Button 
                onClick={() => setLocation("/login")}
                className="w-full"
                data-testid="button-go-to-login"
              >
                Go to Login
              </Button>
            </>
          )}
          
          {status === "error" && (
            <>
              <XCircle className="h-16 w-16 text-destructive" data-testid="icon-error" />
              <p className="text-center text-muted-foreground">{message}</p>
              <div className="flex gap-3 w-full">
                <Button 
                  variant="outline"
                  onClick={() => setLocation("/")}
                  className="flex-1"
                  data-testid="button-go-home"
                >
                  Go Home
                </Button>
                <Button 
                  onClick={() => setLocation("/login")}
                  className="flex-1"
                  data-testid="button-go-to-login"
                >
                  Login
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

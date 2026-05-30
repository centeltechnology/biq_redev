import { Download, Smartphone, Share, X, Check } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { usePwaInstall } from "@/hooks/use-pwa-install";

const IOS_HINT = "On iPhone: tap Share, then Add to Home Screen.";

export function InstallPromptCard() {
  const { canInstall, canPrompt, isIos, dismissed, promptInstall, dismiss } = usePwaInstall();

  if (!canInstall || dismissed) return null;

  return (
    <Card className="border-primary/30 bg-primary/5" data-testid="card-install-prompt">
      <CardContent className="py-5">
        <div className="flex items-start gap-3">
          <div className="flex items-center justify-center h-10 w-10 rounded-md bg-primary/10 shrink-0">
            <Smartphone className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-3">
              <h3 className="font-semibold text-base" data-testid="text-install-title">
                Add BakerIQ to your phone
              </h3>
              <Button
                variant="ghost"
                size="icon"
                onClick={dismiss}
                className="h-6 w-6 -mt-1 -mr-1 shrink-0"
                data-testid="button-install-dismiss"
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
            <p className="text-sm text-muted-foreground mt-0.5">
              Open quotes, requests, and your order page faster from your home screen.
            </p>
            {canPrompt ? (
              <div className="flex flex-wrap items-center gap-2 mt-3">
                <Button onClick={() => promptInstall()} data-testid="button-install-app">
                  <Download className="mr-2 h-4 w-4" />
                  Install BakerIQ
                </Button>
                <Button variant="ghost" size="sm" onClick={dismiss} data-testid="button-install-later">
                  Maybe later
                </Button>
              </div>
            ) : isIos ? (
              <p
                className="text-sm text-muted-foreground mt-3 flex items-center gap-1.5"
                data-testid="text-install-ios-hint"
              >
                <Share className="h-4 w-4 shrink-0" />
                {IOS_HINT}
              </p>
            ) : null}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function InstallSettingsSection() {
  const { canPrompt, isIos, installed, promptInstall } = usePwaInstall();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Smartphone className="h-5 w-5" />
          Install BakerIQ
        </CardTitle>
        <CardDescription>
          Add BakerIQ to your home screen for faster access to quotes, requests, and your order page.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {installed ? (
          <p
            className="text-sm text-muted-foreground flex items-center gap-2"
            data-testid="text-install-status"
          >
            <Check className="h-4 w-4 text-green-600" />
            BakerIQ is installed on this device.
          </p>
        ) : canPrompt ? (
          <Button onClick={() => promptInstall()} data-testid="button-settings-install-app">
            <Download className="mr-2 h-4 w-4" />
            Install BakerIQ
          </Button>
        ) : isIos ? (
          <p
            className="text-sm text-muted-foreground flex items-center gap-2"
            data-testid="text-settings-install-ios-hint"
          >
            <Share className="h-4 w-4 shrink-0" />
            {IOS_HINT}
          </p>
        ) : (
          <p className="text-sm text-muted-foreground" data-testid="text-install-unavailable">
            Open BakerIQ in your mobile browser or Chrome to install it. Your browser will offer an
            install option when available.
          </p>
        )}
      </CardContent>
    </Card>
  );
}

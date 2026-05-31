import { useEffect, useState } from "react";
import { Bell, Smartphone } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import {
  isPushSupported,
  isSubscribed,
  subscribeToPush,
  unsubscribeFromPush,
  needsIOSInstall,
} from "@/lib/push";

export function PushNotificationCard() {
  const { toast } = useToast();
  const [supported, setSupported] = useState(false);
  const [needsInstall, setNeedsInstall] = useState(false);
  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      const sup = isPushSupported();
      const install = needsIOSInstall();
      let subscribed = false;
      if (sup) {
        try {
          subscribed = await isSubscribed();
        } catch {
          subscribed = false;
        }
      }
      if (!active) return;
      setSupported(sup);
      setNeedsInstall(install);
      setEnabled(subscribed);
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, []);

  const handleToggle = async (checked: boolean) => {
    setWorking(true);
    try {
      if (checked) {
        await subscribeToPush();
        setEnabled(true);
        toast({ title: "Push notifications on for this device" });
      } else {
        await unsubscribeFromPush();
        setEnabled(false);
        toast({ title: "Push notifications off for this device" });
      }
    } catch (err: any) {
      toast({
        title: "Couldn't update push notifications",
        description: err?.message || "Please try again.",
        variant: "destructive",
      });
    } finally {
      setWorking(false);
    }
  };

  return (
    <Card data-testid="card-push-notifications">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Device Push Notifications
        </CardTitle>
        <CardDescription>
          Get instant alerts on this device for new leads, accepted quotes, and payments
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {needsInstall ? (
          <div
            className="flex items-start gap-3 rounded-md border p-4 bg-muted/40"
            data-testid="hint-ios-install"
          >
            <Smartphone className="h-5 w-5 mt-0.5 shrink-0 text-muted-foreground" />
            <div className="text-sm">
              <p className="font-medium">Add BakerIQ to your Home Screen first</p>
              <p className="text-muted-foreground mt-1">
                On iPhone or iPad, push notifications only work after you install the app.
                Tap the Share button in Safari, then "Add to Home Screen," open BakerIQ from
                your home screen, and come back here to turn them on.
              </p>
            </div>
          </div>
        ) : !supported ? (
          <p className="text-sm text-muted-foreground" data-testid="text-push-unsupported">
            This device or browser doesn't support push notifications.
          </p>
        ) : (
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Push notifications (this device)</p>
              <p className="text-sm text-muted-foreground">
                Turn on alerts for this specific phone, tablet, or computer
              </p>
            </div>
            <Switch
              checked={enabled}
              onCheckedChange={handleToggle}
              disabled={loading || working}
              data-testid="switch-push-notifications"
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

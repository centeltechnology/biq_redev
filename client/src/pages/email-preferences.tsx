import { useState } from "react";
import { useParams } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Bell, Mail, Megaphone } from "lucide-react";

interface EmailPreferencesData {
  businessName: string;
  email: string;
  notifyNewLead: number;
  notifyQuoteViewed: number;
  notifyQuoteAccepted: number;
  notifyOnboarding: number;
  notifyRetention: number;
  notifyAnnouncements: number;
}

type PreferenceField = keyof Omit<EmailPreferencesData, "businessName" | "email">;

export default function EmailPreferences() {
  const { token } = useParams<{ token: string }>();
  const { toast } = useToast();
  const [optimistic, setOptimistic] = useState<Partial<Record<PreferenceField, number>>>({});

  const { data, isLoading, isError } = useQuery<EmailPreferencesData>({
    queryKey: ["/api/email-preferences", token],
    enabled: !!token,
  });

  const updateMutation = useMutation({
    mutationFn: async (update: Partial<Record<PreferenceField, number>>) => {
      const res = await apiRequest("PATCH", `/api/email-preferences/${token}`, update);
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Preferences updated" });
    },
    onError: () => {
      setOptimistic({});
      toast({ title: "Failed to update preferences", variant: "destructive" });
    },
  });

  const handleToggle = (field: PreferenceField, currentValue: number) => {
    const newValue = currentValue ? 0 : 1;
    setOptimistic((prev) => ({ ...prev, [field]: newValue }));
    updateMutation.mutate({ [field]: newValue });
  };

  const getValue = (field: PreferenceField): boolean => {
    if (field in optimistic) return !!optimistic[field];
    return !!data?.[field];
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center pt-12 px-4">
        <div className="max-w-lg mx-auto w-full space-y-6">
          <div className="text-center space-y-2">
            <Skeleton className="h-8 w-48 mx-auto" />
            <Skeleton className="h-4 w-64 mx-auto" />
          </div>
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-40" />
              <Skeleton className="h-4 w-56" />
            </CardHeader>
            <CardContent className="space-y-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="flex items-center justify-between gap-4">
                  <div className="space-y-1">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-48" />
                  </div>
                  <Skeleton className="h-5 w-9 rounded-full" />
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4">
        <div className="text-center space-y-3">
          <h1 className="text-2xl font-bold" data-testid="text-error-title">Invalid or Expired Link</h1>
          <p className="text-muted-foreground" data-testid="text-error-description">
            This email preferences link is no longer valid. Please check your email for a newer link.
          </p>
        </div>
      </div>
    );
  }

  const activityToggles: { field: PreferenceField; label: string; description: string }[] = [
    { field: "notifyNewLead", label: "New Lead Alerts", description: "Get notified when someone submits your calculator" },
    { field: "notifyQuoteViewed", label: "Quote Viewed", description: "Get notified when a customer views their quote" },
    { field: "notifyQuoteAccepted", label: "Quote Accepted", description: "Get notified when a customer accepts a quote" },
  ];

  const marketingToggles: { field: PreferenceField; label: string; description: string }[] = [
    { field: "notifyOnboarding", label: "Onboarding Tips", description: "Helpful tips to get started with BakerIQ" },
    { field: "notifyRetention", label: "Engagement Reminders", description: "Periodic reminders and tips to grow your business" },
    { field: "notifyAnnouncements", label: "Announcements & Updates", description: "New features, updates, and platform news" },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col items-center pt-12 px-4 pb-12">
      <div className="max-w-lg mx-auto w-full space-y-6">
        <div className="text-center space-y-1">
          <h1 className="text-2xl font-bold" data-testid="text-brand">BakerIQ</h1>
          <p className="text-muted-foreground" data-testid="text-business-name">
            Email preferences for <span className="font-medium text-foreground">{data.businessName}</span>
          </p>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2 flex-wrap">
              <Bell className="h-5 w-5 text-muted-foreground" />
              <CardTitle>Activity Notifications</CardTitle>
            </div>
            <CardDescription>Notifications about your leads and quotes</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {activityToggles.map(({ field, label, description }) => (
              <div key={field} className="flex items-center justify-between gap-4">
                <div className="space-y-0.5">
                  <p className="text-sm font-medium" data-testid={`text-label-${field}`}>{label}</p>
                  <p className="text-xs text-muted-foreground" data-testid={`text-description-${field}`}>{description}</p>
                </div>
                <Switch
                  checked={getValue(field)}
                  onCheckedChange={() => handleToggle(field, getValue(field) ? 1 : 0)}
                  data-testid={`switch-${field}`}
                />
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2 flex-wrap">
              <Megaphone className="h-5 w-5 text-muted-foreground" />
              <CardTitle>Marketing & Tips</CardTitle>
            </div>
            <CardDescription>Product updates, tips, and announcements</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {marketingToggles.map(({ field, label, description }) => (
              <div key={field} className="flex items-center justify-between gap-4">
                <div className="space-y-0.5">
                  <p className="text-sm font-medium" data-testid={`text-label-${field}`}>{label}</p>
                  <p className="text-xs text-muted-foreground" data-testid={`text-description-${field}`}>{description}</p>
                </div>
                <Switch
                  checked={getValue(field)}
                  onCheckedChange={() => handleToggle(field, getValue(field) ? 1 : 0)}
                  data-testid={`switch-${field}`}
                />
              </div>
            ))}
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground" data-testid="text-email-info">
          Managing preferences for <span className="font-medium">{data.email}</span>
        </p>
      </div>
    </div>
  );
}

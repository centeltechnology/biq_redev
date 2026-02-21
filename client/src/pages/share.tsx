import { useState, useMemo, useRef, useCallback, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DashboardLayout } from "@/components/dashboard-layout";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Label } from "@/components/ui/label";
import { useUpload } from "@/hooks/use-upload";
import { Copy, ExternalLink, Link2, QrCode, Share2, Check, Download, Upload, Save, Image as ImageIcon, Loader2, ChevronDown, ChevronUp, Rocket, Zap, Pencil, CheckCircle2, AlertCircle, Trash2 } from "lucide-react";
import { SiFacebook, SiX, SiPinterest, SiWhatsapp, SiInstagram, SiLinkedin } from "react-icons/si";
import { downloadCalculatorQR } from "@/lib/qr-download";

interface FeaturedItem {
  id: string;
  name: string;
  featuredLabel: string | null;
  featuredDescription: string | null;
  featuredPrice: string | null;
  featuredImageUrl: string | null;
}

const CAPTION_TEMPLATES = {
  general: [
    "Ready to order? Start your custom request here 👇",
    "Get an instant estimate and request your custom quote here:",
    "Custom cakes & treats made to order. Start your request here:",
  ],
  wedding: [
    "Your dream wedding cake starts here! Request a custom quote in minutes.",
    "Engaged? Let's design your perfect wedding cake together. Tap to get started!",
    "From elegant tiers to stunning toppers — I create wedding cakes as unique as your love story. Request your quote now!",
    "Wedding planning made easy! Get an instant estimate for your dream cake, then we'll handle the rest.",
  ],
  events: [
    "Birthday coming up? Let me make it extra sweet! Get an instant estimate.",
    "Planning a corporate event, baby shower, or graduation? Custom cakes & treats for every occasion!",
    "Make your next celebration unforgettable with a custom order! Tap to get started.",
    "Hosting a party? From cupcakes to full dessert tables — I've got you covered. Request your quote now!",
  ],
  featured: [
    "Check out my latest creation! Order yours today with an instant quote.",
    "Limited time special! Get yours before it's gone.",
    "New on my menu! Tap to see pricing and order.",
  ],
  seasonal: [
    "Holiday treats are here! Get your order in early for the best selection.",
    "Wedding season is coming! Let me create the perfect cake for your big day.",
    "Birthday party coming up? I've got the perfect cake waiting for you!",
  ],
};

type Platform = "facebook" | "twitter" | "pinterest" | "whatsapp" | "linkedin" | "instagram";

function getPlatformShareUrl(platform: Platform, url: string, text: string): string | null {
  const encodedUrl = encodeURIComponent(url);
  const encodedText = encodeURIComponent(text);

  switch (platform) {
    case "facebook":
      return `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`;
    case "twitter":
      return `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedText}`;
    case "pinterest":
      return `https://pinterest.com/pin/create/button/?url=${encodedUrl}&description=${encodedText}`;
    case "whatsapp":
      return `https://wa.me/?text=${encodedText}%20${encodedUrl}`;
    case "linkedin":
      return `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`;
    case "instagram":
      return null;
    default:
      return null;
  }
}

const PLATFORMS: { id: Platform; label: string; icon: typeof SiFacebook; color: string }[] = [
  { id: "facebook", label: "Facebook", icon: SiFacebook, color: "text-[#1877F2]" },
  { id: "twitter", label: "X (Twitter)", icon: SiX, color: "text-foreground" },
  { id: "instagram", label: "Instagram", icon: SiInstagram, color: "text-[#E4405F]" },
  { id: "pinterest", label: "Pinterest", icon: SiPinterest, color: "text-[#BD081C]" },
  { id: "whatsapp", label: "WhatsApp", icon: SiWhatsapp, color: "text-[#25D366]" },
  { id: "linkedin", label: "LinkedIn", icon: SiLinkedin, color: "text-[#0A66C2]" },
];

function ShareButtons({ url, caption, onCopied }: { url: string; caption: string; onCopied: () => void }) {
  const handleShare = (platform: Platform) => {
    const shareUrl = getPlatformShareUrl(platform, url, caption);
    if (shareUrl) {
      window.open(shareUrl, "_blank", "noopener,noreferrer,width=600,height=400");
    } else {
      navigator.clipboard.writeText(`${caption}\n\n${url}`);
      onCopied();
    }
  };

  return (
    <div className="flex flex-wrap gap-2">
      {PLATFORMS.map((platform) => (
        <Button
          key={platform.id}
          variant="outline"
          onClick={() => handleShare(platform.id)}
          data-testid={`button-share-${platform.id}`}
        >
          <platform.icon className={`h-4 w-4 mr-2 ${platform.color}`} />
          {platform.id === "instagram" ? "Copy for Instagram" : platform.label}
        </Button>
      ))}
    </div>
  );
}

function CollapsibleSection({ title, icon, defaultOpen = false, children, testId }: {
  title: string;
  icon?: React.ReactNode;
  defaultOpen?: boolean;
  children: React.ReactNode;
  testId?: string;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <Card>
      <button
        className="w-full text-left"
        onClick={() => setOpen(!open)}
        data-testid={testId ? `toggle-${testId}` : undefined}
      >
        <CardHeader className="cursor-pointer">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              {icon}
              {title}
            </CardTitle>
            {open ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
          </div>
        </CardHeader>
      </button>
      {open && <CardContent>{children}</CardContent>}
    </Card>
  );
}

function SlugEditor({ currentSlug }: { currentSlug: string }) {
  const [editing, setEditing] = useState(false);
  const [slug, setSlug] = useState(currentSlug);
  const [status, setStatus] = useState<"idle" | "checking" | "available" | "unavailable">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const { toast } = useToast();
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    setSlug(currentSlug);
  }, [currentSlug]);

  const checkAvailability = useCallback((value: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (!value || value.length < 3) {
      setStatus("unavailable");
      setErrorMsg("Must be at least 3 characters");
      return;
    }
    if (value === currentSlug) {
      setStatus("idle");
      setErrorMsg("");
      return;
    }

    setStatus("checking");
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/bakers/check-slug/${encodeURIComponent(value)}`);
        const data = await res.json();
        if (data.available) {
          setStatus("available");
          setErrorMsg("");
        } else {
          setStatus("unavailable");
          setErrorMsg(data.reason || "Not available");
        }
      } catch {
        setStatus("unavailable");
        setErrorMsg("Could not check availability");
      }
    }, 400);
  }, [currentSlug]);

  const updateSlugMutation = useMutation({
    mutationFn: async (newSlug: string) => {
      const res = await apiRequest("PATCH", "/api/bakers/me/slug", { slug: newSlug });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Failed to update URL");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      toast({ title: "Calculator URL updated" });
      setEditing(false);
      setStatus("idle");
    },
    onError: (error: Error) => {
      toast({ title: "Failed to update URL", description: error.message, variant: "destructive" });
    },
  });

  const handleSlugChange = (value: string) => {
    const sanitized = value.toLowerCase().replace(/[^a-z0-9-]/g, "").replace(/-+/g, "-");
    setSlug(sanitized);
    checkAvailability(sanitized);
  };

  const handleSave = () => {
    if (status === "available" && slug !== currentSlug) {
      updateSlugMutation.mutate(slug);
    }
  };

  const handleCancel = () => {
    setSlug(currentSlug);
    setEditing(false);
    setStatus("idle");
    setErrorMsg("");
  };

  if (!editing) {
    return (
      <div className="mt-3 flex items-center gap-2">
        <span className="text-sm text-muted-foreground">Custom URL:</span>
        <code className="text-sm font-mono bg-muted px-2 py-1 rounded">/c/{currentSlug}</code>
        <Button variant="ghost" size="icon" onClick={() => setEditing(true)} data-testid="button-edit-slug">
          <Pencil className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <div className="mt-3 space-y-2">
      <Label className="text-sm text-muted-foreground">Customize your calculator URL</Label>
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground whitespace-nowrap">/c/</span>
        <div className="relative flex-1">
          <Input
            value={slug}
            onChange={(e) => handleSlugChange(e.target.value)}
            placeholder="your-bakery-name"
            className="font-mono text-sm pr-8"
            data-testid="input-slug"
          />
          <div className="absolute right-2 top-1/2 -translate-y-1/2">
            {status === "checking" && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
            {status === "available" && <CheckCircle2 className="h-4 w-4 text-green-600" />}
            {status === "unavailable" && <AlertCircle className="h-4 w-4 text-destructive" />}
          </div>
        </div>
        <Button
          size="sm"
          onClick={handleSave}
          disabled={status !== "available" || updateSlugMutation.isPending}
          data-testid="button-save-slug"
        >
          {updateSlugMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
        </Button>
        <Button variant="ghost" size="sm" onClick={handleCancel} data-testid="button-cancel-slug">
          Cancel
        </Button>
      </div>
      {errorMsg && <p className="text-xs text-destructive">{errorMsg}</p>}
      {status === "available" && <p className="text-xs text-green-600">This URL is available</p>}
    </div>
  );
}

export default function SharePage() {
  const { baker } = useAuth();
  const { toast } = useToast();
  const [caption, setCaption] = useState("");
  const [templateCategory, setTemplateCategory] = useState<keyof typeof CAPTION_TEMPLATES>("general");
  const [copiedLink, setCopiedLink] = useState(false);

  const calculatorUrl = useMemo(() => {
    if (!baker?.slug) return "";
    return `${window.location.origin}/c/${baker.slug}`;
  }, [baker?.slug]);

  const { data: featuredItems, isLoading: featuredLoading } = useQuery<FeaturedItem[]>({
    queryKey: ["/api/pricing-calculations/featured"],
    select: (data: any[]) =>
      data
        .filter((item: any) => item.isFeatured)
        .map((item: any) => ({
          id: item.id,
          name: item.name,
          featuredLabel: item.featuredLabel,
          featuredDescription: item.featuredDescription,
          featuredPrice: item.featuredPrice,
          featuredImageUrl: item.featuredImageUrl,
        })),
  });

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(calculatorUrl);
      setCopiedLink(true);
      toast({ title: "✔ Order Page Launched", description: "Link copied to clipboard!" });
      setTimeout(() => setCopiedLink(false), 2000);
    } catch {
      toast({ title: "Failed to copy link", variant: "destructive" });
    }
  };

  const handleDownloadQR = async () => {
    try {
      await downloadCalculatorQR(calculatorUrl, baker?.businessName || undefined);
      toast({
        title: "QR code downloaded!",
        description: "Add it to your packaging, booth displays, or business cards.",
      });
    } catch {
      toast({ title: "Failed to generate QR code", variant: "destructive" });
    }
  };

  const handleCopyCaption = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({ title: "Caption copied!" });
    } catch {
      toast({ title: "Failed to copy", variant: "destructive" });
    }
  };

  const handleUseTemplate = (template: string) => {
    setCaption(template);
    toast({ title: "Template applied to caption" });
  };

  const handleShared = () => {
    toast({ title: "Caption & link copied for sharing!" });
  };

  const [headerImage, setHeaderImage] = useState<string | null>(null);
  const [uploadingHeader, setUploadingHeader] = useState(false);
  const headerInputRef = useRef<HTMLInputElement>(null);
  const { uploadFile } = useUpload({});

  useEffect(() => {
    if (baker) {
      setHeaderImage(baker.calculatorHeaderImage || null);
    }
  }, [baker]);

  const updateHeaderMutation = useMutation({
    mutationFn: async (data: { calculatorHeaderImage: string | null }) => {
      const res = await apiRequest("PATCH", "/api/bakers/me", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/session"] });
    },
  });

  const handleHeaderImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast({ title: "Please select an image file", variant: "destructive" });
      return;
    }

    setUploadingHeader(true);
    try {
      const result = await uploadFile(file);
      if (result) {
        const newHeaderImage = result.objectPath;
        setHeaderImage(newHeaderImage);
        await updateHeaderMutation.mutateAsync({ calculatorHeaderImage: newHeaderImage });
        toast({ title: "Header image updated" });
      }
    } catch (error) {
      toast({ title: "Failed to upload header image", variant: "destructive" });
    } finally {
      setUploadingHeader(false);
      if (headerInputRef.current) headerInputRef.current.value = "";
    }
  };

  const handleRemoveHeaderImage = async () => {
    setHeaderImage(null);
    await updateHeaderMutation.mutateAsync({ calculatorHeaderImage: null });
    toast({ title: "Header image removed" });
  };

  if (!baker) return null;

  return (
    <DashboardLayout title="Your Order Page">
      <div className="space-y-6">
        {/* HERO: Order Page Link */}
        <Card className="border-primary/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2" data-testid="text-share-link-title">
              <Rocket className="h-5 w-5 text-primary" />
              Launch Your Landing Page
            </CardTitle>
            <CardDescription>
              Send customers here to request a custom quote and get an instant estimate.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <Input
                value={calculatorUrl}
                readOnly
                className="font-mono text-sm flex-1 min-w-0"
                data-testid="input-calculator-url"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <Button onClick={handleCopyLink} data-testid="button-copy-link" size="lg">
                {copiedLink ? <Check className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
                {copiedLink ? "Copied!" : "Copy Order Page Link"}
              </Button>
              <Button
                variant="outline"
                size="lg"
                onClick={() => window.open(calculatorUrl, "_blank")}
                data-testid="button-preview-calculator"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Preview
              </Button>
            </div>
            <div className="flex flex-wrap gap-2 items-center">
              <Button variant="ghost" size="sm" onClick={handleDownloadQR} data-testid="button-download-qr">
                <QrCode className="h-4 w-4 mr-2" />
                Download QR Code
              </Button>
            </div>
            <div className="pt-3 border-t">
              <SlugEditor currentSlug={baker?.slug || ""} />
            </div>

            <div className="pt-3 border-t space-y-2">
              <Label className="text-sm font-medium">Order Page Header Image</Label>
              <p className="text-xs text-muted-foreground">This image appears at the top of your order page and in social media previews.</p>
              <div className="mt-2">
                {headerImage ? (
                  <div className="relative rounded-md overflow-hidden border">
                    <img
                      src={headerImage}
                      alt="Calculator header"
                      className="w-full h-40 object-cover"
                      data-testid="img-header-preview"
                    />
                  </div>
                ) : (
                  <div className="w-full h-40 rounded-md border border-dashed flex flex-col items-center justify-center gap-2 text-muted-foreground bg-muted/50">
                    <ImageIcon className="h-8 w-8" />
                    <span className="text-xs">No header image set</span>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <input
                  ref={headerInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleHeaderImageUpload}
                  data-testid="input-header-upload"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => headerInputRef.current?.click()}
                  disabled={uploadingHeader}
                  data-testid="button-upload-header"
                >
                  {uploadingHeader ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Upload className="h-4 w-4 mr-2" />
                  )}
                  {uploadingHeader ? "Uploading..." : "Upload Image"}
                </Button>
                {headerImage && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleRemoveHeaderImage}
                    disabled={updateHeaderMutation.isPending}
                    data-testid="button-remove-header"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Remove
                  </Button>
                )}
              </div>
            </div>

            <div className="pt-3 border-t">
              <p className="text-xs font-medium text-muted-foreground mb-2">Best places to add this link:</p>
              <ul className="text-xs text-muted-foreground space-y-1">
                <li>• Instagram bio</li>
                <li>• Facebook pinned post</li>
                <li>• Link-in-bio tools</li>
                <li>• DM auto-replies</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* CAPTION TEMPLATES — default OPEN */}
        <CollapsibleSection title="Caption Templates" icon={<Share2 className="h-5 w-5" />} defaultOpen={true} testId="caption-templates">
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Your caption</label>
              <Textarea
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="Write your own caption or pick a template below..."
                className="resize-none"
                rows={3}
                data-testid="textarea-caption"
              />
              {caption && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleCopyCaption(`${caption}\n\n${calculatorUrl}`)}
                  data-testid="button-copy-caption"
                >
                  <Copy className="h-3.5 w-3.5 mr-1" />
                  Copy caption + link
                </Button>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Quick templates</label>
              <div className="flex gap-2 flex-wrap">
                <Select
                  value={templateCategory}
                  onValueChange={(v) => setTemplateCategory(v as keyof typeof CAPTION_TEMPLATES)}
                >
                  <SelectTrigger className="w-[160px]" data-testid="select-template-category">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general">General</SelectItem>
                    <SelectItem value="wedding">Wedding</SelectItem>
                    <SelectItem value="events">Events</SelectItem>
                    <SelectItem value="featured">Express Items</SelectItem>
                    <SelectItem value="seasonal">Seasonal</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2 sm:grid-cols-1">
                {CAPTION_TEMPLATES[templateCategory].map((template, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-2 p-3 rounded-md border text-sm cursor-pointer hover-elevate"
                    onClick={() => handleUseTemplate(template)}
                    data-testid={`template-${templateCategory}-${i}`}
                  >
                    <span className="flex-1 text-muted-foreground">{template}</span>
                    <Badge variant="secondary" className="shrink-0">Use</Badge>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-2 border-t space-y-2">
              <label className="text-sm font-medium">Share to platform</label>
              <ShareButtons
                url={calculatorUrl}
                caption={caption || "Custom cakes & treats made to order. Start your request here:"}
                onCopied={handleShared}
              />
            </div>
          </div>
        </CollapsibleSection>

        {/* SOCIAL MEDIA BANNERS — default CLOSED, compact */}
        <CollapsibleSection title="Social Media Banners" icon={<ImageIcon className="h-5 w-5" />} defaultOpen={false} testId="social-banners">
          <SocialBannerGenerator
            businessName={baker.businessName || "My Bakery"}
            calculatorUrl={calculatorUrl}
          />
        </CollapsibleSection>

        {/* FEATURED ITEMS — default CLOSED */}
        <CollapsibleSection title="Share Express Items" icon={<Zap className="h-5 w-5" />} defaultOpen={false} testId="featured-items">
          {featuredLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          ) : !featuredItems || featuredItems.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground" data-testid="text-no-featured-items">
              <p className="mb-2">You don't have any express items yet.</p>
              <p className="text-sm">
                Go to <strong>Pricing</strong> to mark items as express for your order page.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {featuredItems.map((item) => (
                <FeaturedItemShare
                  key={item.id}
                  item={item}
                  calculatorUrl={calculatorUrl}
                />
              ))}
            </div>
          )}
        </CollapsibleSection>

        {/* SHARING TIPS — default CLOSED */}
        <CollapsibleSection title="Sharing Tips" defaultOpen={false} testId="sharing-tips">
          <div className="grid gap-4 sm:grid-cols-2">
            <TipCard
              title="Post at peak times"
              description="Share between 10am-2pm and 6-9pm when people are browsing and planning."
            />
            <TipCard
              title="Show your work"
              description="Posts with photos of your creations get more engagement. Pair your link with your best shots."
            />
            <TipCard
              title="Use stories & reels"
              description="Short videos of your process or finished items perform great. Add your link sticker."
            />
            <TipCard
              title="QR codes work offline"
              description="Print your QR code on business cards, packaging, and booth displays for in-person events."
            />
          </div>
        </CollapsibleSection>
      </div>
    </DashboardLayout>
  );
}

function FeaturedItemShare({ item, calculatorUrl }: { item: FeaturedItem; calculatorUrl: string }) {
  const { toast } = useToast();
  const itemUrl = calculatorUrl;

  const handleCopyItemLink = async () => {
    const text = item.featuredLabel
      ? `${item.featuredLabel} - ${item.name}! ${itemUrl}`
      : `Check out: ${item.name}! ${itemUrl}`;
    try {
      await navigator.clipboard.writeText(text);
      toast({ title: "Item link & caption copied!" });
    } catch {
      toast({ title: "Failed to copy", variant: "destructive" });
    }
  };

  const itemCaption = item.featuredLabel
    ? `${item.featuredLabel} - ${item.name}${item.featuredPrice ? ` starting at $${item.featuredPrice}` : ""}!`
    : `${item.name}${item.featuredPrice ? ` - starting at $${item.featuredPrice}` : ""}`;

  return (
    <div className="flex items-start gap-4 p-4 rounded-md border" data-testid={`featured-item-${item.id}`}>
      {item.featuredImageUrl && (
        <img
          src={item.featuredImageUrl}
          alt={item.name}
          className="w-16 h-16 rounded-md object-cover shrink-0"
        />
      )}
      <div className="flex-1 min-w-0 space-y-2">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-medium truncate">{item.name}</span>
          {item.featuredLabel && <Badge variant="secondary">{item.featuredLabel}</Badge>}
          {item.featuredPrice && (
            <span className="text-sm text-muted-foreground">${item.featuredPrice}</span>
          )}
        </div>
        {item.featuredDescription && (
          <p className="text-sm text-muted-foreground line-clamp-2">{item.featuredDescription}</p>
        )}
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={handleCopyItemLink} data-testid={`button-copy-featured-${item.id}`}>
            <Copy className="h-3.5 w-3.5 mr-1" />
            Copy
          </Button>
          {PLATFORMS.map((platform) => {
            const shareUrl = getPlatformShareUrl(platform.id, itemUrl, itemCaption);
            return (
              <Button
                key={platform.id}
                variant="ghost"
                size="sm"
                onClick={() => {
                  if (shareUrl) {
                    window.open(shareUrl, "_blank", "noopener,noreferrer,width=600,height=400");
                  } else {
                    navigator.clipboard.writeText(`${itemCaption}\n\n${itemUrl}`);
                    toast({ title: "Copied for Instagram!" });
                  }
                }}
                data-testid={`button-share-featured-${item.id}-${platform.id}`}
              >
                <platform.icon className={`h-3.5 w-3.5 ${platform.color}`} />
              </Button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

interface BannerDesign {
  id: string;
  name: string;
  description: string;
  bgGradient: [string, string, string?];
  textColor: string;
  accentColor: string;
  tagline: string;
}

const BANNER_DESIGNS: BannerDesign[] = [
  {
    id: "elegant",
    name: "Elegant Wedding",
    description: "Soft, romantic tones for wedding promotions",
    bgGradient: ["#f8e8e0", "#e8c4b8", "#d4a090"],
    textColor: "#3d2c2c",
    accentColor: "#8b5e5e",
    tagline: "Custom Wedding Cakes",
  },
  {
    id: "birthday",
    name: "Fun Birthday",
    description: "Bright, cheerful colors for birthday events",
    bgGradient: ["#ffecd2", "#fcb69f", "#ff9a9e"],
    textColor: "#4a2c2a",
    accentColor: "#e8685d",
    tagline: "Custom Cakes & Treats",
  },
  {
    id: "modern",
    name: "Clean Modern",
    description: "Sleek, professional design for general use",
    bgGradient: ["#667eea", "#764ba2"],
    textColor: "#ffffff",
    accentColor: "#e0d4f7",
    tagline: "Order Custom Cakes Online",
  },
  {
    id: "seasonal",
    name: "Holiday Seasonal",
    description: "Warm tones for seasonal promotions",
    bgGradient: ["#2d5016", "#4a7c24", "#6ba33e"],
    textColor: "#ffffff",
    accentColor: "#d4e8c4",
    tagline: "Holiday Treats & Cakes",
  },
];

function renderBannerToCanvas(
  canvas: HTMLCanvasElement,
  design: BannerDesign,
  businessName: string,
  calculatorUrl: string,
  customImage?: HTMLImageElement | null,
) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const W = 1200;
  const H = 630;
  canvas.width = W;
  canvas.height = H;

  if (customImage) {
    const imgRatio = customImage.width / customImage.height;
    const canvasRatio = W / H;
    let sx = 0, sy = 0, sw = customImage.width, sh = customImage.height;
    if (imgRatio > canvasRatio) {
      sw = customImage.height * canvasRatio;
      sx = (customImage.width - sw) / 2;
    } else {
      sh = customImage.width / canvasRatio;
      sy = (customImage.height - sh) / 2;
    }
    ctx.drawImage(customImage, sx, sy, sw, sh, 0, 0, W, H);
    ctx.fillStyle = "rgba(0,0,0,0.55)";
    ctx.fillRect(0, 0, W, H);
  } else {
    const gradient = ctx.createLinearGradient(0, 0, W, H);
    const colors = design.bgGradient.filter((c): c is string => !!c);
    colors.forEach((color, i) => {
      gradient.addColorStop(i / Math.max(colors.length - 1, 1), color);
    });
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, W, H);

    ctx.globalAlpha = 0.06;
    for (let i = 0; i < 8; i++) {
      ctx.beginPath();
      ctx.arc(
        100 + i * 150,
        H / 2 + Math.sin(i) * 80,
        60 + i * 15,
        0,
        Math.PI * 2,
      );
      ctx.fillStyle = design.textColor;
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  const textColor = customImage ? "#ffffff" : design.textColor;
  const accentColor = customImage ? "rgba(255,255,255,0.7)" : design.accentColor;

  ctx.textAlign = "center";

  ctx.font = "bold 56px system-ui, -apple-system, sans-serif";
  ctx.fillStyle = textColor;
  ctx.fillText(businessName, W / 2, H / 2 - 40, W - 120);

  ctx.font = "28px system-ui, -apple-system, sans-serif";
  ctx.fillStyle = accentColor;
  ctx.fillText(design.tagline, W / 2, H / 2 + 20, W - 120);

  const btnY = H / 2 + 60;
  const btnText = "Get Your Estimate";
  ctx.font = "bold 22px system-ui, -apple-system, sans-serif";
  const btnMetrics = ctx.measureText(btnText);
  const btnW = btnMetrics.width + 60;
  const btnH = 48;

  ctx.fillStyle = customImage ? "rgba(255,255,255,0.2)" : design.accentColor + "30";
  ctx.beginPath();
  const r = 8;
  const bx = W / 2 - btnW / 2;
  ctx.moveTo(bx + r, btnY);
  ctx.lineTo(bx + btnW - r, btnY);
  ctx.arcTo(bx + btnW, btnY, bx + btnW, btnY + r, r);
  ctx.lineTo(bx + btnW, btnY + btnH - r);
  ctx.arcTo(bx + btnW, btnY + btnH, bx + btnW - r, btnY + btnH, r);
  ctx.lineTo(bx + r, btnY + btnH);
  ctx.arcTo(bx, btnY + btnH, bx, btnY + btnH - r, r);
  ctx.lineTo(bx, btnY + r);
  ctx.arcTo(bx, btnY, bx + r, btnY, r);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = textColor;
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.fillStyle = textColor;
  ctx.textAlign = "center";
  ctx.fillText(btnText, W / 2, btnY + 32);

  ctx.font = "16px system-ui, -apple-system, sans-serif";
  ctx.fillStyle = accentColor;
  ctx.fillText("Powered By BakerIQ", W / 2, H - 30, W - 60);
}

function SocialBannerGenerator({
  businessName,
  calculatorUrl,
}: {
  businessName: string;
  calculatorUrl: string;
}) {
  const { toast } = useToast();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedDesign, setSelectedDesign] = useState<string>("elegant");
  const [customImage, setCustomImage] = useState<HTMLImageElement | null>(null);
  const [customImageName, setCustomImageName] = useState<string>("");
  const [isSaving, setIsSaving] = useState(false);

  const activeDesign = BANNER_DESIGNS.find((d) => d.id === selectedDesign) || BANNER_DESIGNS[0];

  const redrawCanvas = useCallback(() => {
    if (!canvasRef.current) return;
    renderBannerToCanvas(canvasRef.current, activeDesign, businessName, calculatorUrl, customImage);
  }, [activeDesign, businessName, calculatorUrl, customImage]);

  useEffect(() => {
    redrawCanvas();
  }, [redrawCanvas]);

  const handleDownloadBanner = () => {
    if (!canvasRef.current) return;
    const link = document.createElement("a");
    link.download = `${businessName.replace(/\s+/g, "-").toLowerCase()}-social-banner.png`;
    link.href = canvasRef.current.toDataURL("image/png");
    link.click();
    toast({ title: "Banner downloaded!" });
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast({ title: "Please upload an image file", variant: "destructive" });
      return;
    }
    const img = new window.Image();
    img.onload = () => {
      setCustomImage(img);
      setCustomImageName(file.name);
      toast({ title: "Image loaded! Banner updated with your photo." });
    };
    img.onerror = () => {
      toast({ title: "Failed to load image", variant: "destructive" });
    };
    img.src = URL.createObjectURL(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleClearImage = () => {
    setCustomImage(null);
    setCustomImageName("");
  };

  const handleSaveBanner = async () => {
    if (!canvasRef.current) return;
    setIsSaving(true);
    try {
      const blob = await new Promise<Blob>((resolve, reject) => {
        canvasRef.current!.toBlob((b) => {
          if (b) resolve(b);
          else reject(new Error("Failed to convert canvas to image"));
        }, "image/png");
      });

      const urlRes = await apiRequest("POST", "/api/uploads/request-url", {
        name: "social-banner.png",
        size: blob.size,
        contentType: "image/png",
      });
      const { uploadURL, objectPath } = await urlRes.json();

      await fetch(uploadURL, {
        method: "PUT",
        body: blob,
        headers: { "Content-Type": "image/png" },
      });

      await apiRequest("PATCH", "/api/baker/profile", {
        socialBannerUrl: objectPath,
      });

      queryClient.invalidateQueries({ queryKey: ["/api/baker/me"] });
      toast({
        title: "Banner saved!",
        description: "Your social media banner is now set as your profile banner and will appear when your order page link is shared.",
      });
    } catch (err) {
      console.error("Error saving banner:", err);
      toast({ title: "Failed to save banner", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Create a professional banner with your business name. Choose a design or upload your own photo.
      </p>
      <div className="space-y-2">
        <label className="text-sm font-medium" data-testid="label-choose-design">Choose a design</label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {BANNER_DESIGNS.map((design) => (
            <div
              key={design.id}
              className={`p-3 rounded-md border cursor-pointer text-center space-y-1 hover-elevate ${
                selectedDesign === design.id && !customImage
                  ? "border-primary ring-1 ring-primary"
                  : ""
              }`}
              onClick={() => {
                setSelectedDesign(design.id);
                setCustomImage(null);
                setCustomImageName("");
              }}
              data-testid={`button-design-${design.id}`}
            >
              <div
                className="h-8 w-full rounded-md"
                style={{
                  background: `linear-gradient(135deg, ${design.bgGradient.join(", ")})`,
                }}
              />
              <p className="text-xs font-medium">{design.name}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium" data-testid="label-upload-photo">Or use your own photo</label>
        <div className="flex flex-wrap gap-2 items-center">
          <Button
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            data-testid="button-upload-image"
          >
            <Upload className="h-4 w-4 mr-2" />
            Upload Image
          </Button>
          {customImage && (
            <>
              <span className="text-sm text-muted-foreground truncate max-w-[200px]" data-testid="text-uploaded-filename">
                {customImageName}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearImage}
                data-testid="button-clear-image"
              >
                Clear
              </Button>
            </>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleImageUpload}
            data-testid="input-upload-image"
          />
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium" data-testid="label-banner-preview">Preview</label>
        <div className="border rounded-md overflow-hidden max-h-[200px]" data-testid="container-banner-preview">
          <canvas
            ref={canvasRef}
            className="w-full h-auto"
            style={{ aspectRatio: "1200/630", maxHeight: "200px", objectFit: "contain" }}
            data-testid="canvas-banner-preview"
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button
          size="sm"
          onClick={handleDownloadBanner}
          disabled={!calculatorUrl}
          data-testid="button-download-banner"
        >
          <Download className="h-4 w-4 mr-2" />
          Download Banner
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={handleSaveBanner}
          disabled={!calculatorUrl || isSaving}
          data-testid="button-save-banner"
        >
          {isSaving ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          {isSaving ? "Saving..." : "Save as Profile Banner"}
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">
        Saving sets this banner as the image that appears when your order page link is shared on social media.
      </p>
      {!calculatorUrl && (
        <p className="text-xs text-destructive" data-testid="text-banner-url-warning">
          Set up your business name in Settings first so your banner includes your order page link.
        </p>
      )}
    </div>
  );
}

function TipCard({ title, description }: { title: string; description: string }) {
  return (
    <div className="p-4 rounded-md border space-y-1">
      <h4 className="font-medium text-sm">{title}</h4>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  );
}

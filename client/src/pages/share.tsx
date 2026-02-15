import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DashboardLayout } from "@/components/dashboard-layout";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Copy, ExternalLink, Link2, QrCode, Share2, Check } from "lucide-react";
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
    "Custom cakes & treats made with love! Get an instant estimate for your next celebration.",
    "Planning a party? Use my pricing calculator to design your dream cake or treats!",
    "Order your custom cake or treats today! Quick estimates, beautiful results.",
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

export default function SharePage() {
  const { baker } = useAuth();
  const { toast } = useToast();
  const [caption, setCaption] = useState("");
  const [templateCategory, setTemplateCategory] = useState<"general" | "featured" | "seasonal">("general");
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
      toast({ title: "Link copied to clipboard!" });
      setTimeout(() => setCopiedLink(false), 2000);
    } catch {
      toast({ title: "Failed to copy link", variant: "destructive" });
    }
  };

  const handleDownloadQR = async () => {
    try {
      await downloadCalculatorQR(calculatorUrl);
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

  if (!baker) return null;

  return (
    <DashboardLayout title="Share & Promote">
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2" data-testid="text-share-link-title">
              <Link2 className="h-5 w-5" />
              Your Calculator Link
            </CardTitle>
            <CardDescription>
              Share this link so customers can get instant estimates and place orders
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                value={calculatorUrl}
                readOnly
                className="font-mono text-sm"
                data-testid="input-calculator-url"
              />
              <Button onClick={handleCopyLink} variant="outline" data-testid="button-copy-link">
                {copiedLink ? <Check className="h-4 w-4 mr-1" /> : <Copy className="h-4 w-4 mr-1" />}
                {copiedLink ? "Copied" : "Copy"}
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={handleDownloadQR} data-testid="button-download-qr">
                <QrCode className="h-4 w-4 mr-2" />
                Download QR Code
              </Button>
              <Button
                variant="outline"
                onClick={() => window.open(calculatorUrl, "_blank")}
                data-testid="button-preview-calculator"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Preview
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2" data-testid="text-share-social-title">
              <Share2 className="h-5 w-5" />
              Share on Social Media
            </CardTitle>
            <CardDescription>
              Write or pick a caption, then share your calculator link directly to your favorite platforms
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
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
                  onValueChange={(v) => setTemplateCategory(v as typeof templateCategory)}
                >
                  <SelectTrigger className="w-[160px]" data-testid="select-template-category">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general">General</SelectItem>
                    <SelectItem value="featured">Featured Items</SelectItem>
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
                caption={caption || "Check out my custom cakes & treats! Get an instant estimate:"}
                onCopied={handleShared}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle data-testid="text-featured-share-title">Share Featured Items</CardTitle>
            <CardDescription>
              Share individual featured items to highlight special creations and promotions
            </CardDescription>
          </CardHeader>
          <CardContent>
            {featuredLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
              </div>
            ) : !featuredItems || featuredItems.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground" data-testid="text-no-featured-items">
                <p className="mb-2">You don't have any featured items yet.</p>
                <p className="text-sm">
                  Go to <strong>Pricing</strong> to mark items as featured for your public calculator.
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
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle data-testid="text-tips-title">Sharing Tips</CardTitle>
          </CardHeader>
          <CardContent>
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
          </CardContent>
        </Card>
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
          {PLATFORMS.slice(0, 4).map((platform) => {
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

function TipCard({ title, description }: { title: string; description: string }) {
  return (
    <div className="p-4 rounded-md border space-y-1">
      <h4 className="font-medium text-sm">{title}</h4>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  );
}

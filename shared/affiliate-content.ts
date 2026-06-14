// Standard, shared content for affiliate referral landing pages (/join/:slug).
// Affiliates personalize their name + photo and pick one of these preset
// headlines. The quote/intro wording below is the same for every affiliate.

export interface AffiliateHeadlinePreset {
  key: string;
  label: string;
  headline: string;
  subheadline: string;
}

export const AFFILIATE_HEADLINE_PRESETS: AffiliateHeadlinePreset[] = [
  {
    key: "earns_it",
    label: "I don't recommend many tools",
    headline: "I don't recommend many tools. This one earns it.",
    subheadline:
      "If you're planning to sell professionally, you need structure — not DMs.",
  },
  {
    key: "serious",
    label: "Serious about selling?",
    headline: "Serious about selling? You need a real system.",
    subheadline:
      "Stop running your bakery out of your inbox. Run it like a business.",
  },
  {
    key: "wish_i_had",
    label: "The tool I wish I had",
    headline: "The tool I wish I had when I started.",
    subheadline:
      "From first inquiry to paid deposit — one professional workflow.",
  },
  {
    key: "like_a_pro",
    label: "Run your bakery like a pro",
    headline: "Run your baking business like a pro.",
    subheadline:
      "Capture leads, send quotes, and collect deposits in one place.",
  },
];

export const DEFAULT_AFFILIATE_HEADLINE_KEY = "earns_it";

// Single standard quote shown on every affiliate page (attributed to the
// affiliate's display name).
export const AFFILIATE_STANDARD_QUOTE =
  "I don't believe in running a business through DMs. If you're serious about selling, you need a structured system.";

export function getAffiliateHeadlinePreset(
  key?: string | null,
): AffiliateHeadlinePreset {
  return (
    AFFILIATE_HEADLINE_PRESETS.find((p) => p.key === key) ??
    AFFILIATE_HEADLINE_PRESETS.find(
      (p) => p.key === DEFAULT_AFFILIATE_HEADLINE_KEY,
    )!
  );
}

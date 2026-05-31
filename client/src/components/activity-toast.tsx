import { useState, useEffect, useCallback, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { resolveSpintax } from "@/lib/spintax";

interface RecentEvent {
  eventType: string;
  pagePath: string | null;
  createdAt: string;
}

const TIP_TEMPLATES = [
  "{Most bakers|Many custom bakers|A lot of home bakers} {undercharge by $50–$100 per cake|are surprised by how much they're undercharging}.",
  "{Try switching|Try changing} the design level to {Detailed|Luxury} and see how much the price changes.",
  "{Increase servings|Adjust servings} from {24 to 36|24 to 48} to estimate larger orders.",
  "{Professional bakers|Experienced bakers} charge {$5–$8|at least $5} per serving as a baseline.",
  "A {3-tier wedding cake|detailed birthday cake} can easily be worth {$300+|$400+} with the right pricing.",
  "{Luxury designs|Fondant and sculpted cakes} {deserve|command} a {1.5x–2x|significant} price premium.",
  "{Don't forget|Remember} to factor in {delivery fees|your time and delivery} when quoting.",
  "The {right pricing structure|correct price} is the difference between {a hobby and a business|surviving and thriving}.",
];

const ACTIVITY_TEMPLATES: Record<string, string[]> = {
  calculator_used: [
    "{A baker|Someone|A custom baker} just calculated a cake price.",
  ],
  price_recalculated: [
    "{A baker|Someone} just checked their pricing.",
  ],
  signup_click: [
    "Someone just clicked to create an order page.",
  ],
  account_created: [
    "A baker just started setting up BakerIQ.",
  ],
  dm_reply_copied: [
    "A baker just copied a reply to send a customer.",
  ],
  order_link_copied: [
    "A baker just shared their order page link.",
  ],
};

const FRESHNESS_WINDOW_MS = 72 * 60 * 60 * 1000;

function isFresh(dateStr: string): boolean {
  return Date.now() - new Date(dateStr).getTime() <= FRESHNESS_WINDOW_MS;
}

function relativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return "recently";
}

export function ActivityToast() {
  const [visible, setVisible] = useState(false);
  const [message, setMessage] = useState("");
  const [timestamp, setTimestamp] = useState<string | null>(null);
  const [leaving, setLeaving] = useState(false);

  const lastMessageRef = useRef<string | null>(null);

  const { data: recentEvents } = useQuery<RecentEvent[]>({
    queryKey: ["/api/analytics/recent?limit=20"],
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const showToast = useCallback(() => {
    let msg = "";
    let ts: string | null = null;

    const freshEvents = (recentEvents ?? []).filter(
      (e) => ACTIVITY_TEMPLATES[e.eventType] && isFresh(e.createdAt),
    );

    if (freshEvents.length > 0) {
      let chosen = freshEvents[Math.floor(Math.random() * freshEvents.length)];
      for (let attempt = 0; attempt < 5; attempt++) {
        const event = freshEvents[Math.floor(Math.random() * freshEvents.length)];
        const templates = ACTIVITY_TEMPLATES[event.eventType];
        const candidate = resolveSpintax(templates[Math.floor(Math.random() * templates.length)]);
        msg = candidate;
        chosen = event;
        if (candidate !== lastMessageRef.current) break;
      }
      ts = relativeTime(chosen.createdAt);
    } else {
      for (let attempt = 0; attempt < 5; attempt++) {
        const candidate = resolveSpintax(TIP_TEMPLATES[Math.floor(Math.random() * TIP_TEMPLATES.length)]);
        msg = candidate;
        if (candidate !== lastMessageRef.current) break;
      }
    }

    if (!msg) return;

    lastMessageRef.current = msg;
    setMessage(msg);
    setTimestamp(ts);
    setLeaving(false);
    setVisible(true);

    setTimeout(() => {
      setLeaving(true);
      setTimeout(() => setVisible(false), 400);
    }, 5000);
  }, [recentEvents]);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    timeoutRef.current = setTimeout(() => {
      showToast();
      intervalRef.current = setInterval(() => {
        showToast();
      }, (25 + Math.random() * 15) * 1000);
    }, 8000);

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [showToast]);

  if (!visible) return null;

  return (
    <div
      className={`fixed bottom-20 sm:bottom-4 right-4 z-40 max-w-xs sm:max-w-sm transition-all duration-400 ${
        leaving
          ? "opacity-0 translate-y-2"
          : "opacity-100 translate-y-0"
      }`}
      style={{ pointerEvents: "none" }}
      data-testid="activity-toast"
    >
      <div className="bg-gray-900/95 text-white rounded-lg px-4 py-3 shadow-lg flex items-start gap-2.5">
        <span className="text-lg flex-shrink-0 mt-0.5">🎂</span>
        <div className="min-w-0">
          <p className="text-sm leading-snug">{message}</p>
          {timestamp && (
            <p className="text-[11px] text-gray-400 mt-1">{timestamp}</p>
          )}
        </div>
      </div>
    </div>
  );
}

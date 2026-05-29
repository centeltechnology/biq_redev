# BakerIQ — Competitive Analysis

_Research conducted: May 2026_

---

## The Competitive Landscape

The market broadly splits into three groups of tools bakers use today.

### 1. General Small Business CRM Tools

These are what many bakers default to because baker-specific options aren't well known.

| Tool | Monthly Price | Notes |
|---|---|---|
| HoneyBook | $36–59/mo | Jumped ~90% in early 2025. Strong on contracts, proposals, client comms. Completely generic — no concept of cake tiers, serving counts, or complexity pricing. |
| Dubsado | $35–55/mo | Updated pricing Dec 2025 (Dubsado 3.0). More customizable workflows and forms. Also fully generic. |

Neither is built for bakers. Bakers use them because they didn't know better options exist.

---

### 2. Baker-Specific Back-Office Tools

Built for bakers, but focused on the *internal* side — recipe costing, ingredient tracking, cost calculations. The customer-facing experience is an afterthought.

| Tool | Monthly Price | Notes |
|---|---|---|
| CakeBoss | ~$12/mo yr1, ~$1.67/mo renewal ($149 then $20/yr) | Founded 2007. Strong recipe costing, ingredient tracking. Has a basic customer quote request link. No interactive pricing calculator. More of a back-office organizer than an order tool. |
| BakeProfit | Free / $6.99/mo | 10,000+ home bakers. Strong recipe costing, order tracking. No transaction fees — flat subscription only. No public interactive order page. |
| Craftybase | $24–99+/mo | Heavy inventory and manufacturing focus. More for product sellers than service bakers. Recipe costing and batch production tracking. |
| **Bake Diary** | **SHUT DOWN May 2025** | Was ~$7.50/mo. Popular in UK/Ireland. Recipe costing, recipe management, basic pricing. Shut down without warning. No migration tool. Thousands of bakers displaced with no replacement provided. |

---

### 3. Newer Marketplace + Order Tools

| Tool | Monthly Price | Notes |
|---|---|---|
| Castiron | Free (always) | Public storefront/order page + marketplace that puts bakers in front of buyers. Takes transaction fees. More of an Etsy-style listing experience than an interactive cake builder. |
| Bakesy | $9.99–$17.99/mo | iOS, Android, and web. Order management, invoicing, availability scheduling. 30-day free trial. Has a customer-facing storefront. Strong mobile experience. |

---

## Feature Comparison

| | **BakerIQ** | CakeBoss | BakeProfit | Bakesy | HoneyBook | Castiron |
|---|---|---|---|---|---|---|
| **Price** | Free–$9.99/mo + fees | ~$12/mo yr1, $1.67/mo renewal | Free / $6.99/mo | $9.99–$17.99/mo | $36–59/mo | Free + fees |
| **Interactive public order page** | ✅ Live price calculator | Basic link only | ❌ | ✅ Storefront listing | ❌ | ✅ Marketplace listing |
| **Structured lead capture** | ✅ | Partial | ❌ | Partial | ❌ | Partial |
| **Quote builder** | ✅ Line items, tax, deposit | Partial | ❌ | ✅ Invoicing | ✅ General | ❌ |
| **Online payments (Stripe)** | ✅ Built-in via Stripe Connect | ❌ | Via Square only | ✅ | ✅ | ✅ |
| **Recipe / ingredient costing** | Basic (cost+labor+overhead) | ✅ Strong | ✅ Strong | Partial | ❌ | ❌ |
| **Mobile app (iOS/Android)** | ❌ Web only | Limited | ❌ | ✅ | ✅ | ✅ |
| **Customer CRM** | ✅ | Partial | ❌ | Partial | ✅ | ❌ |
| **Order calendar** | ✅ | Partial | Partial | ✅ | ✅ | ❌ |
| **Email sequences / drip** | ✅ Full system | ❌ | ❌ | ❌ | ✅ | ❌ |
| **Social sharing tools** | ✅ QR, captions, banners | ❌ | ❌ | ❌ | ❌ | Partial |
| **Referral / affiliate program** | ✅ Two-tier | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Baker-specific** | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ |
| **Customer discovery / marketplace** | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| **One account, one order page** | Yes (by design) | Yes | N/A | Yes | N/A | Yes |

---

## Where BakerIQ Clearly Wins

### 1. The interactive order page is a genuine differentiator
The core concept — give customers a link, they configure their cake interactively, see a live price, and submit a complete structured request — is not well served by anyone else. CakeBoss, BakeProfit, and Craftybase are all internal tools. Castiron has a marketplace listing page, not an interactive cake builder. BakerIQ solves the right problem (DM chaos, incomplete requests, inconsistent pricing) in a distinct way.

### 2. Price vs HoneyBook and Dubsado is a very easy story to tell
A large number of bakers are paying $36–59/month for a generic tool that wasn't built for them. BakerIQ Pro at $9.99/month — purpose-built for baking, with the order page, lead capture, quoting, and payments all included — is a compelling switch. The FAQ comparison section already makes this case well.

### 3. The end-to-end flow no competitor matches
Order page → structured lead → one-click quote → Stripe deposit. No competitor joins all four steps cleanly for bakers. You either get a marketplace, or a back-office tool, or a generic CRM.

### 4. The "processing-first" model is smart positioning
Charging only when the baker gets paid is psychologically sound for the home baker audience. The break-even analysis on the plans page (Growth pays for itself at $1,000/month in orders, Pro at $1,250–1,500) is a well-presented piece of logic.

---

## Honest Gaps to Know About

### 1. Recipe costing is a meaningful hole
CakeBoss, BakeProfit, Craftybase, and the late Bake Diary all led with recipe costing — tracking ingredient costs, scaling recipes, showing profit margins per item. BakerIQ's Express Items tool does a basic version (material cost + labor + overhead) but there's no ingredient database, no recipe management, no way to update flour prices and see how that ripples through profitability. Serious bakers who care about margins will keep CakeBoss alongside BakerIQ rather than fully committing to one platform.

### 2. No mobile app
Bakesy has iOS and Android. Home bakers work from their phones constantly — checking incoming leads while at the grocery store, sending a quick quote from their car. Web-on-mobile works but a native app (or at minimum a deeply polished PWA) would remove friction that currently costs signups and retention.

### 3. The 7% free-tier fee is the highest in the category
BakeProfit charges $0 in transaction fees (flat monthly only). Castiron's fees are comparable but it also has marketplace discovery value. On a $300 cake order: 7% BakerIQ + 2.9%+$0.30 Stripe = ~$30 total. The upgrade path to 3% (Pro) is well-priced, but the free-tier friction is real at volume.

### 4. No customer discovery
Castiron helps bakers get found by new customers through their marketplace. BakerIQ assumes you already have an audience and helps you serve them better. That's a valid focus, but bakers just starting out with no social following have less reason to sign up.

### 5. One order page per account
Bakers who run separate lines (wedding cakes vs. everyday treats vs. corporate) can't segment their order pages. Not a dealbreaker today, but limits growth into slightly larger operations.

---

## The Most Significant Market Opportunity Right Now

**Bake Diary shut down permanently in May 2025** and left thousands of bakers stranded. Active conversations are happening in UK/Ireland baker Facebook groups, cottage food communities, and TikTok/Instagram about what to replace it with. Most of the "alternatives" coverage points to CakeBoss or BakeProfit — both of which are internal recipe tools, not what Bake Diary users need for the customer-facing order and quote workflow.

BakerIQ is arguably the best available replacement for the customer-facing side of the business these users lost. The window to reach them is probably 6–12 months before displaced bakers form habits elsewhere.

**Where they congregate:**
- Facebook groups: "Home Bakers UK", "Cake Decorators UK", UK/Ireland cottage food groups
- Reddit: r/cakedecorating, r/AskBaking, UK-focused food entrepreneur communities
- TikTok/Instagram: Baker content creators in the UK and Ireland who already have audiences

**Angle:** Not "we're a Bake Diary replacement" (limited positioning), but "here's what Bake Diary didn't do that you always wished it did" — the customer-facing order page, structured leads, online deposits. Frames BakerIQ as an upgrade rather than a like-for-like swap.

---

## Strategic Takeaways

| Priority | Observation |
|---|---|
| Short-term | The Bake Diary window is open now. Organic content in UK/Ireland baker communities could drive targeted signups with very low cost. |
| Short-term | The HoneyBook/Dubsado-to-BakerIQ switch story is easy, well-priced, and under-marketed. The FAQ comparison is good — it could be its own landing page. |
| Medium-term | Recipe costing depth is the most-requested feature category in the segment. Even a basic ingredient cost tracker would close the door on CakeBoss/BakeProfit for most bakers. |
| Medium-term | A polished mobile web experience (PWA) would partially close the Bakesy mobile gap without the cost of a native app. |
| Ongoing | The primary competitor for most signups isn't CakeBoss or Bakesy — it's spreadsheets and DMs. That audience is the largest pool. |

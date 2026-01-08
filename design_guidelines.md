# BakerIQ Design Guidelines

## Design Approach

**Hybrid Strategy:** Reference modern B2B SaaS aesthetics (Linear, Notion, Stripe) for the public calculator to project professionalism and trustworthiness. Use shadcn/ui design patterns for the dashboard to ensure efficiency and familiarity.

**Core Principles:**
- **Warmth Meets Professionalism:** Balance the warm pink/rose accent (#E91E63) with sophisticated slate grays to appeal to both bakers and their customers
- **Trust Through Clarity:** Clear pricing breakdowns, obvious next steps, transparent processes build confidence
- **Efficient Workflows:** Minimize clicks for bakers managing leads and quotes

## Typography System

**Font Stack:** Inter (via Google Fonts CDN)
- Display/Hero: 3.5rem (56px), font-weight 700, tight line-height (1.1)
- H1: 2.5rem (40px), font-weight 700, line-height 1.2
- H2: 1.875rem (30px), font-weight 600, line-height 1.3
- H3: 1.5rem (24px), font-weight 600, line-height 1.4
- Body Large: 1.125rem (18px), font-weight 400, line-height 1.6
- Body: 1rem (16px), font-weight 400, line-height 1.6
- Small/Caption: 0.875rem (14px), font-weight 400, line-height 1.5
- Labels: 0.875rem (14px), font-weight 500, uppercase tracking-wide

## Layout System

**Spacing Primitives:** Use Tailwind units of 2, 4, 6, 8, 12, 16, 20 for consistent rhythm
- Component padding: p-4 to p-6
- Section spacing: py-12 to py-20 on desktop, py-8 on mobile
- Card spacing: p-6 internally
- Form field gaps: space-y-4
- Button padding: px-6 py-3 for primary actions

**Grid Structure:**
- Public calculator: max-w-4xl centered container
- Dashboard: Fixed sidebar (w-64), main content with max-w-7xl
- Forms: Single column max-w-2xl for readability
- Tables: Full width with horizontal scroll on mobile

## Component Library

### Core UI Elements

**Cards:**
- White background with subtle border (border-slate-200)
- Rounded corners (rounded-lg)
- Soft shadow (shadow-sm, shadow-md on hover)
- Padding p-6

**Buttons:**
- Primary: Rose pink background, white text, rounded-lg, px-6 py-3, font-weight 600
- Secondary: Slate-200 background, slate-900 text, same dimensions
- Ghost: Transparent with hover background
- Destructive: Red for delete actions

**Tables:**
- Minimal borders (border-b on rows only)
- Zebra striping on alternate rows (slate-50)
- Fixed header on scroll for long lists
- Compact padding (px-4 py-3) for data density

**Forms:**
- Clear labels above inputs (font-weight 500)
- Input fields with border (border-slate-300), focus ring in pink
- Helper text below inputs (text-sm text-slate-600)
- Validation errors in red below fields
- Multi-step progress indicator for calculator

**Badges:**
- Rounded-full with colored backgrounds
- Uppercase text (text-xs font-semibold)
- Generous padding (px-3 py-1)
- Status colors as specified (New: blue, Contacted: yellow, etc.)

**Navigation:**
- Dashboard sidebar: Slate-900 background, white/slate-300 text
- Active state: Pink accent border-left (border-l-4) and pink text
- Icon + text layout with consistent spacing
- Collapsible on mobile with hamburger

### Data Displays

**Price Breakdown Cards:**
- Line items with dotted leaders between name and price
- Subtotal, tax, total hierarchy with visual weight (total is bold and larger)
- Grouped sections (Cake Tiers, Decorations, Delivery) with subheadings

**Lead/Quote Cards:**
- Customer name prominent (text-lg font-semibold)
- Event date and type secondary (text-sm text-slate-600)
- Price displayed large and right-aligned
- Status badge in top-right corner

## Public Calculator Design

**Layout Flow:**
- Full-width hero section (h-96) with background image of beautiful cakes
- Calculator contained in elevated card (shadow-xl) that sits over hero bottom edge
- Step-by-step progression with visual indicators
- Fixed summary sidebar on desktop, sticky bottom bar on mobile

**Interactive Elements:**
- Tier builder uses accordion pattern for each tier
- Selection cards for size/shape/flavor with radio button styling
- Checkbox grid for decorations with images
- Real-time price updates with smooth transitions
- Progress bar showing steps completed

**Trust Indicators:**
- Baker business name and contact in header
- "Estimate only" disclaimer prominent but not alarming
- Clear next steps messaging throughout

## Dashboard Design

**Overview Page:**
- Metric cards in grid (grid-cols-3 on desktop, grid-cols-1 on mobile)
- Each metric: Large number, small label, trend indicator
- Recent leads table (5 rows) with "View All" link
- Quick actions section with prominent "Create Quote" button

**Leads Table:**
- Sortable columns (date, customer, event date, total)
- Quick status change dropdown in row
- Row click opens detail drawer (slide-in from right)
- Bulk actions checkbox column

**Quote Builder:**
- Two-column layout: Form on left (2/3 width), summary on right (1/3 width)
- Line items in editable table with inline add/delete
- Auto-calculating totals section
- Sticky save bar at bottom

**Settings:**
- Simple form layout with grouped sections
- Public calculator URL prominently displayed with copy button
- Profile photo placeholder (circular, 120px)

## Images

**Hero Image (Public Calculator):**
- Full-width background image showing elegant, professional cake photography
- Subtle gradient overlay (slate-900 with 40% opacity) for text legibility
- Image should convey: quality, artistry, celebration
- Placement: Top of calculator page, h-96, object-cover

**Dashboard:**
- No hero images
- Optional: Empty state illustrations for zero leads/quotes (line drawings, not photos)

**Icons:**
- Use Heroicons (outline style) throughout via CDN
- Navigation: home, clipboard, document, user, cog
- Actions: pencil, trash, eye, plus-circle
- Status: check-circle, x-circle, clock, arrow-right

## Animations

**Minimal Motion:**
- Smooth transitions on hover (transition-all duration-200)
- Fade-in for toasts and modals
- Slide transitions for drawers and mobile menu
- Number count-up for totals (use lightweight library)
- NO scroll animations, parallax, or complex effects
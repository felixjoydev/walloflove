---
date: 2026-02-16
topic: signboard-technical-design
---

# SignBoard — Technical Design Brainstorm

## What We're Building

An embeddable guestbook widget where website visitors leave hand-drawn signatures, doodles, and short messages. Two sides: a **dashboard** (Next.js web app) where owners manage guestbooks, and a **widget** (lightweight embeddable JS) that lives on the owner's website.

## Key Technical Decisions

### 1. Drawing Implementation: Hybrid Approach
- **Capture**: HTML5 Canvas with `perfect-freehand` library for natural, pressure/speed-sensitive strokes
- **Storage**: Vector stroke data (array of points with pressure/timestamp) stored as JSONB in PostgreSQL
- **Display**: SVG rendering on the wall for scalability and animation support
- **Replay**: Stroke data enables drawing replay animation on hover (Phase 4)
- **Rationale**: Canvas gives the best drawing feel. Vector storage is compact and enables SVG rendering at any size. SVG paths enable the stroke replay animation described in Phase 4.

### 2. Tech Stack
- **Dashboard**: Next.js 15 (App Router) + TypeScript
- **Backend/Database**: Supabase (PostgreSQL + Auth + Storage + Realtime)
- **Widget**: Vanilla TypeScript, compiled to a single JS bundle (<50KB), Shadow DOM encapsulated
- **Hosting**: Vercel (dashboard + API routes + widget JS via Edge)
- **Payments**: Stripe (from day one)
- **Styling**: Tailwind CSS for dashboard; scoped CSS within Shadow DOM for widget

### 3. Why Supabase
- Auth handles signup/login/password reset — no custom auth code
- PostgreSQL for structured data + JSONB for stroke data
- Supabase Storage for rendered drawing thumbnails (PNG/SVG)
- Realtime subscriptions enable live wall updates (new entries appear instantly)
- Free tier covers launch through first few hundred users
- Pro tier ($25/mo) kicks in when revenue already exists

### 4. Widget Architecture
- Single `<script>` tag + `<div>` embed method
- Shadow DOM encapsulation to isolate styles bidirectionally
- Lazy-loads entries via paginated API calls
- Communicates with Supabase via REST API (not the JS SDK — keeps bundle tiny)
- Target: <50KB gzipped total (JS + CSS + drawing logic)
- Mobile-first touch support with scroll prevention during drawing

### 5. Data Model (High Level)
- **users**: Supabase Auth handles this
- **guestbooks**: id, user_id, name, settings (JSONB: theme, moderation mode, CTA text, field toggles), created_at
- **entries**: id, guestbook_id, name, message, link, stroke_data (JSONB), svg_path (text), thumbnail_url, status (pending/approved/rejected), visitor_hash (for rate limiting), created_at
- **subscriptions**: id, user_id, stripe_customer_id, stripe_subscription_id, plan, status

### 6. Stripe from Day One
- Three tiers: Free, Starter ($7/mo), Pro ($15/mo)
- Feature gating via plan field on user/subscription record
- Stripe Checkout for signup, Stripe Customer Portal for management
- Webhook handler for subscription events (created, updated, cancelled)

### 7. Spam Prevention
- Rate limiting: 3 entries/hour per visitor per guestbook (via hashed IP)
- Honeypot field (invisible to humans, bots fill it)
- Optional word filter
- Manual moderation mode as primary defense
- No CAPTCHA at launch

## Scope: Full Phase 1 + Phase 2

Not stripping anything down. The MVP ships with:
- User signup/login (Supabase Auth)
- Guestbook CRUD + embed code generation
- Full drawing canvas (pen colors, thickness, undo, clear)
- Masonry wall with lazy loading
- Message and link fields on entries
- Clickable entries with hover states
- Full theme customization with live preview
- Shadow DOM encapsulation
- Mobile drawing optimization
- Entry moderation (approve/reject/bulk)
- Rate limiting + spam prevention
- All loading/empty/error states
- Stripe billing (all three tiers)

## Open Questions
- Drawing canvas library: `perfect-freehand` vs building custom stroke smoothing? (Recommendation: use perfect-freehand — it's battle-tested, tiny, and handles the hard math)
- Should the widget use Supabase's REST API directly or go through Next.js API routes as a proxy? (Recommendation: proxy through Next.js API routes for security + rate limiting control)
- CDN strategy for widget JS can be revisited post-launch if Vercel Edge proves insufficient

## Next Steps
-> Proceed to `/workflows:plan` for full implementation plan with file structure, step-by-step tasks, and testing strategy

# Ascendr — Product Overview

Ascendr is a web platform for managing climbing competitions. It covers the full event lifecycle: setup, registration, live scoring, real-time leaderboards, and results — for both organizers running the event and competitors participating in it.

---

## Table of Contents

1. [Tech Stack](#tech-stack)
2. [Authentication](#authentication)
3. [User Profiles](#user-profiles)
4. [Competitions](#competitions)
5. [Boulders](#boulders)
6. [Scoring System](#scoring-system)
7. [Roles & Permissions](#roles--permissions)
8. [Registration Flow](#registration-flow)
9. [Judge Flow](#judge-flow)
10. [Leaderboard](#leaderboard)
11. [Analytics](#analytics)
12. [Payments & Pricing](#payments--pricing)
13. [White-Label Branding](#white-label-branding)
14. [Internationalization](#internationalization)
15. [Public Pages](#public-pages)
16. [API Endpoints](#api-endpoints)
17. [Database Schema](#database-schema)
18. [Security](#security)

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19 + TypeScript, Vite |
| Routing | React Router DOM (hash-based) |
| Styling | Tailwind CSS 4 |
| Animations | Framer Motion |
| 3D / Canvas | Three.js (landing page terrain) |
| Charts | Recharts |
| Database | Supabase PostgreSQL |
| Auth | Supabase Auth (email/password + Google OAuth) |
| Real-time | Supabase Realtime (WebSocket channels) |
| Payments | Stripe Checkout + Webhooks |
| Serverless | Vercel Functions (Node.js) |
| Hosting | Vercel |

---

## Authentication

Users can sign in via:

- **Email + password** — sign up requires display name and GDPR consent
- **Google OAuth** — via Supabase redirect flow or Google Identity Services (GSI) direct token path; both paths supported with automatic fallback

Additional auth flows:
- **Forgot password** — sends a reset link via email; user sets a new password on return
- **Password update** — available from the profile page for authenticated users

On first sign-in, Supabase triggers automatic creation of a `profiles` row for the user.

---

## User Profiles

Each user has a profile stored in the `profiles` table, editable from the Profile page:

| Field | Notes |
|---|---|
| Display name | Required; parsed into first/last name |
| Avatar | Image URL or base64 upload |
| Emoji | Optional single emoji shown as avatar fallback |
| Gender | Optional |
| Language | `en`, `es`, or `ca`; defaults to `ca` |
| Theme | `light` or `dark` |
| Location | Optional free text |
| Bio | Optional free text |

**Badges:** Users accumulate placement badges from competitions (1st, 2nd, 3rd per category or overall). Badges are stored as a JSON array on the profile.

---

## Competitions

### Lifecycle

Competitions move through four statuses:

| Status | Description |
|---|---|
| `DRAFT` | Setup phase. Settings and boulders are fully editable. Cannot go live without a paid subscription. |
| `LIVE` | Active event. Scoring is open. Limited settings edits. Requires active subscription. |
| `FINISHED` | Scoring closed. Results locked. Organizer marks this manually. |
| `ARCHIVED` | Soft-hidden. Removed from normal lists but not deleted. |

### Settings

- **Visibility** — `public` (discoverable by all) or `private` (invite code required)
- **Invite code** — 6-character alphanumeric code; unique across all competitions
- **Join password** — optional second gate after the invite code
- **Capacity** — base participant limit (300 Standard / 500 Premium) plus any purchased capacity bundles; overflow goes to waitlist
- **Locking** — organizer can freeze all scoring without changing the status
- **Self-scoring** — toggle whether competitors can log their own tops
- **Scoring method** — per-competition: `self_scoring`, `self_with_approval`, or `judge_required`
- **Rules** — multilingual text fields (en / es / ca)
- **Banned emails** — organizer can block specific email addresses from re-joining

### Competition Data Model

Core fields stored as a JSONB blob in `competitions.data`:

```
id, ownerId, name, description, location,
startDate, endDate, status, visibility, inviteCode,
scoringType, zoneScoring, attemptTracking, penaltyType, penaltyValue,
flashBonus, minScore, dynamicPot, minDynamicPoints, topKBoulders,
canSelfScore, scoringMethod, isLocked,
traits[], difficultyLevels[],
subscription, tier, participantLimit, additionalCapacity,
branding { logoUrl, accentColor, lightBg, darkBg },
rules { en, es, ca },
bannedEmails[]
```

---

## Boulders

Organizers define the problem list for each competition.

### Per-Boulder Fields

| Field | Description |
|---|---|
| Color | Hex + label (Red, Blue, Green, etc.) |
| Name | Optional display name |
| Difficulty | References a `DifficultyLevel` defined on the competition |
| Zone count | Number of intermediate zones (0 = no zones) |
| Status | `active`, `hidden`, or `removed` |
| Is puntuable | If true, only judges can log tops (overrides event-level self-scoring) |
| Flash bonus override | Per-boulder bonus for first-attempt tops |
| Attempt tracking override | Inherit from competition, or override |
| Penalty override | Inherit, force, or disable per-boulder |
| Max points | Override the event-level dynamic pot for this boulder |

Boulders are ordered by position. All changes to the boulder list are persisted as a delete-then-reinsert operation (preserves order atomically).

---

## Scoring System

### Traditional Scoring

Points are fixed per boulder. Final score = sum of all boulder scores.

**Per-boulder score:**
1. Start with base points (boulder's point value)
2. Add zone points (subject to `zoneScoring` mode)
3. Apply flash bonus if topped on first attempt
4. Apply attempt penalty for extra attempts

**Zone scoring modes (`zoneScoring`):**

| Mode | Effect |
|---|---|
| `adds_to_score` | Zone points always added, regardless of whether the boulder was topped |
| `with_top` | Zone points only added if the boulder was also topped |
| `without_top` | Zone points only added if the boulder was NOT topped (consolation) |
| `tie_breaker_only` | Zone counts for tiebreaking only; 0 points added |

**Attempt penalty types:**

| Type | Formula |
|---|---|
| `fixed` | `basePoints − penaltyValue × (attempts − 1)` |
| `percent` | `basePoints × (1 − penaltyValue%)^(attempts − 1)` |

A `minScore` floor prevents a boulder from contributing negative points.

**Flash bonus:** Extra points for topping on the first attempt. Configurable at event level or per boulder.

### Dynamic Pot Scoring

The point pool for each boulder is shared among all climbers who top it.

```
score = pot / number_of_toppers   (minimum: minDynamicPoints)
```

Zone points and attempt penalties apply on top of the shared score.

### Top-K Capping

When `topKBoulders` is set, only the best K boulder scores are counted toward the total. Lowest scores are discarded.

### Leaderboard Ranking

Tiebreaker chain (in order):

1. Total points (descending)
2. Total tops (descending)
3. Total attempts (ascending)
4. Total zones reached (descending)
5. Zone attempts (ascending)
6. Flash count (descending)

Tied competitors share the same rank. The next rank skips accordingly (e.g., two climbers at rank 2 → next rank is 4).

---

## Roles & Permissions

Roles are **per-competition** — the same user can be an organizer in one event and a competitor in another.

| Role | Who assigns it | Capabilities |
|---|---|---|
| **Competitor** | Self-join or organizer | Log own tops (if self-scoring enabled), view leaderboard, view own score |
| **Judge** | Organizer | Log tops for any competitor, access judging page; read-only on settings/users |
| **Organizer** | Competition owner | All judge capabilities + manage settings, boulders, members, roles, capacity, branding |
| **Owner** | Creator of the competition | All organizer capabilities + delete competition, manage subscription/billing |

Role changes are protected at the database level: a non-organizer cannot escalate their own role via direct API calls (enforced by an `BEFORE UPDATE` trigger on `competition_members`).

---

## Registration Flow

1. Competitor navigates to the join page (`/join/:code`) or enters an invite code on their profile
2. If the competition has a **join password**, they must enter it
3. If `requireTraits` is enabled, they must select at least one trait/category
4. Optional gender field
5. Capacity check:
   - If `active member count < participantLimit + additionalCapacity` → joined as `active`
   - Otherwise → joined as `waitlisted`
6. A bib number is auto-assigned (next available integer from 1)

Organizers can:
- Manually reassign bib numbers (must remain unique within the competition)
- Promote waitlisted competitors to active
- Remove competitors or add them directly (bypassing the invite flow)
- Ban email addresses

---

## Judge Flow

### Scoring Methods

| Method | Who can log tops |
|---|---|
| `self_scoring` | Competitors log their own tops; judges cannot override |
| `self_with_approval` | Competitors log; a judge must approve (`topValidated = true`) before the score counts |
| `judge_required` | Only judges/organizers can log tops; competitors have no scoring access |

Individual boulders marked **puntuable** always require judge validation regardless of the event-level scoring method.

### What Judges Record

For each competitor × boulder pair:

- **Top attempts** — number of tries to top
- **Zone attempts** — number of tries to reach a zone
- **Zones reached** — count of intermediate zones touched (0 to boulder.zoneCount)
- **Top validated** — boolean; marks the completion as approved
- **topValidatedBy** — user ID of the approving judge (for audit purposes)
- **topValidatedAt** — timestamp of approval

---

## Leaderboard

### Live Leaderboard (authenticated)

- Updates in real-time via Supabase Realtime WebSocket subscription
- If the WebSocket channel drops, a polling fallback kicks in every 20 seconds (REST fetch)
- Filterable by trait/category and gender
- Podium view for top 3 competitors
- Full ranked table with: rank, bib, name, avatar, total points, tops, attempts, zones, flashes, traits

### Public Leaderboard (`/results/:compId`)

- No authentication required
- Displays competition branding (logo, accent color) if Premium
- Theme toggle (light / dark)
- Share link button
- "Updated X min ago" timestamp refreshed every 60 seconds

### Leaderboard Export

Organizers can export results as CSV or JSON from the analytics/settings area.

---

## Analytics

The analytics dashboard (organizer only) shows:

- Total registered competitors
- Total boulders in the competition
- Average tops per athlete
- Participant distribution chart (bar chart by trait/category)
- Results filterable by selected traits (OR logic)

---

## Payments & Pricing

### Tiers

| | Standard | Premium |
|---|---|---|
| Price | €129 / event | €209 / event |
| Base capacity | 300 participants | 500 participants |
| Overage | €0.12 / participant | €0.10 / participant |
| White-label branding | No | Yes |

### Capacity Bundles (one-time add-ons)

| Bundle | Price |
|---|---|
| +150 slots | €19.99 |
| +300 slots | €34.99 |
| Custom (501+) | €0.105 / slot |

Bundle slots stack with the base limit and do not expire.

### Promo Codes

- Minimum 6 characters
- Grant a fixed number of free additional participant slots

### Payment Flow

1. Organizer selects a tier in Settings
2. Redirect to Stripe Checkout (hosted page)
3. On success, Stripe redirects back with `session_id`
4. `/api/verify-payment` confirms the session with Stripe and updates the competition record in the DB
5. Competition status transitions to `LIVE` automatically
6. `/api/stripe-webhook` handles async Stripe events (refunds, failures)

### Payments Table

Each transaction is recorded with: competition ID, user ID, Stripe session/payment IDs, amount (cents), currency (EUR), status, tier, and participant limit.

---

## White-Label Branding

Available on the **Premium** tier only. Organizers can configure:

| Field | Description |
|---|---|
| Logo URL | SVG or PNG; shown in the navbar and public leaderboard |
| Accent color | Primary brand color for buttons, badges, highlights |
| Light mode background | Custom background hex for light theme |
| Dark mode background | Custom background hex for dark theme |

Branding is applied on the internal leaderboard and the public results page. Non-Premium competitions use Ascendr defaults.

---

## Internationalization

Three supported languages: **English** (`en`), **Spanish** (`es`), **Catalan** (`ca`).

- All UI labels, buttons, messages, and error strings are translated
- Competition rules have separate multilingual text fields (`rules.en`, `rules.es`, `rules.ca`)
- The user's language preference is stored in their profile and persisted across sessions
- Language can be switched at any time from the nav; the URL prefix updates accordingly (`/:lang/...`)

---

## Public Pages

| Route | Description |
|---|---|
| `/` | Landing page — hero, features, pricing, CTA |
| `/:lang/auth` | Sign in / sign up / forgot password |
| `/results/:compId` | Public live leaderboard (no auth required) |
| `/:lang/join/:code` | Invite link — stores the code and redirects to auth |
| `/:lang/privacy` | Privacy policy |
| `/:lang/terms` | Terms of service |
| `/:lang/legal` | Legal notice |
| `/:lang/demo` | Demo page |

---

## API Endpoints

All serverless functions run on Vercel.

| Endpoint | Method | Description |
|---|---|---|
| `/api/create-checkout-session` | POST | Creates a Stripe Checkout session for a given competition, tier, and participant count |
| `/api/verify-payment` | POST | Verifies a Stripe session after redirect and updates the competition in the DB |
| `/api/stripe-webhook` | POST | Handles async Stripe events (payment success, failure, refund) |
| `/api/contact` | POST | Submits a contact form message via Resend email SDK |

---

## Database Schema

Tables in the `public` schema (all protected by Row-Level Security):

| Table | Description |
|---|---|
| `profiles` | One row per user; display name, avatar, emoji, language, theme, bio, location, trait IDs |
| `competitions` | Core competition record; metadata columns (`owner_id`, `status`, `visibility`, `invite_code`) + full JSONB `data` blob |
| `boulders` | One row per boulder; ordered by `position`; JSONB `data` blob |
| `competition_members` | One row per user × competition; `role`, `status`, `bib_number`, `trait_ids`, `gender` |
| `completions` | Composite PK `(competition_id, competitor_id, boulder_id)`; JSONB `data` blob with all scoring fields |
| `payments` | Stripe transaction records; status, amount, tier, participant limit |

### Indexes

- `competitions(owner_id)`, `competitions(status)`, `competitions(visibility)`
- `boulders(competition_id)`
- `competition_members(user_id)`
- `completions(competition_id)`
- `payments(competition_id)`, `payments(user_id)`

---

## Security

### Row-Level Security (RLS)

All tables have RLS enabled. Key policies:

- **competitions** — owner has full write access; all authenticated users can read
- **boulders** — readable by members; writable by owner or active organizer of that competition
- **competition_members** — readable by all authenticated users; insert/update/delete restricted to self-join or active organizer of the same competition
- **completions** — readable by members; writable by the competitor themselves or any judge/organizer of that competition
- **payments** — only the paying user can read their own payment records

### Additional Safeguards

- `CHECK` constraints on `competition_members.role` and `competition_members.status` enforce valid enum values at the DB level
- A `BEFORE UPDATE` trigger (`trg_prevent_self_role_status_change`) prevents non-organizers from escalating their own role via direct API calls
- The `organizer_update` RLS policy includes a `WITH CHECK` clause validating new values for `role` and `status`
- OAuth redirect URL uses `window.location.origin` dynamically, handling both `ascendr.top` and `www.ascendr.top` without hardcoding

# 16 — UI / UX Design Direction

How Annapoorna Link looks and feels, what we learned from existing food-rescue apps, and where we go further
for our users (caterers at 11 PM, shelter staff, volunteers on two-wheelers, in English and Telugu).

## 1. What we learned from the references

| App | What works | What we take | What doesn't fit us |
|---|---|---|---|
| **Olio** (peer-to-peer sharing) | Location header ("listings within 2 km of …"), filter chips, horizontal rails of food cards with a distance pill and a "Free" tag, warm rounded type, friendly tone | Location header, filter chips, distance pill on every card, section header with "All ›" | Photo-led cards (our donors post in a hurry at night; photos are optional), consumer marketplace feel |
| **Too Good To Go** (surplus marketplace) | One strong brand colour with cream surfaces, a single bold accent, the **pickup window** shown on the card, a big pill "Reserve" button, impact counters (meals saved, CO₂e avoided) | Brand colour + cream, pickup time as a first-class element, one big pill action per card, impact counters | Price and ratings (our food is donated), shopper-only flow (we have four roles) |

## 2. Where we do better for our problem

1. **Urgency is visible, not hidden.** Every listing shows a live **pickup countdown** ("Pickup by 10:30 PM · 1 h 20 min
   left") that turns from green → turmeric → chilli as time runs out. Cooked food has a safety window; the UI makes it obvious.
2. **Meals are the hero number.** Cards lead with "150 meals", not a photo or a price, because that is what a shelter
   plans around.
3. **Indian veg / non-veg marks.** The familiar green-dot and brown-triangle squares (as on food packets) instead of
   text, so the veg-only rule reads at a glance in any language.
4. **Progress on the card.** A five-step mini tracker (Posted → Matched → Volunteer → Picked up → Delivered) on each
   donor listing, so donors don't need to open it to know where their food is.
5. **Respond-by timer on offers.** Receivers see how long they have to accept before the offer moves to the next
   kitchen (10-minute cascade), with Accept as the single big action.
6. **Bilingual from the first pixel.** Every string in English and Telugu; layout tested with longer Telugu labels;
   Noto Sans Telugu self-hosted.
7. **Built for night-time, one-handed use.** 48 px+ tap targets, primary actions in thumb reach, high-contrast text
   on cream, no photos needed, small bundle.
8. **Honest data.** "Demo data" badges on every screen with sample data; impact numbers link to how they're calculated.

## 3. Visual system

| Token | Value | Use |
|---|---|---|
| `leaf-800` | `#164F2E` | Brand, top bar, primary buttons, theme colour |
| `leaf-700` | `#1C6339` | Primary button hover, active nav |
| `leaf-50` | `#EEF7F0` | Active nav pill, success surfaces |
| `turmeric-400` | `#F7B500` | Accent: "Post surplus" call to action, highlights |
| `turmeric-100` | `#FFF1C7` | Warning surfaces (pickup soon) |
| `chilli-600` | `#D2461F` | Urgent (pickup < 30 min, respond-by), errors |
| `cream` | `#FFF9EE` | Page background |
| `ink` | `#1D1B16` | Body text |

- **Type:** Noto Sans Telugu (Latin + Telugu), 16 px body, bold headings; numbers in bold and large on stat tiles.
- **Shape:** cards `rounded-2xl` with a soft shadow; buttons and chips are full pills.
- **Icons:** one simple line-icon set (inline SVG) for navigation and meta; emoji only for food category tiles.
- **Motion:** none beyond colour transitions; nothing that drains battery or distracts at night.

## 4. Components

| Component | Purpose |
|---|---|
| `Button` / `ButtonLink` | Pill buttons: primary (leaf), accent (turmeric), secondary (outline) |
| `Card` | White rounded surface used by every list item |
| `FilterChips` | Olio-style chips (e.g. All / Veg only / Ready now) |
| `VegMark` | Green-dot / brown-triangle food mark |
| `PickupCountdown` | Live "pickup by" chip with colour by urgency |
| `StatusSteps` | Five-step progress tracker on listing cards |
| `ListingCard` | Category tile, items, meals, veg mark, storage, donor + area, distance, countdown, status |
| `StatTile` | Big number + label for impact |
| `SectionHeader` | Section title with optional "All ›" link |
| `LocationHeader` | "Near · Kukatpally" header on receiver and volunteer homes |

## 5. Screen patterns

- **Login:** green hero with the bowl logo and tagline, a this-week impact strip, then four large role tiles.
- **Donor home:** greeting with org and area, a turmeric "Post surplus food" card, active listings with progress, and a
  small this-month impact row.
- **Receiver offers:** location header, filter chips, offer cards with match reason, respond-by timer and Accept.
- **Volunteer tasks:** availability switch, task cards showing from → to, distance, meals and deadline.
- **Sponsor dashboard:** large impact tiles (meals, kg, CO₂e, on-time rate) with a "How we calculate this" link.

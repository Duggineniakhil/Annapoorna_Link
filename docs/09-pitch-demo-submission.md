# 09 — Pitch, Demo & Submission
> **Presentation, 10%**, but the demo is also how judges *see* the other 90%. Structure everything around one wedding night in Hyderabad.

---

## 1. Pitch deck (8–10 slides)
| # | Slide | Content | Supports |
|---|---|---|---|
| 1 | Title | Annapoorna Link · "Surplus food to people, before it spoils" · Team names | — |
| 2 | One wedding night | 10:30 PM, 150 plates left; NGO calls unanswered; food in the bin; a shelter 6 km away short of meals | Problem & user |
| 3 | The problem | 2–3 cited numbers (food waste, hunger) + 1–2 real quotes from your calls | Problem & user |
| 4 | Why today's options fail | Phone calls, WhatsApp groups, fixed-route rescue services (doc 01 §5) | Problem & user |
| 5 | Our solution | Post in < 60 s · explainable matching · live pickup with handover codes · impact with assumptions | Working product |
| 6 | Live demo | (switch to demo) | Working product |
| 7 | Trust & safety | Safety cards, time windows, auto-expiry, "we don't certify", codes, synthetic data | Problem & user / build quality |
| 8 | How it works | Architecture, matching formula, state machine, SSE | Build quality |
| 9 | Built with Codebenders | Timeline, key prompts, 2 before/after iterations, screenshots | Use of Codebenders |
| 10 | Business & impact | Who pays (donor Pro, institutions, CSR, city), pricing, metrics, roadmap | Business viability |

Put the Must-Include mapping table (`02-product-spec.md §1`) in the appendix or on slide 5.

## 2. Demo video script (3–6 minutes; mandatory)
The organisers require a demo video of **3–6 minutes** covering the problem, why you chose it, the solution, and a walkthrough. A face cam isn't needed and a voiceover is optional. Record it during the Monday submission window, from footage of the final build captured before the Sunday commit cut-off.

| Time | Scene | Say |
|---|---|---|
| 0:00–0:30 | The wedding night (slides) | "It's 10:30 PM. A wedding in Kukatpally just ended with 150 plates left over. The caterer calls two NGOs; nobody answers. Six kilometres away, a shelter is short of meals tonight." |
| 0:30–1:15 | **Donor posts** on a phone: chips, storage Hot, pickup-by auto-filled, allergens → Post ("Posted in 38 s") | "The caterer posts in under a minute. The app suggests the latest pickup time from food-handling rules and never allows a later one." |
| 1:15–1:50 | **Receiver** (second window): offer arrives with reasons "2.4 km · needs 180 meals · veg accepted" → Accept → delivery code | "The best-matched kitchen gets the offer and sees exactly why it was chosen. If they decline, it moves to the next in seconds." |
| 1:50–2:40 | **Volunteer** on a phone: accept → Navigate → enter pickup code → deliver with code; donor and receiver timelines update live | "A student volunteer picks it up. Codes at both ends prove every handover, with no GPS tracking needed. Everyone sees the status live." |
| 2:40–3:10 | Safety card + an expired listing | "Every listing shows storage, allergens and a countdown. We never certify food; if the window passes, the listing expires." |
| 3:10–3:40 | **Impact**: donor counters + city dashboard + "How we calculate this" | "Only delivered food counts, and every number shows its assumptions." |
| 3:40–4:20 | Business model slide | "Receivers use it free. Caterers pay for scheduled pickups and impact certificates; CSR sponsors fund whole areas." |
| 4:20–5:00 | Built with Codebenders: Nexon planning a feature, the usage log, tests passing | "We built it in 36 hours in Codebenders, one planned, tested slice at a time." |

### Before any demo, recording or judging window
1. **Wake the API** 2 minutes before: open https://annapoorna-link-api.onrender.com/api/health and wait for `{"ok":true}`. The free Render tier sleeps after about 15 minutes idle, and the first request can take up to a minute.
2. Open https://annapoorna-link.vercel.app and refresh once, so the browser loads the newest version.
3. Sign in to each demo window (donor, kitchen, volunteer) before you start; veg food goes to Asha Night Shelter first.
4. Keep the one-tap **Watch the one-minute demo** as the fallback if a hand step stalls.
5. The live API keeps data in memory, so a restart resets it to the seeded demo data.

Tips:
- Use **split screen** for donor / receiver / volunteer, or the wedding-night demo scenario.
- Add English subtitles.
- Make the video complete on its own: if free hosting is asleep when judges look, the video is the main evidence.

## 3. LinkedIn post (draft)
> 🍲 We built **Annapoorna Link** at the **ACE Builders Hackathon 2026** by @Codebenders!
>
> After weddings and events in Hyderabad, good food often ends up in the bin, while shelters nearby run short.
>
> Annapoorna Link:
> ⏱️ lets caterers, halls, hostel messes and restaurants **post surplus in under a minute**
> 🎯 **matches** it to the best nearby shelter or community kitchen, and shows why
> 🛵 coordinates a **volunteer pickup**, with live status and handover codes
> 📊 shows **meals saved and waste avoided**, with every assumption visible
>
> Built end to end in the Codebenders IDE in 36 hours.
> 🔗 Demo: <link> · 💻 Code: <repo>
>
> #ACEBuilders #Codebenders #Hackathon #FoodRescue #ZeroWaste #Hyderabad

(Check the event's **LinkedIn Post Guidelines** tab for required hashtags.)

## 4. Final submission checklist
**Two deadlines:**
- **Code:** last commit before **Sun 22 Nov, 11:59 PM IST**. Commit times are tracked.
- **Form:** submit through the Codebenders dashboard by **Mon 23 Nov, 11:59 PM IST**. No code changes after Sunday.

- [ ] Final code pushed before Sunday 11:59 PM IST
- [ ] Project name (**Annapoorna Link**) + description (2–3 lines + feature bullets)
- [ ] Problem statement selected: **PS2, Rescue the Surplus** (only one)
- [ ] **Duo form:** both members' names, emails and phone numbers (both registered on app.codebenders.ai/hackathon)
- [ ] **Public GitHub repo** link (README complete, no secrets, commit history during the build window)
- [ ] **Demo video link, 3–6 min, mandatory** (unlisted YouTube / Drive with "anyone with link")
- [ ] Live app link: optional but strongly recommended (tested in incognito; API woken first, see "Before any demo" above)
- [ ] `CODEBENDERS_USAGE.md` with key prompts + iterations + screenshots
- [ ] LinkedIn post link
- [ ] Deck link (if used)
- [ ] All links open without login (check in incognito)
- [ ] Confirmation email/screenshot saved

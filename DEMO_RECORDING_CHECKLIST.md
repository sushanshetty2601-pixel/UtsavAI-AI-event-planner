# UtsavAI — Challenge 5 Demo Recording Checklist & Pre-Flight Guide

This guide ensures a smooth, flawless screen recording session for the Hack2Skill Challenge 5 video submission.

---

## 1. Pre-Flight System Setup

- [ ] **Local Dev Server Running:** Verify `npm run dev` is active on `http://localhost:3000`.
- [ ] **Display Resolution:** Set monitor / capture window strictly to **1920x1080 (16:9 1080p)**.
- [ ] **Browser Window:**
  - [ ] Use Google Chrome or Microsoft Edge in a clean profile.
  - [ ] Hide bookmark bars, extensions, and developer tools.
  - [ ] Zoom level set to 100% (`Ctrl + 0`).
- [ ] **Theme Check:**
  - [ ] Application starts in default **Midnight Gala (Dark Mode)**.
  - [ ] Verify light mode toggle is functional on the top header.
- [ ] **Recording Tool Settings (OBS Studio / Screen Studio):**
  - [ ] Output: 1080p, 60 FPS, Bitrate: 12,000–16,000 kbps (CBR).
  - [ ] Audio: 48 kHz stereo, mic input set to appropriate level (-6 dB peak).
  - [ ] Mouse cursor highlight: subtle ring or smooth motion enabled.

---

## 2. Seed Data & State Preparation

Before pressing record, choose one of these two flows:

### Option A: Fresh Event Flow (Recommended for Narrative Flow)
1. Navigate to `http://localhost:3000/settings` and click **"Clear All Data"** to ensure zero leftover test events.
2. Verify `http://localhost:3000/dashboard` shows the clean welcoming empty state.
3. You will record creating the event in Scene 2.

### Option B: Pre-Loaded Sample Event Flow (Fastest Recording Flow)
1. Navigate to `http://localhost:3000/` and click **"Load Demo Event"** from the hero.
2. This pre-populates the 50-guest celebration with sample vendors, multi-day ceremonies, and guest dietary preferences.

---

## 3. Scene-by-Scene Step-by-Step Recording Actions

### Scene 1: Landing Page & Brand Intro (`/`)
- [ ] Start on `http://localhost:3000/`.
- [ ] Let the cinematic video background play for 3–4 seconds.
- [ ] Hover over the **"Pause Scene"** / **"Play Scene"** pill in the bottom right corner.
- [ ] Click the **Theme Toggle** in the top right header: demonstrate light mode for 2 seconds, then click back to dark mode.
- [ ] Smoothly click the primary **"Get Started"** button in the header or hero.

### Scene 2: Event Creation Wizard (`/wizard`)
- [ ] Step 1: Select **"Wedding"** as the occasion.
- [ ] Step 2: Enter title: *"Rohan & Ananya's Royal Celebration"*, Guest Count: `250`, Budget: `1500000` (INR).
- [ ] Step 3: Check priorities: *Gourmet Catering*, *Aesthetic Décor*, *Candid Photography*.
- [ ] Step 4: Check Indian traditions: *Sangeet*, *Mehendi*, *Haldi*, *Reception*.
- [ ] Step 5: Click **"Generate Celebration Masterplan"**.
- [ ] Allow the celebration plan to generate and navigate to the Planner.

### Scene 3: Conversational AI Planner (`/planner`)
- [ ] Point cursor to the bottom multiline chat bar.
- [ ] Paste or type:  
  `I paid ₹80,000 advance to Royal Flavors Catering today`
- [ ] Press Enter or click the send button.
- [ ] Observe the response with the highlighted financial ledger card:
  - Quoted: ₹1,50,000
  - Recorded: ₹80,000
  - Remaining: ₹70,000
- [ ] Click the action button: **"Confirm & Record to Ledger"**.
- [ ] Watch the green confirmation toast appear in the top center.

### Scene 4: Budget Reality Check™ (`/budget`)
- [ ] Navigate to `/budget` from the left sidebar.
- [ ] Show the executive cards: Total Budget, Planned Commitments, Remaining Balance.
- [ ] Click the **"Simulate Over Budget (+₹80,000)"** button to trigger the Budget Reality Check banner.
- [ ] Scroll down to show the red overage badge (`+₹80,000 Over Budget`).
- [ ] Click **"Apply Alternative"** on one of the suggested trimmings to show dynamic budget rebalancing.
- [ ] Briefly click **"Allocation Builder"** to show the category target caps modal, then close it.

### Scene 5: Multi-Day Itinerary & Guest RSVP Copilot
- [ ] Navigate to `/timeline`:
  - [ ] Show the **Multi-Day Ceremonies** tab (Day 1: Mehendi & Sangeet; Day 2: Haldi & Pheras).
  - [ ] Switch to **Task Checklist** tab; click a checkmark to show the confetti animation.
- [ ] Navigate to `/guests`:
  - [ ] Show the dietary breakdown pills: `Jain (2)`, `Vegetarian (4)`, `Halal (1)`, `Vegan (1)`.
  - [ ] Switch between **List View** and **Table View**.
  - [ ] Click **"Auto-Seat Unassigned Guests"** and observe the table assignment cards.

### Scene 6: Day-of Coordinator Handout & Real Exports (`/vendors` & `/budget`)
- [ ] Navigate to `/vendors`:
  - [ ] Show the itemized vendor list (Royal Flavors Catering showing ₹80,000 paid and ₹70,000 balance).
  - [ ] Click the **"Coordinator Handout Sheet"** button at the top.
  - [ ] In the modal, scroll through the Day-of Schedule, Dietary confirmed numbers, and the Vendor Settlement balance ledger with signature lines.
  - [ ] Close the modal.
- [ ] Navigate to `/budget`:
  - [ ] Click **"Export Excel (.xlsx)"** — show browser download indicator of the real `.xlsx` workbook.
  - [ ] Click **"Download PNG"** — show browser download indicator of the high-res 1200x630 chart.

### Scene 7: Multimodal Inspiration Studio & Wrap-up (`/inspiration`)
- [ ] Navigate to `/inspiration`:
  - [ ] Scroll past the Curated Reference Themes (Royal Mandap, Ivory Floral Canopy).
  - [ ] Open the **AI Photo Studio** tab.
  - [ ] Click on an existing photo analysis to reveal:
    - Dominant color swatches
    - Seating style & floral notes
    - Table/chair guest calculation
- [ ] Return to `/` (Homepage) for the final closing shot.

---

## 4. Post-Recording Verification

- [ ] Video playback has zero stuttering or frame drops (60 FPS maintained).
- [ ] Audio voiceover is loud, crisp, and synchronized with on-screen clicks.
- [ ] No personal bookmarks, notifications, or operating system popups recorded.
- [ ] Video duration is between **2:15 and 2:45 minutes**.

---

## 5. Live Evaluator Fast-Track Journey

For judges and evaluators reviewing the live application, recommend this **3-minute high-impact walkthrough**:

1. **Step 1 — One-Click Experience (Landing Page `/`):**
   - Click **"Load Demo Event"** on the hero header.
   - Instantly loads the 50-guest celebration with realistic vendor quotes, multi-day ceremonies, and guest dietary profiles.
2. **Step 2 — Executive Command Center (`/dashboard`):**
   - Inspect the interactive Recharts spend donut chart, budget KPIs, and click **"Coordinator Handout Sheet"** to preview the print-ready coordinator PDF.
3. **Step 3 — Conversational AI Copilot (`/planner`):**
   - Type *"I paid ₹20,000 to the cake vendor"* or *"How much have I paid so far?"*
   - Observe the instant itemized financial breakdown and click **"Confirm & Record to Ledger"**.
4. **Step 4 — Budget Reality Check™ (`/budget`):**
   - Click **"Simulate Over Budget"** to view the live rupee overrun calculation and apply a recommended category trimming alternative.
5. **Step 5 — Multi-Day & Guest Hospitality (`/timeline` & `/guests`):**
   - Review multi-day ceremony cards (Mehendi, Sangeet, Pheras) with coordinator details.
   - Switch to `/guests` to view Jain/Halal dietary tags and run the **"Auto-Seat Unassigned Guests"** table grouping.
6. **Step 6 — Clean Reversibility Check (`/dashboard`):**
   - Click the amber **"Exit Demo"** button in the header and confirm.
   - Notice the application resets cleanly to zero without orphan data.

---

## 6. Public Deployment & Gemini API Setup

Before sharing the public demo link with evaluators:

1. **Host on Render or Vercel:**
   - Build Command: `npm install && npm run build`
   - Start Command: `npm run start`
   - Node Version: `20.x`
2. **Configure Environment Secrets:**
   - Set `GEMINI_API_KEY` in the hosting provider's dashboard (never committed to git).
   - Set `GEMINI_FAST_MODEL=gemini-2.5-flash` and `GEMINI_PRO_MODEL=gemini-2.5-pro`.
3. **Verify Server-Side Isolation:**
   - Confirm that `GEMINI_API_KEY` is not present in client-side network responses or browser storage.
4. **Resilient Fallback Check:**
   - Even if the API key encounters rate limits or is omitted, UtsavAI's rule-based celebration planning engine seamlessly answers prompts and balances budgets without throwing runtime errors.

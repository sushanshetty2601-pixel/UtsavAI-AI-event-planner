"use client";

import React, { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useApp } from "@/contexts/app-context";
import { AppShell } from "@/components/app-shell";
import { OccasionType, DEFAULT_CURRENCY, CURRENCIES } from "@/types";
import {
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Check,
  Loader2,
  AlertCircle,
} from "lucide-react";

// All available priority categories
const ALL_PRIORITIES = [
  { id: "catering", label: "Gourmet Food & Catering" },
  { id: "decoration", label: "Aesthetic Décor & Florals" },
  { id: "photography", label: "Photography & Videography" },
  { id: "venue", label: "Premium Venue" },
  { id: "entertainment", label: "Music, DJ & Entertainment" },
  { id: "cake", label: "Designer Cake & Desserts" },
  { id: "invitations", label: "Invitations & Stationery" },
  { id: "transport", label: "Guest Transport" },
  { id: "makeup", label: "Hair, Makeup & Styling" },
  { id: "gifts", label: "Gifts & Favours" },
];

// Occasion-specific sub-step questions
function OccasionSubQuestions({
  occasion,
  extraData,
  setExtraData,
}: {
  occasion: OccasionType;
  extraData: Record<string, string>;
  setExtraData: (d: Record<string, string>) => void;
}) {
  const update = (key: string, val: string) =>
    setExtraData({ ...extraData, [key]: val });

  const inputCls =
    "w-full px-3.5 py-2.5 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/40";
  const selectCls =
    "w-full px-3.5 py-2.5 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/40";

  if (occasion === "wedding") {
    return (
      <div className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-foreground mb-1.5">
            Religious / Cultural Tradition
          </label>
          <select
            value={extraData.weddingTradition || ""}
            onChange={(e) => update("weddingTradition", e.target.value)}
            className={selectCls}
          >
            <option value="">Select tradition…</option>
            <option value="hindu">Hindu</option>
            <option value="muslim">Muslim (Nikah)</option>
            <option value="sikh">Sikh (Anand Karaj)</option>
            <option value="christian">Christian</option>
            <option value="jain">Jain</option>
            <option value="civil">Civil / Registered</option>
            <option value="interfaith">Interfaith</option>
            <option value="other">Other</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-foreground mb-1.5">
            Ceremonies Planned
          </label>
          <input
            type="text"
            value={extraData.ceremonies || ""}
            onChange={(e) => update("ceremonies", e.target.value)}
            placeholder="e.g. Mehendi, Sangeet, Reception, Pheras"
            className={inputCls}
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-foreground mb-1.5">
            Approximate Number of Wedding Days
          </label>
          <select
            value={extraData.weddingDays || "1"}
            onChange={(e) => update("weddingDays", e.target.value)}
            className={selectCls}
          >
            <option value="1">1 Day (Single ceremony)</option>
            <option value="2">2 Days</option>
            <option value="3">3 Days (Full celebration)</option>
            <option value="4+">4+ Days (Grand celebration)</option>
          </select>
        </div>
      </div>
    );
  }

  if (occasion === "birthday") {
    return (
      <div className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-foreground mb-1.5">
            Age Group of the Celebrant
          </label>
          <select
            value={extraData.ageGroup || ""}
            onChange={(e) => update("ageGroup", e.target.value)}
            className={selectCls}
          >
            <option value="">Select age group…</option>
            <option value="baby">Baby / Toddler (0–3 years)</option>
            <option value="kids">Kids (4–12 years)</option>
            <option value="teen">Teen (13–17 years)</option>
            <option value="young-adult">Young Adult (18–29 years)</option>
            <option value="adult">Adult (30–50 years)</option>
            <option value="senior">Senior (51+ years)</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-foreground mb-1.5">
            Party Setting
          </label>
          <select
            value={extraData.partyType || ""}
            onChange={(e) => update("partyType", e.target.value)}
            className={selectCls}
          >
            <option value="">Choose setting…</option>
            <option value="indoor-home">Indoor – Home</option>
            <option value="indoor-hall">Indoor – Banquet Hall / Venue</option>
            <option value="outdoor-garden">Outdoor – Garden / Lawn</option>
            <option value="outdoor-terrace">Outdoor – Rooftop / Terrace</option>
            <option value="hybrid">Mixed Indoor & Outdoor</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-foreground mb-1.5">
            Activities & Entertainment
          </label>
          <input
            type="text"
            value={extraData.activities || ""}
            onChange={(e) => update("activities", e.target.value)}
            placeholder="e.g. Magician, photo booth, outdoor games, karaoke"
            className={inputCls}
          />
        </div>
      </div>
    );
  }

  if (occasion === "anniversary") {
    return (
      <div className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-foreground mb-1.5">
            Anniversary Milestone
          </label>
          <select
            value={extraData.milestone || ""}
            onChange={(e) => update("milestone", e.target.value)}
            className={selectCls}
          >
            <option value="">Select milestone…</option>
            <option value="1st">1st – Paper / Cotton</option>
            <option value="5th">5th – Wood</option>
            <option value="10th">10th – Tin / Aluminium</option>
            <option value="25th">25th – Silver</option>
            <option value="50th">50th – Golden</option>
            <option value="other">Other</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-foreground mb-1.5">
            Celebration Style
          </label>
          <select
            value={extraData.anniversaryStyle || ""}
            onChange={(e) => update("anniversaryStyle", e.target.value)}
            className={selectCls}
          >
            <option value="">Choose style…</option>
            <option value="intimate">Intimate dinner for two</option>
            <option value="small-gathering">Small family gathering</option>
            <option value="party">Full party with friends & family</option>
            <option value="trip">Destination trip / getaway</option>
            <option value="surprise">Surprise event</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-foreground mb-1.5">
            Couple&apos;s Shared Interests
          </label>
          <input
            type="text"
            value={extraData.coupleInterests || ""}
            onChange={(e) => update("coupleInterests", e.target.value)}
            placeholder="e.g. Travel, music, cooking, hiking"
            className={inputCls}
          />
        </div>
      </div>
    );
  }

  if (occasion === "community") {
    return (
      <div className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-foreground mb-1.5">
            Type of Community Event
          </label>
          <select
            value={extraData.communityType || ""}
            onChange={(e) => update("communityType", e.target.value)}
            className={selectCls}
          >
            <option value="">Select type…</option>
            <option value="reunion">Family / School Reunion</option>
            <option value="festival">Cultural Festival</option>
            <option value="charity">Charity Gala</option>
            <option value="corporate">Corporate Celebration</option>
            <option value="religious">Religious / Puja Gathering</option>
            <option value="sports">Sports Day / Tournament</option>
            <option value="other">Other</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-foreground mb-1.5">
            Venue Capacity Requirement
          </label>
          <select
            value={extraData.venueCapacity || ""}
            onChange={(e) => update("venueCapacity", e.target.value)}
            className={selectCls}
          >
            <option value="">Choose capacity…</option>
            <option value="small">Small (up to 50)</option>
            <option value="medium">Medium (51–200)</option>
            <option value="large">Large (201–500)</option>
            <option value="very-large">Very Large (500+)</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-foreground mb-1.5">
            Special Permissions / Requirements
          </label>
          <input
            type="text"
            value={extraData.permissions || ""}
            onChange={(e) => update("permissions", e.target.value)}
            placeholder="e.g. Road closure NOC, police permission, sound permit"
            className={inputCls}
          />
        </div>
      </div>
    );
  }

  // "other" occasion
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-xs font-semibold text-foreground mb-1.5">
          Describe Your Celebration
        </label>
        <input
          type="text"
          value={extraData.otherDescription || ""}
          onChange={(e) => update("otherDescription", e.target.value)}
          placeholder="e.g. Baby shower, housewarming, graduation party"
          className={inputCls}
        />
      </div>
      <div>
        <label className="block text-xs font-semibold text-foreground mb-1.5">
          Special Requirements
        </label>
        <input
          type="text"
          value={extraData.specialRequirements || ""}
          onChange={(e) => update("specialRequirements", e.target.value)}
          placeholder="e.g. Children-friendly, accessible venue, live music"
          className={inputCls}
        />
      </div>
    </div>
  );
}

function WizardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { createEvent, savePlan } = useApp();

  const urlOccasion = searchParams.get("occasion");
  const validOccasion =
    urlOccasion && ["wedding", "birthday", "anniversary", "community", "other"].includes(urlOccasion)
      ? (urlOccasion as OccasionType)
      : null;

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("");
  const [error, setError] = useState<string | null>(null);

  // Form State — initialize from URL parameter if provided, otherwise default to wedding
  const [occasion, setOccasion] = useState<OccasionType>(validOccasion || "wedding");
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [location, setLocation] = useState("");
  const [guestCount, setGuestCount] = useState<number | "">(50);
  const [venueSetting, setVenueSetting] = useState<"indoor" | "outdoor" | "undecided">("indoor");

  // Budget — empty defaults
  const [budget, setBudget] = useState<number | "">(25000);
  const currencyCode = "INR";
  const [contingencyReserve, setContingencyReserve] = useState<number | "">(0);

  // Priority categories — uncapped multi-select
  const [priorities, setPriorities] = useState<string[]>([]);

  // Preferences — minimal, non-pre-filled
  const [themeStyle, setThemeStyle] = useState("");
  const foodPreferences = "";
  const [dietaryRequirements, setDietaryRequirements] = useState("");
  const [culturalConsiderations, setCulturalConsiderations] = useState("");
  const [specialRequests, setSpecialRequests] = useState("");

  // Occasion-specific extra data
  const [extraData, setExtraData] = useState<Record<string, string>>({});

  // Today's date string for min date — stored in state so it's only computed client-side
  const [todayStr] = useState(() => new Date().toISOString().split("T")[0]);

  const togglePriority = (key: string) => {
    setPriorities((prev) =>
      prev.includes(key) ? prev.filter((p) => p !== key) : [...prev, key]
    );
  };

  const handleNext = () => {
    setError(null);
    if (step === 2) {
      if (!title.trim()) {
        setError("Please enter a celebration title.");
        return;
      }
      if (!date) {
        setError("Please choose a valid event date.");
        return;
      }
      if (todayStr && date < todayStr) {
        setError("Event date must be in the future.");
        return;
      }
      const gc = Number(guestCount);
      if (!gc || gc <= 0) {
        setError("Guest count must be greater than zero.");
        return;
      }
    }
    if (step === 3) {
      const b = Number(budget);
      if (!b || b <= 0) {
        setError("Budget must be a positive number.");
        return;
      }
    }
    setStep((prev) => Math.min(prev + 1, 5));
  };

  const handleBack = () => {
    setError(null);
    setStep((prev) => Math.max(prev - 1, 1));
  };

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);

    const steps = [
      "Analyzing guest count and celebration style...",
      "Allocating mathematically optimal category budgets...",
      "Drafting personalized creative themes & color palettes...",
      "Generating timeline schedule & vendor milestones...",
      "Finalizing your UtsavAI Celebration Plan...",
    ];

    let i = 0;
    setLoadingMessage(steps[0]);
    const interval = setInterval(() => {
      i++;
      if (i < steps.length) {
        setLoadingMessage(steps[i]);
      }
    }, 900);

    try {
      const selectedCurrency =
        CURRENCIES.find((c) => c.code === currencyCode) || DEFAULT_CURRENCY;

      // Build preferences — merge occasion-specific extra data into culturalConsiderations
      const occasionContext = Object.entries(extraData)
        .map(([k, v]) => `${k}: ${v}`)
        .join("; ");

      const mergedCultural = [culturalConsiderations, occasionContext]
        .filter(Boolean)
        .join(". ");

      // 1. Create Event
      const newEvent = createEvent({
        title: title.trim() || `${occasion.charAt(0).toUpperCase() + occasion.slice(1)} Celebration`,
        occasion,
        date,
        startTime: startTime || "18:00",
        endTime: endTime || "22:00",
        location: location.trim() || "India",
        guestCount: Number(guestCount) || 50,
        budget: Number(budget) || 25000,
        currency: selectedCurrency,
        contingencyReserve: Number(contingencyReserve) || 0,
        preferences: {
          themeStyle: themeStyle.trim() || "",
          colorPreferences: "",
          foodPreferences: foodPreferences.trim() || "",
          dietaryRequirements: dietaryRequirements.trim() || "",
          culturalConsiderations: mergedCultural || "",
          desiredAtmosphere: "",
          specialRequests: specialRequests.trim() || "",
          priorities,
          venueSetting,
        },
        notes: `Created via UtsavAI Wizard on ${new Date().toLocaleDateString("en-IN")}`,
        isDemoEvent: false,
      });

      // 2. Call Plan API (Server-side Gemini with graceful fallback)
      const res = await fetch("/api/plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventId: newEvent.id,
          title: newEvent.title,
          occasion: newEvent.occasion,
          guestCount: newEvent.guestCount,
          budget: newEvent.budget,
          currencyCode: selectedCurrency.code,
          currencySymbol: selectedCurrency.symbol,
          location: newEvent.location,
          preferences: newEvent.preferences,
        }),
      });

      const planData = await res.json();
      clearInterval(interval);

      if (planData && !planData.error) {
        savePlan(planData);
        router.push("/planner");
      } else {
        router.push("/dashboard");
      }
    } catch (err) {
      clearInterval(interval);
      console.error("Plan generation error", err);
      router.push("/dashboard");
    } finally {
      setLoading(false);
    }
  };

  const occasionLabels: Record<string, string> = {
    wedding: "Wedding",
    birthday: "Birthday",
    anniversary: "Anniversary",
    community: "Community Event",
    other: "Other Celebration",
  };

  return (
    <AppShell>
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Wizard Header */}
        <div className="text-center space-y-2">
          <span className="text-xs font-bold uppercase tracking-widest text-primary">
            Step {step} of 5
          </span>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-foreground">
            Create Your Celebration Plan
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Provide a few key details and let UtsavAI craft an actionable, budget-conscious celebration masterplan.
          </p>
        </div>

        {/* Step Progress Pills */}
        <div className="flex items-center justify-between max-w-xl mx-auto px-4">
          {[
            { s: 1, label: "Occasion" },
            { s: 2, label: "Details" },
            { s: 3, label: "Budget" },
            { s: 4, label: "Style" },
            { s: 5, label: "Review" },
          ].map((st) => (
            <div key={st.s} className="flex flex-col items-center gap-1.5">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                  step === st.s
                    ? "gradient-cta text-white shadow-md scale-110"
                    : step > st.s
                    ? "bg-sage text-white"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {step > st.s ? <Check className="w-4 h-4" /> : st.s}
              </div>
              <span className="text-[11px] font-medium text-muted-foreground hidden sm:block">
                {st.label}
              </span>
            </div>
          ))}
        </div>

        {/* Error notification */}
        {error && (
          <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 text-xs font-medium flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Wizard Body Card */}
        <div className="rounded-3xl border border-border bg-card p-6 sm:p-8 shadow-card">
          {/* STEP 1: Occasion */}
          {step === 1 && (
            <div className="space-y-6 animate-in fade-in">
              <div>
                <h3 className="font-serif text-xl font-bold">What are you celebrating?</h3>
                <p className="text-xs text-muted-foreground">Choose the occasion type for your celebration.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { id: "wedding", label: "Wedding", desc: "Marriage, Reception or Sangeet", icon: "💍" },
                  { id: "birthday", label: "Birthday", desc: "Milestones, Kids & Adult Parties", icon: "🎂" },
                  { id: "anniversary", label: "Anniversary", desc: "Love, Silver & Golden Milestones", icon: "💑" },
                  { id: "community", label: "Community Event", desc: "Reunions, Gatherings & Festivals", icon: "🎊" },
                  { id: "other", label: "Other Celebration", desc: "Baby Shower, Housewarming, etc.", icon: "🎉" },
                ].map((item) => {
                  const isSelected = occasion === item.id;
                  return (
                    <div
                      key={item.id}
                      onClick={() => {
                        setOccasion(item.id as OccasionType);
                        setExtraData({}); // reset extra data when switching occasion
                      }}
                      className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center gap-4 ${
                        isSelected
                          ? "border-primary bg-primary/5 shadow-xs ring-2 ring-primary/20"
                          : "border-border hover:bg-muted/50"
                      }`}
                    >
                      <span className="text-3xl">{item.icon}</span>
                      <div>
                        <p className="text-sm font-bold text-foreground">{item.label}</p>
                        <p className="text-xs text-muted-foreground">{item.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Occasion-specific sub-questions on Step 1 */}
              <div className="pt-4 border-t border-border">
                <p className="text-xs font-semibold text-foreground mb-3">
                  {occasionLabels[occasion]}-specific details
                </p>
                <OccasionSubQuestions
                  occasion={occasion}
                  extraData={extraData}
                  setExtraData={setExtraData}
                />
              </div>
            </div>
          )}

          {/* STEP 2: Event Details */}
          {step === 2 && (
            <div className="space-y-5 animate-in fade-in">
              <div>
                <h3 className="font-serif text-xl font-bold">Event Details</h3>
                <p className="text-xs text-muted-foreground">Tell us where and when the event takes place.</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1.5">
                    Celebration Title *
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder={
                      occasion === "wedding"
                        ? "e.g. Priya & Rahul's Wedding"
                        : occasion === "birthday"
                        ? "e.g. Arjun's 30th Birthday Celebration"
                        : occasion === "anniversary"
                        ? "e.g. Sharma's 25th Silver Anniversary"
                        : occasion === "community"
                        ? "e.g. Sundar Colony Annual Diwali Fest"
                        : "e.g. Neha's Baby Shower"
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-foreground mb-1.5">
                      Event Date *
                    </label>
                    <input
                      type="date"
                      value={date}
                      min={todayStr}
                      onChange={(e) => setDate(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-foreground mb-1.5">
                      City / Location
                    </label>
                    <input
                      type="text"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      placeholder="e.g. Mumbai, Maharashtra"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-foreground mb-1.5">
                      Expected Guest Count *
                    </label>
                    <input
                      type="number"
                      min={1}
                      value={guestCount}
                      onChange={(e) =>
                        setGuestCount(e.target.value === "" ? "" : Number(e.target.value))
                      }
                      placeholder="e.g. 100"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-foreground mb-1.5">
                      Venue Setting
                    </label>
                    <select
                      value={venueSetting}
                      onChange={(e) =>
                        setVenueSetting(e.target.value as "indoor" | "outdoor" | "undecided")
                      }
                      className="w-full px-3.5 py-2.5 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                    >
                      <option value="indoor">Indoor Banquet / Hall</option>
                      <option value="outdoor">Outdoor Lawn / Garden</option>
                      <option value="undecided">Undecided / Flexible</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-foreground mb-1.5">Start Time</label>
                    <input
                      type="time"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl border border-input bg-background text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-foreground mb-1.5">End Time</label>
                    <input
                      type="time"
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl border border-input bg-background text-sm"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: Budget & Priorities */}
          {step === 3 && (
            <div className="space-y-5 animate-in fade-in">
              <div>
                <h3 className="font-serif text-xl font-bold">Budget & Priorities</h3>
                <p className="text-xs text-muted-foreground">
                  Indian Rupees (₹ INR) is the default currency. You can adjust anytime in Settings.
                </p>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-foreground mb-1.5">
                      Total Budget (INR) *
                    </label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-2.5 font-bold text-primary">₹</span>
                      <input
                        type="number"
                        min={1000}
                        step={500}
                        value={budget}
                        onChange={(e) =>
                          setBudget(e.target.value === "" ? "" : Number(e.target.value))
                        }
                        placeholder="e.g. 75000"
                        className="w-full pl-8 pr-3.5 py-2.5 rounded-xl border border-input bg-background text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary/40"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-foreground mb-1.5">
                      Contingency Reserve (INR)
                    </label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-2.5 font-bold text-muted-foreground">₹</span>
                      <input
                        type="number"
                        min={0}
                        step={100}
                        value={contingencyReserve}
                        onChange={(e) =>
                          setContingencyReserve(e.target.value === "" ? "" : Number(e.target.value))
                        }
                        placeholder="e.g. 5000"
                        className="w-full pl-8 pr-3.5 py-2.5 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                      />
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-1">Optional safety buffer for surprises</p>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-foreground mb-2">
                    Priority Categories{" "}
                    <span className="text-muted-foreground font-normal">(Select any — no limit)</span>
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {ALL_PRIORITIES.map((p) => {
                      const isChecked = priorities.includes(p.id);
                      return (
                        <button
                          type="button"
                          key={p.id}
                          onClick={() => togglePriority(p.id)}
                          className={`p-2.5 rounded-xl border text-xs font-semibold transition-all text-left flex items-center gap-2 ${
                            isChecked
                              ? "bg-primary text-white border-primary shadow-xs"
                              : "border-border bg-card text-muted-foreground hover:bg-muted"
                          }`}
                        >
                          {isChecked && <Check className="w-3 h-3 shrink-0" />}
                          <span>{p.label}</span>
                        </button>
                      );
                    })}
                  </div>
                  {priorities.length > 0 && (
                    <p className="text-[11px] text-primary font-medium mt-2">
                      {priorities.length} categor{priorities.length === 1 ? "y" : "ies"} prioritized
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: Style & Preferences */}
          {step === 4 && (
            <div className="space-y-4 animate-in fade-in">
              <div>
                <h3 className="font-serif text-xl font-bold">Style & Preferences</h3>
                <p className="text-xs text-muted-foreground">Help UtsavAI personalize the celebration. All fields optional.</p>
              </div>

              <div className="space-y-3.5">
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">
                    Theme / Aesthetic Style
                  </label>
                  <input
                    type="text"
                    value={themeStyle}
                    onChange={(e) => setThemeStyle(e.target.value)}
                    placeholder="e.g. Rose gold elegance, floral bohemian, modern minimalist"
                    className="w-full px-3.5 py-2 rounded-xl border border-input bg-background text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">
                    Food Style & Dietary Requirements
                  </label>
                  <input
                    type="text"
                    value={dietaryRequirements}
                    onChange={(e) => setDietaryRequirements(e.target.value)}
                    placeholder="e.g. 50% vegetarian, Jain options required, nut-free desserts"
                    className="w-full px-3.5 py-2 rounded-xl border border-input bg-background text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">
                    Cultural & Family Considerations
                  </label>
                  <input
                    type="text"
                    value={culturalConsiderations}
                    onChange={(e) => setCulturalConsiderations(e.target.value)}
                    placeholder="e.g. Multi-generational family, elderly guests need accessibility"
                    className="w-full px-3.5 py-2 rounded-xl border border-input bg-background text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">
                    Special Requests
                  </label>
                  <input
                    type="text"
                    value={specialRequests}
                    onChange={(e) => setSpecialRequests(e.target.value)}
                    placeholder="e.g. Custom cake design, live band, surprise entry, photo wall"
                    className="w-full px-3.5 py-2 rounded-xl border border-input bg-background text-xs"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 5: Review & Confirmation */}
          {step === 5 && (
            <div className="space-y-5 animate-in fade-in">
              <div>
                <h3 className="font-serif text-xl font-bold">Review Your Celebration Setup</h3>
                <p className="text-xs text-muted-foreground">Verify your event details before generating your plan.</p>
              </div>

              <div className="rounded-2xl border border-border bg-muted/40 p-5 space-y-3 text-xs">
                <div className="flex justify-between py-1 border-b border-border/60">
                  <span className="text-muted-foreground">Occasion:</span>
                  <span className="font-bold text-foreground capitalize">{occasionLabels[occasion]}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-border/60">
                  <span className="text-muted-foreground">Title:</span>
                  <span className="font-bold text-foreground">{title.trim() || "Untitled Celebration"}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-border/60">
                  <span className="text-muted-foreground">Date:</span>
                  <span className="font-bold text-foreground">{date || "—"}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-border/60">
                  <span className="text-muted-foreground">Location:</span>
                  <span className="font-bold text-foreground">{location.trim() || "—"}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-border/60">
                  <span className="text-muted-foreground">Guest Count:</span>
                  <span className="font-bold text-foreground">{guestCount || 50} Guests</span>
                </div>
                <div className="flex justify-between py-1 border-b border-border/60">
                  <span className="text-muted-foreground">Total Budget:</span>
                  <span className="font-extrabold text-primary">
                    ₹{Number(budget || 25000).toLocaleString("en-IN")} INR
                  </span>
                </div>
                {contingencyReserve ? (
                  <div className="flex justify-between py-1 border-b border-border/60">
                    <span className="text-muted-foreground">Contingency Reserve:</span>
                    <span className="font-semibold text-foreground">
                      ₹{Number(contingencyReserve).toLocaleString("en-IN")}
                    </span>
                  </div>
                ) : null}
                {priorities.length > 0 && (
                  <div className="flex justify-between py-1 border-b border-border/60">
                    <span className="text-muted-foreground">Priorities:</span>
                    <span className="font-medium text-foreground text-right max-w-[60%]">
                      {priorities.map(p => ALL_PRIORITIES.find(a => a.id === p)?.label).join(", ")}
                    </span>
                  </div>
                )}
                {themeStyle && (
                  <div className="flex justify-between py-1">
                    <span className="text-muted-foreground">Style:</span>
                    <span className="font-medium text-foreground">{themeStyle}</span>
                  </div>
                )}
              </div>

              {loading && (
                <div className="p-4 rounded-2xl border border-primary/30 bg-primary/5 text-center space-y-2 animate-in fade-in">
                  <Loader2 className="w-6 h-6 text-primary animate-spin mx-auto" />
                  <p className="text-xs font-bold text-foreground">{loadingMessage}</p>
                  <p className="text-[11px] text-muted-foreground">Crafting structured celebration plan...</p>
                </div>
              )}
            </div>
          )}

          {/* Navigation Controls */}
          <div className="flex items-center justify-between pt-6 border-t border-border mt-6">
            {step > 1 ? (
              <button
                type="button"
                onClick={handleBack}
                disabled={loading}
                className="px-4 py-2 rounded-xl border border-border bg-card hover:bg-muted text-xs font-semibold flex items-center gap-1.5 transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Back
              </button>
            ) : (
              <div />
            )}

            {step < 5 ? (
              <button
                type="button"
                onClick={handleNext}
                className="px-6 py-2.5 rounded-xl gradient-cta text-white text-xs font-bold shadow-sm hover:opacity-95 flex items-center gap-1.5 transition-opacity"
              >
                <span>Continue</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleGenerate}
                disabled={loading}
                className="px-7 py-3 rounded-xl gradient-cta text-white text-sm font-bold shadow-elevated hover:opacity-95 disabled:opacity-50 flex items-center gap-2 transition-all"
              >
                <Sparkles className="w-4 h-4" />
                <span>{loading ? "Generating Plan..." : "Generate My Celebration Plan"}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}

export default function EventWizardPage() {
  return (
    <Suspense
      fallback={
        <AppShell>
          <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-3">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-xs text-muted-foreground font-semibold">Loading celebration wizard...</p>
          </div>
        </AppShell>
      }
    >
      <WizardContent />
    </Suspense>
  );
}

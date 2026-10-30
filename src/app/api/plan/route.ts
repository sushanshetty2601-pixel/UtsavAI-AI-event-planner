import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { z } from "zod";
import { AIPlan } from "@/types";

const PlanRequestSchema = z.object({
  eventId: z.string(),
  title: z.string(),
  occasion: z.string(),
  guestCount: z.number().positive(),
  budget: z.number().positive(),
  currencyCode: z.string().default("INR"),
  currencySymbol: z.string().default("₹"),
  location: z.string(),
  preferences: z.object({
    themeStyle: z.string().optional(),
    colorPreferences: z.string().optional(),
    foodPreferences: z.string().optional(),
    dietaryRequirements: z.string().optional(),
    culturalConsiderations: z.string().optional(),
    desiredAtmosphere: z.string().optional(),
    specialRequests: z.string().optional(),
    priorities: z.array(z.string()).default([]),
    venueSetting: z.string().default("indoor"),
  }),
});

function generateTailoredFallback(data: z.infer<typeof PlanRequestSchema>): AIPlan {
  const { eventId, title, occasion, guestCount, budget, currencySymbol, location, preferences } = data;

  const cateringShare = Math.round(budget * 0.38);
  const decorShare = Math.round(budget * 0.20);
  const venueShare = Math.round(budget * 0.16);
  const photoShare = Math.round(budget * 0.12);
  const cakeShare = Math.round(budget * 0.06);
  const musicShare = Math.round(budget * 0.05);
  const miscShare = budget - (cateringShare + decorShare + venueShare + photoShare + cakeShare + musicShare);

  return {
    id: `plan-${Date.now()}`,
    eventId,
    status: "demo",
    eventSummary: `An exquisite ${occasion} plan for "${title}" hosting ${guestCount} guests in ${location || "your city"}. Meticulously budgeted to ${currencySymbol}${budget.toLocaleString()} focusing on culinary elegance, warm atmosphere, and seamless guest hospitality.`,
    creativeConceptTagline: `Celebration in Radiance — Crafted with Passion & Purpose`,
    themeOptions: [
      {
        id: "theme-1",
        name: "Budget Friendly",
        tagline: "Simple, elegant and beautiful",
        description: `Maximized impact with minimal overhead. Emphasizes warm ambient lighting, DIY floral centrepieces, and a curated acoustic soundtrack.`,
        estimatedCostMin: Math.round(budget * 0.8),
        estimatedCostMax: budget,
        colorPalette: ["#EF7187", "#FAF7F2", "#F2D9C0", "#302039"],
        keyFeatures: [
          "Curated warm fairy light drapery",
          "Seasonal fresh floral table runners",
          "Digital animated invitation suite",
          "Self-serve artisanal dessert pedestal",
        ],
      },
      {
        id: "theme-2",
        name: "Elegant",
        tagline: "Premium and sophisticated",
        description: `Refined luxury inspired by grand celebrations. Features bespoke acrylic signage, rich floral installations, and interactive live culinary counters.`,
        estimatedCostMin: budget,
        estimatedCostMax: Math.round(budget * 1.25),
        colorPalette: ["#302039", "#EF7187", "#9782E8", "#FAF7F2"],
        keyFeatures: [
          "Grand floral welcome archway",
          "Bespoke frosted acrylic signage & table numbers",
          "Dedicated candid photographer with drone highlights",
          "Live gourmet pasta or chaat counter",
        ],
      },
      {
        id: "theme-3",
        name: "Creative & Unique",
        tagline: "Fun and memorable ideas",
        description: `Vibrant and personalized experience featuring immersive photo corners, custom signature mocktails, and interactive guest entertainment.`,
        estimatedCostMin: Math.round(budget * 0.95),
        estimatedCostMax: Math.round(budget * 1.3),
        colorPalette: ["#83D9C9", "#9782E8", "#EF7187", "#120F1A"],
        keyFeatures: [
          "Interactive memory wall with guest polaroids",
          "Custom signature drinks station",
          "Neon celebration sign photo backdrop",
          "Live acoustic guitar or saxophone corner",
        ],
      },
    ],
    selectedThemeId: "theme-1",
    colorPalette: ["#EF7187", "#9782E8", "#638773", "#F2D9C0", "#FAF7F2", "#302039"],
    budgetCategories: [
      { category: "catering", label: "Food & Catering", allocatedAmount: cateringShare, percentage: 38 },
      { category: "decoration", label: "Decorations", allocatedAmount: decorShare, percentage: 20 },
      { category: "venue", label: "Venue", allocatedAmount: venueShare, percentage: 16 },
      { category: "photography", label: "Photography", allocatedAmount: photoShare, percentage: 12 },
      { category: "cake", label: "Cake & Desserts", allocatedAmount: cakeShare, percentage: 6 },
      { category: "entertainment", label: "Entertainment", allocatedAmount: musicShare, percentage: 5 },
      { category: "miscellaneous", label: "Miscellaneous", allocatedAmount: Math.max(0, miscShare), percentage: 3 },
    ],
    menuIdeas: [
      `Signature Welcome Mocktail: Chilled hibiscus berry spritzer & mint cooler`,
      `Artisanal Starters: 3 vegetarian & gourmet appetizer bites tailored for ${guestCount} guests`,
      `Gourmet Main Course: Rich gravy specialties, artisanal biryani / pulao, and seasonal breads`,
      `Dessert Showcase: Custom designer celebration cake and warm traditional delicacy`,
      `Dietary Note: Accommodates ${preferences.dietaryRequirements || "vegetarian and general dietary preferences"}`,
    ],
    decorationIdeas: [
      `Entrance Statement: Organic balloon & floral garland in ${preferences.colorPreferences || "rose gold and ivory"}`,
      `Stage / Focal Backdrop: Shimmering fairy light curtain with personalized name signage`,
      `Dining Tables: Low-profile floral arrangements with brass votives for intimate conversation`,
      `Photo Corner: Instagram-worthy photo nook with themed props and warm accent lighting`,
      `Ambient Highlights: Soft uplighting around venue perimeter to create depth`,
    ],
    entertainmentIdeas: [
      `Opening Ice-breaker: Personalized interactive quiz celebrating the hosts / guest of honor`,
      `Soundtrack: Sophisticated blend of acoustic melodies transitioning to upbeat celebration tracks`,
      `Key Highlight: Milestone toast and celebration cake cutting ceremony`,
      `Guest Activity: Memory cards where guests write heartfelt notes or wishes`,
    ],
    vendorCategories: [
      `Banquet Venue / Event Space with sound and air-conditioning`,
      `Full-service Catering team providing buffet equipment and staff`,
      `Décor & Floral stylist for entrance and focal backdrop`,
      `Bespoke celebration cake designer`,
      `Candid Event Photographer with portfolio in ${location || "the area"}`,
    ],
    contingencySuggestions: [
      `Maintain a 5–10% contingency reserve for extra last-minute guests or beverage top-ups`,
      `Verify venue power backup for uninterrupted audio and lighting`,
      `Confirm vendor arrival timelines 48 hours prior to avoid event-day setup rush`,
      `Have an indoor plan in case of unexpected rain or high evening humidity`,
    ],
    personalizedTips: [
      `Focus major spend on food and atmosphere — guests remember the taste and the feeling most`,
      `Send digital animated invites via WhatsApp 3–4 weeks prior to lock RSVPs early`,
      `Designate one family member or friend as vendor point-of-contact on event day`,
    ],
    eventDaySchedule: [
      { time: "16:00", activity: "Venue opens; décor and sound vendors commence setup" },
      { time: "17:15", activity: "Celebration cake arrives and placed at center display" },
      { time: "17:45", activity: "Photographer arrives for initial candid family portraits" },
      { time: "18:00", activity: "Guest arrivals & welcome refreshments served" },
      { time: "18:45", activity: "Appetizers served, photo-booth and guest mingling" },
      { time: "19:45", activity: "Celebration ceremony, speeches and cake cutting" },
      { time: "20:15", activity: "Main buffet dinner opens" },
      { time: "21:15", activity: "Music, celebration dances and dessert station" },
      { time: "22:00", activity: "Thank-you tokens distributed and event wrap-up" },
    ],
    generatedAt: new Date().toISOString(),
    isDemo: true,
  };
}

/** Rate limiter: 15 plan generation requests per minute per IP */
const planRateLimitMap = new Map<string, { count: number; resetAt: number }>();
function checkPlanRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = planRateLimitMap.get(ip);
  if (!entry || now > entry.resetAt) {
    planRateLimitMap.set(ip, { count: 1, resetAt: now + 60_000 });
    return true;
  }
  if (entry.count >= 15) return false;
  entry.count++;
  return true;
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (!checkPlanRateLimit(ip)) {
    return NextResponse.json({ error: "Too many plan requests. Please wait a moment." }, { status: 429 });
  }

  const contentLength = Number(req.headers.get("content-length") ?? 0);
  if (contentLength > 512 * 1024) {
    return NextResponse.json({ error: "Request payload too large." }, { status: 413 });
  }

  try {
    const json = await req.json();
    const parsed = PlanRequestSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request payload", details: parsed.error.format() },
        { status: 400 }
      );
    }

    const data = parsed.data;
    const apiKey = process.env.GEMINI_API_KEY;

    // If API key is not configured, seamlessly return the high-quality tailored plan
    if (!apiKey || apiKey.trim() === "") {
      const fallback = generateTailoredFallback(data);
      return NextResponse.json(fallback);
    }

    // Call Gemini API with structured prompt
    try {
      const ai = new GoogleGenAI({ apiKey });
      const prompt = `You are UtsavAI, an elite event planner and celebration designer.
Create a comprehensive, mathematically accurate, and beautifully written celebration plan for:
- Event: "${data.title}"
- Occasion: ${data.occasion}
- Guests: ${data.guestCount}
- Budget: ${data.currencySymbol}${data.budget.toLocaleString()} (${data.currencyCode})
- Location: ${data.location || "Urban Metro"}
- Style Preferences: ${data.preferences.themeStyle || "Warm, elegant, celebratory"}
- Colors: ${data.preferences.colorPreferences || "Ivory, coral, champagne gold"}
- Dietary: ${data.preferences.dietaryRequirements || "Standard vegetarian & non-veg"}
- Venue Setting: ${data.preferences.venueSetting}
- User Priorities: ${data.preferences.priorities.join(", ") || "Food, Atmosphere, Memories"}

Respond STRICTLY in valid JSON matching this exact structure:
{
  "eventSummary": string,
  "creativeConceptTagline": string,
  "themeOptions": [
    {
      "id": "theme-1",
      "name": string,
      "tagline": string,
      "description": string,
      "estimatedCostMin": number,
      "estimatedCostMax": number,
      "colorPalette": [string, string, string, string],
      "keyFeatures": [string, string, string, string]
    },
    { "id": "theme-2", ... },
    { "id": "theme-3", ... }
  ],
  "colorPalette": [string, string, string, string, string],
  "budgetCategories": [
    { "category": "catering", "label": "Food & Catering", "allocatedAmount": number, "percentage": number },
    { "category": "decoration", "label": "Decorations", "allocatedAmount": number, "percentage": number },
    { "category": "venue", "label": "Venue", "allocatedAmount": number, "percentage": number },
    { "category": "photography", "label": "Photography", "allocatedAmount": number, "percentage": number },
    { "category": "cake", "label": "Cake & Desserts", "allocatedAmount": number, "percentage": number },
    { "category": "entertainment", "label": "Entertainment", "allocatedAmount": number, "percentage": number },
    { "category": "miscellaneous", "label": "Miscellaneous", "allocatedAmount": number, "percentage": number }
  ],
  "menuIdeas": [string],
  "decorationIdeas": [string],
  "entertainmentIdeas": [string],
  "vendorCategories": [string],
  "contingencySuggestions": [string],
  "personalizedTips": [string],
  "eventDaySchedule": [{ "time": "18:00", "activity": string }]
}

CRITICAL RULES:
1. The sum of allocatedAmount in budgetCategories MUST EXACTLY EQUAL ${data.budget}.
2. Use realistic prices in ${data.currencyCode} for ${data.guestCount} guests.
3. Keep suggestions actionable, culturally attuned, and practical.`;

      const modelName = process.env.GEMINI_PRO_MODEL || "gemini-2.5-pro";
      const response = await ai.models.generateContent({
        model: modelName,
        contents: prompt,
        config: {
          responseMimeType: "application/json",
        },
      });

      const responseText = response.text?.trim() || "";
      const jsonStart = responseText.indexOf("{");
      const jsonEnd = responseText.lastIndexOf("}");
      
      if (jsonStart !== -1 && jsonEnd !== -1) {
        const cleanJson = responseText.substring(jsonStart, jsonEnd + 1);
        const parsedPlan = JSON.parse(cleanJson);

        const aiPlan: AIPlan = {
          id: `plan-${Date.now()}`,
          eventId: data.eventId,
          status: "complete",
          eventSummary: parsedPlan.eventSummary || "",
          creativeConceptTagline: parsedPlan.creativeConceptTagline || "Every celebration, beautifully planned.",
          themeOptions: Array.isArray(parsedPlan.themeOptions) ? parsedPlan.themeOptions : [],
          selectedThemeId: parsedPlan.themeOptions?.[0]?.id || "theme-1",
          colorPalette: Array.isArray(parsedPlan.colorPalette) ? parsedPlan.colorPalette : ["#EF7187", "#9782E8", "#638773"],
          budgetCategories: Array.isArray(parsedPlan.budgetCategories) ? parsedPlan.budgetCategories : [],
          menuIdeas: Array.isArray(parsedPlan.menuIdeas) ? parsedPlan.menuIdeas : [],
          decorationIdeas: Array.isArray(parsedPlan.decorationIdeas) ? parsedPlan.decorationIdeas : [],
          entertainmentIdeas: Array.isArray(parsedPlan.entertainmentIdeas) ? parsedPlan.entertainmentIdeas : [],
          vendorCategories: Array.isArray(parsedPlan.vendorCategories) ? parsedPlan.vendorCategories : [],
          contingencySuggestions: Array.isArray(parsedPlan.contingencySuggestions) ? parsedPlan.contingencySuggestions : [],
          personalizedTips: Array.isArray(parsedPlan.personalizedTips) ? parsedPlan.personalizedTips : [],
          eventDaySchedule: Array.isArray(parsedPlan.eventDaySchedule) ? parsedPlan.eventDaySchedule : [],
          generatedAt: new Date().toISOString(),
          isDemo: false,
        };

        return NextResponse.json(aiPlan);
      } else {
        throw new Error("Invalid model JSON response");
      }
    } catch (aiErr) {
      console.warn("UtsavAI: Gemini API failed, falling back to tailored plan", aiErr);
      const fallback = generateTailoredFallback(data);
      return NextResponse.json(fallback);
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

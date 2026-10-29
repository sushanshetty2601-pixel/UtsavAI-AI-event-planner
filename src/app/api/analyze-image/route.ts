import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { PhotoAnalysis } from "@/types";

/** Maximum allowed payload size: 10MB */
const MAX_IMAGE_PAYLOAD_BYTES = 10 * 1024 * 1024;

/** Rate limiter: 15 analysis requests per minute per IP */
const imageRateLimitMap = new Map<string, { count: number; resetAt: number }>();
function checkImageRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = imageRateLimitMap.get(ip);
  if (!entry || now > entry.resetAt) {
    imageRateLimitMap.set(ip, { count: 1, resetAt: now + 60_000 });
    return true;
  }
  if (entry.count >= 15) return false;
  entry.count++;
  return true;
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (!checkImageRateLimit(ip)) {
    return NextResponse.json({ error: "Too many image analysis requests. Please wait a moment." }, { status: 429 });
  }

  const contentLength = Number(req.headers.get("content-length") ?? 0);
  if (contentLength > MAX_IMAGE_PAYLOAD_BYTES) {
    return NextResponse.json({ error: "Image file exceeds maximum upload size (10MB limit)." }, { status: 413 });
  }

  try {
    const body = await req.json();
    const { imageBase64, imageId, imageName, eventId, guestCount, userNotes, occasion } = body;

    // Validate image format if base64 string provided
    if (imageBase64 && typeof imageBase64 === "string") {
      const isSupportedFormat =
        imageBase64.startsWith("data:image/jpeg") ||
        imageBase64.startsWith("data:image/jpg") ||
        imageBase64.startsWith("data:image/png") ||
        imageBase64.startsWith("data:image/webp") ||
        /^[A-Za-z0-9+/=]+$/.test(imageBase64.slice(0, 50));

      if (!isSupportedFormat) {
        return NextResponse.json(
          { error: "Unsupported image format. Please upload a JPEG, PNG, or WebP photo." },
          { status: 415 }
        );
      }
    }

    const apiKey = process.env.GEMINI_API_KEY;

    let visualAnalysis = {
      decorElements: [
        "Low-profile floral runners with seasonal white blooms & eucalyptus",
        "Warm brass candleholders with ivory taper candles",
        "Textured linen napkins with custom place cards",
        "Ambient warm string lighting in perimeter",
      ],
      dominantColors: ["#FAF7F2", "#F2D9C0", "#E4D5B7", "#302039", "#EF7187"],
      floralStyle: "Fresh organic greenery with creamy white hydrangeas and blush accents",
      seatingStyle: "Long banquet seating with natural wood chairs and soft seat cushions",
      lighting: "Warm 2700K ambient fairy lights and real candle flames (LED alternatives available)",
      backdrop: "Draped chiffon fabric with subtle cascading greenery and back-illumination",
      generalStyle: "Editorial Luxury / Modern Romance",
      constraints: [
        "Candles may require hurricane glass sleeves for outdoor breezy venues",
        "Long banquet tables require minimum 8 feet walking clearance between rows",
      ],
    };

    const gCount = Number(guestCount) || 50;
    const estTables = Math.ceil(gCount / 8);

    let quantityGuidance = {
      tables: `${estTables} banquet tables (for ${gCount} seated guests)`,
      chairs: `${Math.round(gCount * 1.05)} chairs (including 5% buffer)`,
      centerpieces: `${estTables} long floral runners or high-low cluster arrangements`,
      lightingUnits: `${estTables * 4} candleholders / lanterns + 100 meters fairy string lights`,
      florals: `~${estTables * 3} bunches of eucalyptus + seasonal white/coral roses`,
      keyZones: [
        "Welcome Entry Easel & Signage",
        "Guest Dining Tables",
        "Main Stage / Cake Cutting Focal Backdrop",
        "Photo-op Memory Corner",
      ],
    };

    let decorationRecommendations = {
      flowers: [
        "White hydrangeas, blush spray roses, and baby's breath",
        "Silver dollar eucalyptus and Italian ruscus foliage",
      ],
      centerpieces: [
        "Low floral runner allowing unobstructed guest conversation",
        "Brass or matte black geometric candleholders",
      ],
      tableLinens: [
        "Warm ivory textured linen tablecloths",
        "Blush or sage green gauze table runners",
      ],
      backdrops: [
        "Dual-arch frame with asymmetrical floral spray and neon signage",
      ],
      lighting: [
        "Fairy light canopy or festoon lighting",
        "Warm LED floor uplights behind backdrop",
      ],
      signage: [
        "Frosted acrylic welcome sign with custom calligraphy",
        "Table number cards with gold wax seal accents",
      ],
      layout: [
        "Central stage/backdrop opposite entrance with wide center aisle",
        "Buffet counters arranged along perimeter to prevent guest bottleneck",
      ],
    };

    let budgetAlternatives = [
      {
        title: "Artisanal Fresh Floral Package",
        costRange: "₹8,000 – ₹12,000",
        reason: "Full fresh seasonal flowers for tables, welcome entrance & stage",
        priority: "recommended" as const,
      },
      {
        title: "High-Quality Silk Floral Hybrid",
        costRange: "₹4,500 – ₹6,500",
        reason: "Silk florals on higher backdrop arches + fresh foliage on close-up tables",
        priority: "optional" as const,
      },
      {
        title: "Ambient Fairy Light & Draping Package",
        costRange: "₹3,500 – ₹5,000",
        reason: "Creates high perceived visual value with sheer fabric and warm fairy lights",
        priority: "essential" as const,
      },
    ];

    // If Gemini API is available and image provided, call multimodal model
    if (apiKey && imageBase64) {
      try {
        const ai = new GoogleGenAI({ apiKey });
        const modelName = process.env.GEMINI_VISION_MODEL || "gemini-2.5-flash";

        const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, "");

        const prompt = `Analyze this celebration inspiration photograph for an event with ${gCount} guests.
User notes: "${userNotes || "None"}".
Occasion: ${occasion || "Celebration"}.

Provide a structured analysis in valid JSON format:
{
  "visualAnalysis": {
    "decorElements": ["...", "..."],
    "dominantColors": ["#hex", "#hex", "..."],
    "floralStyle": "...",
    "seatingStyle": "...",
    "lighting": "...",
    "backdrop": "...",
    "generalStyle": "...",
    "constraints": ["...", "..."]
  },
  "decorationRecommendations": {
    "flowers": ["...", "..."],
    "centerpieces": ["...", "..."],
    "tableLinens": ["...", "..."],
    "backdrops": ["...", "..."],
    "lighting": ["...", "..."],
    "signage": ["...", "..."],
    "layout": ["...", "..."]
  },
  "quantityGuidance": {
    "tables": "...",
    "chairs": "...",
    "centerpieces": "...",
    "lightingUnits": "...",
    "florals": "...",
    "keyZones": ["...", "..."]
  },
  "budgetAlternatives": [
    { "title": "...", "costRange": "...", "reason": "...", "priority": "essential|recommended|optional" }
  ]
}
Output only JSON.`;

        const response = await ai.models.generateContent({
          model: modelName,
          contents: [
            {
              role: "user",
              parts: [
                { text: prompt },
                {
                  inlineData: {
                    mimeType: "image/jpeg",
                    data: cleanBase64,
                  },
                },
              ],
            },
          ],
        });

        const text = response.text || "";
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          if (parsed.visualAnalysis) visualAnalysis = parsed.visualAnalysis;
          if (parsed.decorationRecommendations) decorationRecommendations = parsed.decorationRecommendations;
          if (parsed.quantityGuidance) quantityGuidance = parsed.quantityGuidance;
          if (parsed.budgetAlternatives) budgetAlternatives = parsed.budgetAlternatives;
        }
      } catch (e) {
        console.warn("Multimodal API analysis error, using structured celebration fallbacks:", e);
      }
    }

    const result: PhotoAnalysis = {
      id: `analysis-${Date.now()}`,
      eventId,
      imageId: imageId || undefined,
      imageUrl: "", // Never send or store full base64 in structured analysis records
      imageName: imageName || "inspiration.jpg",
      uploadedAt: new Date().toISOString(),
      userNotes: userNotes || "",
      visualAnalysis,
      decorationRecommendations,
      quantityGuidance,
      budgetAlternatives,
    };

    return NextResponse.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unexpected error";
    console.error("API /api/analyze-image error:", message);
    return NextResponse.json(
      { error: "Image analysis failed" },
      { status: 500 }
    );
  }
}

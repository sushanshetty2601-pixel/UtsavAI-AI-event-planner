import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { parseAllocationIntent, parsePaymentIntent } from "@/lib/ai-intent";
import { chatRateLimiter } from "@/lib/rate-limit";

/** Maximum allowed request body size: 512 KB */
const MAX_BODY_BYTES = 512 * 1024;

export async function POST(req: NextRequest) {
  // Rate limiting
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (!chatRateLimiter.check(ip).allowed) {
    return NextResponse.json({ error: "Too many requests. Please wait a moment." }, { status: 429 });
  }

  // Body size guard
  const contentLength = Number(req.headers.get("content-length") ?? 0);
  if (contentLength > MAX_BODY_BYTES) {
    return NextResponse.json({ error: "Request payload too large." }, { status: 413 });
  }

  try {
    const body = await req.json();
    const {
      message,
      event,
      currentBudgetSummary,
      currentVendors = [],
      currentPaymentLedger = [],
    } = body;

    const apiKey = process.env.GEMINI_API_KEY;
    const currencySymbol = event?.currency?.symbol || "₹";
    const currencyCode = event?.currency?.code || "INR";

    // Build system prompt with authoritative event context
    const systemPrompt = `You are UtsavAI, an expert luxury celebration copilot and event planner.
You are helping plan the event: "${event?.title || "Celebration"}"
Occasion: ${event?.occasion || "General"}
Date: ${event?.date || "Upcoming"}
Location: ${event?.location || "India"}
Guest Count: ${event?.guestCount || 50}
Total Budget: ${currencySymbol}${event?.budget?.toLocaleString()} (${currencyCode})
Current Planned Spend: ${currencySymbol}${currentBudgetSummary?.totalEstimated?.toLocaleString() || 0}
Remaining Balance: ${currencySymbol}${currentBudgetSummary?.totalRemaining?.toLocaleString() || 0}
Is Over Budget: ${currentBudgetSummary?.isOverBudget ? `Yes by ${currencySymbol}${currentBudgetSummary.overBudgetAmount}` : "No"}
Dietary: ${event?.preferences?.dietaryRequirements || "Standard"}
Cultural: ${event?.preferences?.culturalConsiderations || "None specified"}

Current Vendors: ${JSON.stringify(currentVendors)}
Current Payment Ledger: ${JSON.stringify(currentPaymentLedger)}

Tone: Sophisticated, warm, encouraging, practical, and highly organized.
Keep responses concise, actionable, and structured with bullet points where appropriate.

If the user is reporting a payment or asking about payments:
- Examples: "I paid ₹1,00,000 for food", "I have paid the caterer ₹80,000 today", "I paid ABC Catering ₹50,000 as an advance", "I paid the photographer the full amount", "Mark the cake vendor as paid", "How much have I paid so far?", "How much is still outstanding?", "Show payment history".
- Compute exact financial numbers: Vendor, Payment recorded, Previous paid, Total paid so far, Quoted amount, Remaining payable, Payment status.
- Include structured action_json at the bottom:
\`\`\`action_json
{
  "paymentAction": {
    "action": "record_payment",
    "details": {
      "vendorName": "...",
      "category": "catering",
      "amount": 80000,
      "previousPaid": 0,
      "newTotalPaid": 80000,
      "quotedAmount": 100000,
      "remainingPayable": 20000,
      "paymentStatus": "partially_paid",
      "isAdvance": true
    }
  }
}
\`\`\`

If user asks to add an expense or allocate budget:
\`\`\`action_json
{
  "suggestedExpense": { "title": "...", "category": "catering|decoration|photography|venue|entertainment|cake|other", "amount": 1000 },
  "suggestedTask": { "title": "...", "category": "planning|catering|decoration|photography|venue|other", "priority": "high|medium|low" },
  "suggestedAllocation": {
    "totalBudget": 100000,
    "contingencyReserve": 10000,
    "categories": [
      { "category": "catering", "label": "Food & Beverages", "allocatedAmount": 35000 },
      { "category": "decoration", "label": "Decorations", "allocatedAmount": 25000 },
      { "category": "cake", "label": "Cake & Desserts", "allocatedAmount": 10000 },
      { "category": "miscellaneous", "label": "Other Expenses", "allocatedAmount": 20000 }
    ],
    "notes": "Custom celebration allocation"
  }
}
\`\`\`
Only include the fields in action_json that are directly relevant.`;

    let reply = "";
    // ActionData holds structured suggestions returned to the client
    let actionData: Record<string, unknown> | null = null;

    if (apiKey) {
      try {
        const ai = new GoogleGenAI({ apiKey });
        const modelName = process.env.GEMINI_FAST_MODEL || "gemini-2.5-flash";

        const promptText = `${systemPrompt}\n\nUser Question: ${message}`;
        const response = await ai.models.generateContent({
          model: modelName,
          contents: promptText,
        });

        reply = response.text || "";

        // Check for action_json block
        const actionMatch = reply.match(/```action_json\s*([\s\S]*?)\s*```/);
        if (actionMatch) {
          try {
            actionData = JSON.parse(actionMatch[1]);
            reply = reply.replace(/```action_json[\s\S]*?```/, "").trim();
          } catch {
            // Ignore action_json parse errors — reply text is still valid
          }
        }

        // If user asked to allocate but Gemini didn't attach suggestedAllocation, supplement with parser
        if (!actionData?.suggestedAllocation) {
          const allocCheck = parseAllocationIntent(message, event?.budget || 50000, currencySymbol);
          if (allocCheck) {
            actionData = { ...(actionData || {}), ...allocCheck.actionData };
          }
        }

        // If user asked about or recorded payment but Gemini didn't attach paymentAction, supplement with parser
        if (!actionData?.paymentAction) {
          const payCheck = parsePaymentIntent(message, currentVendors, currencySymbol);
          if (payCheck && payCheck.actionData) {
            actionData = { ...(actionData || {}), ...payCheck.actionData };
          }
        }
      } catch (err) {
        console.warn("Gemini API call failed, falling back to intelligent rules", err);
      }
    }

    // Fallback if no API key or API call failed
    if (!reply) {
      const payResult = parsePaymentIntent(message, currentVendors, currencySymbol);
      if (payResult) {
        reply = payResult.reply;
        actionData = payResult.actionData;
      } else {
        const allocResult = parseAllocationIntent(message, event?.budget || 50000, currencySymbol);
        if (allocResult) {
          reply = allocResult.reply;
          actionData = allocResult.actionData;
        } else {
        const lower = (message || "").toLowerCase();

        if (lower.includes("budget") || lower.includes("reduce") || lower.includes("save") || lower.includes("cost")) {
          const potentialSavings = Math.round((event?.budget || 25000) * 0.12);
          reply = `Here is how you can optimize your budget for **${event?.title}** (${currencySymbol}${event?.budget?.toLocaleString()} target):

1. **Gourmet Catering Adjustments**: Switch from live cooking counters to an artisanal buffet. This saves approximately ~15% without reducing food variety.
2. **Seasonal Floral Décor**: Replace imported blooms with marigold, tuberose, and eucalyptus runners. Saves ~${currencySymbol}${potentialSavings.toLocaleString()}.
3. **Photography Packages**: Book a 6-hour candid coverage package instead of full-day multiple camera crews.
4. **Digital Invites**: Send luxury animated WhatsApp invitations instead of printed physical cards.

Would you like me to adjust the catering and décor items in your budget automatically?`;
          actionData = {
            suggestedExpense: {
              title: "Artisanal Floral Table Runners",
              category: "decoration",
              amount: Math.round((event?.budget || 25000) * 0.08),
            },
          };
        } else if (lower.includes("timeline") || lower.includes("schedule") || lower.includes("task") || lower.includes("deadline")) {
          reply = `Here is an actionable timeline for **${event?.title}**:

- **3 Weeks Before**: Finalize guest list & RSVP follow-ups. Confirm menu tasting.
- **2 Weeks Before**: Final walkthrough of venue layout & power backup check.
- **1 Week Before**: Confirm arrival times with photographer, caterer & DJ.
- **Event Day**: Setup starts at 14:00. Host arrival at 17:30. Welcome mocktails begin at 18:00.

I can add these milestones directly to your Timeline & Tasks manager.`;
          actionData = {
            suggestedTask: {
              title: "Confirm vendor arrival & venue power check",
              category: "planning",
              priority: "high",
            },
          };
        } else if (lower.includes("decor") || lower.includes("flower") || lower.includes("theme") || lower.includes("stage")) {
          reply = `For **${event?.title}**, here is an elegant decorative direction:

- **Welcome Entrance**: Warm fairy light drapery with a customized welcome easel and brass lanterns.
- **Dining Atmosphere**: Low-profile floral arrangements allowing guests to converse easily across tables.
- **Milestone Focal Point**: Shimmering backdrop with warm ambient uplighting for photos.

Would you like to add this decor package to your budget?`;
          actionData = {
            suggestedExpense: {
              title: "Ambient Fairy Light & Floral Backdrop",
              category: "decoration",
              amount: Math.round((event?.budget || 25000) * 0.15),
            },
          };
        } else {
          reply = `Hello! I'm your UtsavAI Celebration Copilot for **${event?.title}**. 

I'm analyzing your celebration details:
- **Occasion**: ${event?.occasion || "Celebration"}
- **Guest Count**: ${event?.guestCount || 50} Guests
- **Budget**: ${currencySymbol}${event?.budget?.toLocaleString()} ${currencyCode}
- **Planned Spending**: ${currencySymbol}${currentBudgetSummary?.totalEstimated?.toLocaleString() || 0}
- **Remaining Surplus**: ${currencySymbol}${currentBudgetSummary?.totalRemaining?.toLocaleString() || 0}

How can I help you today? You can ask me to:
1. *Suggest cost-saving alternatives to stay under budget*
2. *Propose a personalized menu or dietary recommendations*
3. *Generate a comprehensive day-of schedule and task list*
4. *Allocate budget across categories (e.g. food, decor, cake, contingency)*`;
        }
      }
    }
  }

  return NextResponse.json({ reply, actionData });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unexpected error";
    console.error("API /api/chat error:", message);
    return NextResponse.json(
      { error: "Failed to generate AI response" },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import type { Vendor } from "@/types";

/** Maximum allowed request body size: 512 KB */
const MAX_BODY_BYTES = 512 * 1024;

/** Simple in-memory rate limiter: max 20 requests per minute per IP */
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + 60_000 });
    return true;
  }
  if (entry.count >= 20) return false;
  entry.count++;
  return true;
}

export async function POST(req: NextRequest) {
  // Rate limiting
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (!checkRateLimit(ip)) {
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

    // Helper: Parse budget allocation intent and extract structured categories
    const parseAllocationIntent = (msgText: string, defaultBudget: number) => {
      const lower = msgText.toLowerCase();
      const isAllocationIntent =
        lower.includes("allocat") ||
        lower.includes("distribute") ||
        lower.includes("split budget") ||
        lower.includes("budget breakdown") ||
        (lower.includes("budget") && (lower.includes("cake") || lower.includes("food") || lower.includes("decor") || lower.includes("percent")));

      if (!isAllocationIntent) return null;

      let totalBudget = defaultBudget;
      const totalMatch = msgText.match(/(?:allocate|budget of|total of|for)\s*(?:[₹$€£]|rs\.?|inr)?\s*([0-9,]+(?:\.[0-9]+)?)/i);
      if (totalMatch) {
        const parsed = Number(totalMatch[1].replace(/,/g, ""));
        if (parsed > 0) totalBudget = parsed;
      }

      const extractAmount = (pattern: RegExp): number | null => {
        const match = msgText.match(pattern);
        if (match && match[1]) {
          const val = Number(match[1].replace(/,/g, ""));
          return isNaN(val) ? null : val;
        }
        return null;
      };

      const categories: { category: string; label: string; allocatedAmount: number }[] = [];
      let contingencyReserve = 0;

      const cakeAmt = extractAmount(/(?:cake|dessert|sweets)[^\d]*?(?:[₹$€£]|rs\.?|inr)?\s*([0-9,]+)/i);
      const foodAmt = extractAmount(/(?:food|beverage|catering|dinner|lunch)[^\d]*?(?:[₹$€£]|rs\.?|inr)?\s*([0-9,]+)/i);
      const decorAmt = extractAmount(/(?:decor|decoration|flowers?|floral)[^\d]*?(?:[₹$€£]|rs\.?|inr)?\s*([0-9,]+)/i);
      const photoAmt = extractAmount(/(?:photo|photography|video)[^\d]*?(?:[₹$€£]|rs\.?|inr)?\s*([0-9,]+)/i);
      const venueAmt = extractAmount(/(?:venue|hall|resort|lawn)[^\d]*?(?:[₹$€£]|rs\.?|inr)?\s*([0-9,]+)/i);
      const djAmt = extractAmount(/(?:entertainment|dj|music)[^\d]*?(?:[₹$€£]|rs\.?|inr)?\s*([0-9,]+)/i);
      const inviteAmt = extractAmount(/(?:invitation|invite|cards)[^\d]*?(?:[₹$€£]|rs\.?|inr)?\s*([0-9,]+)/i);
      const attireAmt = extractAmount(/(?:attire|dress|outfit)[^\d]*?(?:[₹$€£]|rs\.?|inr)?\s*([0-9,]+)/i);
      const transportAmt = extractAmount(/(?:transport|travel|cab)[^\d]*?(?:[₹$€£]|rs\.?|inr)?\s*([0-9,]+)/i);
      const otherAmt = extractAmount(/(?:other|miscellaneous|misc)[^\d]*?(?:[₹$€£]|rs\.?|inr)?\s*([0-9,]+)/i);
      const reserveAmt = extractAmount(/(?:contingency|reserve|buffer)[^\d]*?(?:[₹$€£]|rs\.?|inr)?\s*([0-9,]+)/i);

      if (cakeAmt !== null) categories.push({ category: "cake", label: "Cake & Desserts", allocatedAmount: cakeAmt });
      if (foodAmt !== null) categories.push({ category: "catering", label: "Food & Beverages", allocatedAmount: foodAmt });
      if (decorAmt !== null) categories.push({ category: "decoration", label: "Decorations", allocatedAmount: decorAmt });
      if (photoAmt !== null) categories.push({ category: "photography", label: "Photography & Video", allocatedAmount: photoAmt });
      if (venueAmt !== null) categories.push({ category: "venue", label: "Venue & Hospitality", allocatedAmount: venueAmt });
      if (djAmt !== null) categories.push({ category: "entertainment", label: "Music & Entertainment", allocatedAmount: djAmt });
      if (inviteAmt !== null) categories.push({ category: "invitations", label: "Invitations & Stationery", allocatedAmount: inviteAmt });
      if (attireAmt !== null) categories.push({ category: "attire", label: "Attire & Styling", allocatedAmount: attireAmt });
      if (transportAmt !== null) categories.push({ category: "transport", label: "Transport & Logistics", allocatedAmount: transportAmt });
      if (otherAmt !== null) categories.push({ category: "miscellaneous", label: "Other Expenses", allocatedAmount: otherAmt });
      if (reserveAmt !== null) contingencyReserve = reserveAmt;

      // If generic allocation without amounts, use standard balanced percentages
      if (categories.length === 0) {
        const reserve = Math.round(totalBudget * 0.10);
        const catering = Math.round(totalBudget * 0.35);
        const venue = Math.round(totalBudget * 0.25);
        const decoration = Math.round(totalBudget * 0.15);
        const photography = Math.round(totalBudget * 0.10);
        const cake = Math.max(0, totalBudget - reserve - catering - venue - decoration - photography);

        categories.push({ category: "catering", label: "Food & Beverages", allocatedAmount: catering });
        categories.push({ category: "venue", label: "Venue & Location", allocatedAmount: venue });
        categories.push({ category: "decoration", label: "Decorations & Ambience", allocatedAmount: decoration });
        categories.push({ category: "photography", label: "Photography & Memories", allocatedAmount: photography });
        categories.push({ category: "cake", label: "Cake & Desserts", allocatedAmount: cake });
        contingencyReserve = reserve;
      }

      const totalAllocated = categories.reduce((sum, c) => sum + c.allocatedAmount, 0);
      const remainingOrOver = totalBudget - totalAllocated - contingencyReserve;

      let formattedReply = `Here is your customized budget allocation for **${currencySymbol}${totalBudget.toLocaleString()}**:\n\n`;
      categories.forEach((cat) => {
        const pct = totalBudget > 0 ? Math.round((cat.allocatedAmount / totalBudget) * 100) : 0;
        formattedReply += `• **${cat.label}**: ${currencySymbol}${cat.allocatedAmount.toLocaleString()} (${pct}%)\n`;
      });
      if (contingencyReserve > 0) {
        const resPct = totalBudget > 0 ? Math.round((contingencyReserve / totalBudget) * 100) : 0;
        formattedReply += `• **Contingency Reserve**: ${currencySymbol}${contingencyReserve.toLocaleString()} (${resPct}%)\n`;
      }
      formattedReply += `\n**Total Allocated**: ${currencySymbol}${(totalAllocated + contingencyReserve).toLocaleString()} of ${currencySymbol}${totalBudget.toLocaleString()}`;
      if (remainingOrOver > 0) {
        formattedReply += ` *(Unallocated buffer: ${currencySymbol}${remainingOrOver.toLocaleString()})*`;
      } else if (remainingOrOver < 0) {
        formattedReply += ` *(Warning: Over target budget by ${currencySymbol}${Math.abs(remainingOrOver).toLocaleString()})*`;
      } else {
        formattedReply += ` *(100% perfectly balanced!)*`;
      }
      formattedReply += `\n\nReview or fine-tune the numbers in the **Allocation Builder** below, then click **"Save Budget Allocations to Event"** to persist these targets.`;

      return {
        reply: formattedReply,
        actionData: {
          suggestedAllocation: {
            totalBudget,
            contingencyReserve,
            categories,
            notes: "Generated via UtsavAI Celebration Planner",
          },
        },
      };
    };

    // Helper: Parse payment recording or payment inquiry intent with exact financial reconciliation
    const parsePaymentIntent = (
      msgText: string,
      vendorsList: Vendor[]
    ) => {
      const lower = msgText.toLowerCase();

      // Check for Payment Inquiry
      const isInquiry =
        lower.includes("how much have i paid") ||
        lower.includes("how much paid") ||
        lower.includes("paid so far") ||
        lower.includes("total paid") ||
        lower.includes("how much is outstanding") ||
        lower.includes("outstanding") ||
        lower.includes("remaining payable") ||
        lower.includes("balance due") ||
        lower.includes("pending payment") ||
        lower.includes("payment history") ||
        lower.includes("show payment") ||
        lower.includes("ledger");

      if (isInquiry) {
        const totalPaid = vendorsList.reduce((sum, v) => sum + (Number(v.actualAmount) || 0), 0);
        const totalQuoted = vendorsList.reduce((sum, v) => sum + (Number(v.quotedAmount) || 0), 0);
        const remainingPayable = Math.max(0, totalQuoted - totalPaid);

        const items = vendorsList.map((v) => {
          const quoted = Number(v.quotedAmount) || 0;
          const paid = Number(v.actualAmount) || 0;
          const remaining = Math.max(0, quoted - paid);
          const status =
            quoted > 0 && paid >= quoted ? "Paid in Full" : paid > 0 ? "Partially Paid" : "Unpaid";
          return {
            name: v.name,
            category: v.category,
            quoted,
            paid,
            remaining,
            status,
          };
        });

        let replyText = `### Financial Payment Ledger Summary\n\n`;
        replyText += `• **Total Amount Paid So Far**: **${currencySymbol}${totalPaid.toLocaleString()}**\n`;
        replyText += `• **Total Quoted Commitments**: ${currencySymbol}${totalQuoted.toLocaleString()}\n`;
        replyText += `• **Total Outstanding Payable**: **${currencySymbol}${remainingPayable.toLocaleString()}**\n\n`;

        if (items.length > 0) {
          replyText += `**Itemized Vendor Balances:**\n`;
          items.forEach((item) => {
            replyText += `• **${item.name}** (${item.category}): Quoted ${currencySymbol}${item.quoted.toLocaleString()} | Paid ${currencySymbol}${item.paid.toLocaleString()} | Outstanding: ${currencySymbol}${item.remaining.toLocaleString()} — *${item.status}*\n`;
          });
        } else {
          replyText += `*No vendor bookings or quotes have been added yet.*`;
        }

        return {
          reply: replyText,
          actionData: {
            paymentAction: {
              action: "payment_inquiry" as const,
              inquirySummary: {
                totalPaid,
                totalQuoted,
                remainingPayable,
                items,
              },
            },
          },
        };
      }

      // Check for Payment Recording Action
      const hasPayKeyword =
        lower.includes("paid") ||
        lower.includes("payed") ||
        lower.includes("transferred") ||
        lower.includes("sent") ||
        lower.includes("deposited") ||
        lower.includes("advance") ||
        (lower.includes("mark") && lower.includes("paid"));

      if (!hasPayKeyword) return null;

      // Extract amount
      let amount: number | null = null;

      const isFullAmount =
        lower.includes("full amount") ||
        lower.includes("paid in full") ||
        lower.includes("fully paid") ||
        lower.includes("cleared") ||
        (lower.includes("mark") && lower.includes("paid") && !msgText.match(/\d+/));

      // Extract numeric amount: handles e.g. "₹1,00,000", "80,000", "1.5 lakh", "50k"
      const lakhMatch = msgText.match(/([0-9]+(?:\.[0-9]+)?)\s*(?:lakh|lacs?)/i);
      if (lakhMatch) {
        amount = Math.round(parseFloat(lakhMatch[1]) * 100000);
      } else {
        const kMatch = msgText.match(/([0-9]+(?:\.[0-9]+)?)\s*k\b/i);
        if (kMatch) {
          amount = Math.round(parseFloat(kMatch[1]) * 1000);
        } else {
          const paidNumMatch =
            msgText.match(/(?:paid|transferr?ed|deposit(?:ed)?|advance\s*(?:of)?)\s*(?:the\s*)?(?:[₹$€£]|rs\.?|inr)?\s*([0-9,]+)/i) ||
            msgText.match(/(?:[₹$€£]|rs\.?|inr)\s*([0-9,]+)/i);
          if (paidNumMatch) {
            const parsed = Number(paidNumMatch[1].replace(/,/g, ""));
            if (!isNaN(parsed) && parsed > 0) amount = parsed;
          }
        }
      }

      // Determine vendor / category match
      let matchedVendor: Vendor | null = null;
      let detectedCategory: string = "catering";
      let recipientName = "";

      for (const v of vendorsList) {
        if (
          lower.includes(v.name.toLowerCase()) ||
          lower.includes(v.category.toLowerCase()) ||
          (v.category === "catering" && (lower.includes("food") || lower.includes("caterer") || lower.includes("catering") || lower.includes("dinner") || lower.includes("lunch"))) ||
          (v.category === "cake" && (lower.includes("cake") || lower.includes("dessert") || lower.includes("bakery"))) ||
          (v.category === "photography" && (lower.includes("photo") || lower.includes("photographer") || lower.includes("video"))) ||
          (v.category === "decoration" && (lower.includes("decor") || lower.includes("flower") || lower.includes("balloon"))) ||
          (v.category === "venue" && (lower.includes("venue") || lower.includes("hall") || lower.includes("banquet"))) ||
          (v.category === "entertainment" && (lower.includes("dj") || lower.includes("music") || lower.includes("sound")))
        ) {
          matchedVendor = v;
          detectedCategory = v.category;
          recipientName = v.name;
          break;
        }
      }

      if (!matchedVendor) {
        if (lower.includes("food") || lower.includes("caterer") || lower.includes("catering")) {
          detectedCategory = "catering";
          recipientName = "Catering Vendor";
        } else if (lower.includes("cake") || lower.includes("dessert") || lower.includes("pastry")) {
          detectedCategory = "cake";
          recipientName = "Cake & Dessert Specialist";
        } else if (lower.includes("photo") || lower.includes("photographer") || lower.includes("video")) {
          detectedCategory = "photography";
          recipientName = "Photographer";
        } else if (lower.includes("decor") || lower.includes("flower") || lower.includes("balloon")) {
          detectedCategory = "decoration";
          recipientName = "Décor & Florals Partner";
        } else if (lower.includes("venue") || lower.includes("hall") || lower.includes("resort") || lower.includes("banquet")) {
          detectedCategory = "venue";
          recipientName = "Celebration Venue";
        } else if (lower.includes("dj") || lower.includes("music") || lower.includes("sound")) {
          detectedCategory = "entertainment";
          recipientName = "Music & Entertainment";
        } else {
          detectedCategory = "other";
          recipientName = "Celebration Partner";
        }
      }

      const previousPaid = matchedVendor ? Number(matchedVendor.actualAmount) || 0 : 0;
      const quotedAmount = matchedVendor ? Number(matchedVendor.quotedAmount) || 0 : 0;

      if (isFullAmount && (amount === null || amount === 0)) {
        amount = Math.max(0, quotedAmount - previousPaid);
      }

      if (amount === null || amount <= 0) {
        return {
          reply: `I understand that you want to record a payment for **${recipientName}**, but I couldn't identify the exact payment amount. Please specify the amount paid (e.g. *"I paid ${currencySymbol}50,000 to ${recipientName}"*).`,
          actionData: null,
        };
      }

      const isAdvance = lower.includes("advance") || lower.includes("deposit");
      const newTotalPaid = previousPaid + amount;
      const remainingPayable = Math.max(0, quotedAmount - newTotalPaid);
      const paymentStatus: "paid" | "partially_paid" | "unpaid" =
        quotedAmount > 0 && newTotalPaid >= quotedAmount ? "paid" : newTotalPaid > 0 ? "partially_paid" : "unpaid";

      let calculationReply = `### Payment Record Confirmation\n\n`;
      calculationReply += `• **Vendor / Recipient**: **${recipientName}** (${detectedCategory})\n`;
      calculationReply += `• **Payment Recorded**: **${currencySymbol}${amount.toLocaleString()}**${isAdvance ? " *(Advance Payment)*" : ""}\n`;
      calculationReply += `• **Previous Paid**: ${currencySymbol}${previousPaid.toLocaleString()}\n`;
      calculationReply += `• **Total Paid So Far**: **${currencySymbol}${newTotalPaid.toLocaleString()}**\n`;
      if (quotedAmount > 0) {
        calculationReply += `• **Quoted Amount**: ${currencySymbol}${quotedAmount.toLocaleString()}\n`;
        calculationReply += `• **Remaining Payable**: ${currencySymbol}${remainingPayable.toLocaleString()}\n`;
      }
      calculationReply += `• **Payment Status**: **${paymentStatus === "paid" ? "Paid in Full" : paymentStatus === "partially_paid" ? "Partially Paid" : "Unpaid"}**\n\n`;
      calculationReply += `Click **"Confirm & Record to Ledger"** below to update your event balances, vendor status, and budget allocations.`;

      return {
        reply: calculationReply,
        actionData: {
          paymentAction: {
            action: "record_payment" as const,
            details: {
              vendorName: recipientName,
              vendorId: matchedVendor?.id,
              category: detectedCategory,
              amount,
              previousPaid,
              newTotalPaid,
              quotedAmount,
              remainingPayable,
              paymentStatus,
              isAdvance,
              message: `Payment of ${currencySymbol}${amount.toLocaleString()} to ${recipientName}`,
            },
          },
        },
      };
    };

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
          } catch (_parseErr) {
            // Ignore action_json parse errors — reply text is still valid
          }
        }

        // If user asked to allocate but Gemini didn't attach suggestedAllocation, supplement with parser
        if (!actionData?.suggestedAllocation) {
          const allocCheck = parseAllocationIntent(message, event?.budget || 50000);
          if (allocCheck) {
            actionData = { ...(actionData || {}), ...allocCheck.actionData };
          }
        }

        // If user asked about or recorded payment but Gemini didn't attach paymentAction, supplement with parser
        if (!actionData?.paymentAction) {
          const payCheck = parsePaymentIntent(message, currentVendors);
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
      const payResult = parsePaymentIntent(message, currentVendors);
      if (payResult) {
        reply = payResult.reply;
        actionData = payResult.actionData;
      } else {
        const allocResult = parseAllocationIntent(message, event?.budget || 50000);
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

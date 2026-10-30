import { Vendor } from "@/types";

export interface IntentResult<T = Record<string, unknown>> {
  reply: string;
  actionData: T | null;
}

/**
 * Parses budget allocation intent from user chat messages and extracts structured category allocations.
 */
export function parseAllocationIntent(
  msgText: string,
  defaultBudget: number,
  currencySymbol: string = "₹"
): IntentResult | null {
  const lower = msgText.toLowerCase();
  const isAllocationIntent =
    lower.includes("allocat") ||
    lower.includes("distribute") ||
    lower.includes("split budget") ||
    lower.includes("budget breakdown") ||
    (lower.includes("budget") &&
      (lower.includes("cake") ||
        lower.includes("food") ||
        lower.includes("decor") ||
        lower.includes("percent")));

  if (!isAllocationIntent) return null;

  let totalBudget = defaultBudget;
  const totalMatch = msgText.match(
    /(?:allocate|budget of|total of|for)\s*(?:[₹$€£]|rs\.?|inr)?\s*([0-9,]+(?:\.[0-9]+)?)/i
  );
  if (totalMatch) {
    const parsed = Number(totalMatch[1].replace(/,/g, ""));
    if (parsed > 0) totalBudget = parsed;
  }

  const extractAmount = (categoryPattern: string): number | null => {
    // 1. Amount then category: e.g. "₹30,000 for food", "30,000 on catering"
    const backward = msgText.match(
      new RegExp(
        `(?:[₹$€£]|rs\\.?|inr)?\\s*([0-9,]+)\\s*(?:for|towards|on|in|allocated\\s+to)?\\s*(?:${categoryPattern})\\b`,
        "i"
      )
    );
    if (backward && backward[1]) {
      const val = Number(backward[1].replace(/,/g, ""));
      if (!isNaN(val) && val > 0) return val;
    }

    // 2. Category then amount: e.g. "food: ₹30,000", "food - 30000", "catering 30000"
    const forward = msgText.match(
      new RegExp(
        `(?:${categoryPattern})\\s*[:=-]?\\s*(?:[₹$€£]|rs\\.?|inr)?\\s*([0-9,]+)`,
        "i"
      )
    );
    if (forward && forward[1]) {
      const val = Number(forward[1].replace(/,/g, ""));
      if (!isNaN(val) && val > 0) return val;
    }

    return null;
  };

  const categories: { category: string; label: string; allocatedAmount: number }[] = [];
  let contingencyReserve = 0;

  const cakeAmt = extractAmount("cake|dessert|sweets");
  const foodAmt = extractAmount("food|beverage|catering|dinner|lunch");
  const decorAmt = extractAmount("decor|decoration|flowers?|floral");
  const photoAmt = extractAmount("photo|photography|video");
  const venueAmt = extractAmount("venue|hall|resort|lawn");
  const djAmt = extractAmount("entertainment|dj|music");
  const inviteAmt = extractAmount("invitation|invite|cards");
  const attireAmt = extractAmount("attire|dress|outfit");
  const transportAmt = extractAmount("transport|travel|cab");
  const otherAmt = extractAmount("other|miscellaneous|misc");
  const reserveAmt = extractAmount("contingency|reserve|buffer");

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
}

/**
 * Parses payment recording or inquiry intent from user chat messages with financial reconciliation.
 */
export function parsePaymentIntent(
  msgText: string,
  vendorsList: Vendor[],
  currencySymbol: string = "₹"
): IntentResult | null {
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
}

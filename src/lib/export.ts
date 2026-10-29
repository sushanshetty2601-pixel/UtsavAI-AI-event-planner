import * as XLSX from "xlsx";
import {
  Event,
  Expense,
  Vendor,
  Task,
  PaymentRecord,
  BudgetSummary,
  BudgetHistoryEntry,
} from "@/types";

/**
 * Generates and downloads a genuine .xlsx Excel workbook for the given event
 */
export function exportEventToExcel(params: {
  event: Event;
  expenses: Expense[];
  vendors: Vendor[];
  tasks: Task[];
  budgetSummary: BudgetSummary;
  budgetHistory?: BudgetHistoryEntry[];
  paymentLedger?: PaymentRecord[];
}) {
  const { event, expenses, vendors, tasks, budgetSummary, budgetHistory = [], paymentLedger = [] } = params;
  const currencySymbol = event.currency?.symbol || "₹";

  // Create Workbook
  const workbook = XLSX.utils.book_new();

  // 1. Sheet: Event Overview
  const overviewData = [
    ["UTSAVAI — THE CELEBRATION MASTERPLAN"],
    ["Every celebration, beautifully planned."],
    [],
    ["EVENT DETAILS", ""],
    ["Title", event.title],
    ["Occasion", event.occasion.toUpperCase()],
    ["Event Date", event.date],
    ["Time", `${event.startTime || "18:00"} - ${event.endTime || "22:00"}`],
    ["Location", event.location],
    ["Guest Count", event.guestCount],
    ["Venue Setting", event.preferences?.venueSetting || "indoor"],
    [],
    ["FINANCIAL SNAPSHOT", ""],
    ["Total Budget", `${currencySymbol} ${event.budget.toLocaleString()}`],
    ["Estimated Spend", `${currencySymbol} ${budgetSummary.totalEstimated.toLocaleString()}`],
    ["Actual Paid", `${currencySymbol} ${budgetSummary.totalActual.toLocaleString()}`],
    ["Remaining Balance", `${currencySymbol} ${budgetSummary.totalRemaining.toLocaleString()}`],
    ["Contingency Reserve", `${currencySymbol} ${(event.contingencyReserve || 0).toLocaleString()}`],
    ["Status", budgetSummary.isOverBudget ? `OVER BUDGET BY ${currencySymbol} ${budgetSummary.overBudgetAmount}` : "ON TRACK / HEALTHY SURPLUS"],
    [],
    ["PLANNING PREFERENCES", ""],
    ["Dietary Requirements", event.preferences?.dietaryRequirements || "None specified"],
    ["Cultural Considerations", event.preferences?.culturalConsiderations || "None specified"],
    ["Special Requests", event.preferences?.specialRequests || "None specified"],
    ["Report Generated On", new Date().toLocaleString()],
  ];
  const overviewSheet = XLSX.utils.aoa_to_sheet(overviewData);
  overviewSheet["!cols"] = [{ wch: 25 }, { wch: 45 }];
  XLSX.utils.book_append_sheet(workbook, overviewSheet, "Event Overview");

  // 2. Sheet: Budget Summary
  const budgetData = [
    ["CATEGORY BUDGET BREAKDOWN", "", "", ""],
    ["Category", "Planned Cost", "Paid Amount", "Share of Budget (%)"],
    ...budgetSummary.categories.map((c) => [
      c.label,
      c.estimated,
      c.actual,
      `${c.percentage}%`,
    ]),
    [],
    ["TOTAL BUDGET", event.budget, "", "100%"],
    ["TOTAL PLANNED", budgetSummary.totalEstimated, "", `${Math.round((budgetSummary.totalEstimated / (event.budget || 1)) * 100)}%`],
    ["REMAINING", budgetSummary.totalRemaining, "", ""],
  ];
  const budgetSheet = XLSX.utils.aoa_to_sheet(budgetData);
  budgetSheet["!cols"] = [{ wch: 25 }, { wch: 18 }, { wch: 18 }, { wch: 20 }];
  XLSX.utils.book_append_sheet(workbook, budgetSheet, "Budget Summary");

  // 3. Sheet: Expenses
  if (expenses.length > 0) {
    const expenseRows = [
      ["ITEMIZED EXPENSES", "", "", "", "", ""],
      ["Title", "Category", "Estimated", "Quoted", "Actual Paid", "Payment Status", "Notes"],
      ...expenses.map((e) => [
        e.title,
        e.category.toUpperCase(),
        e.estimatedAmount,
        e.quotedAmount ?? e.estimatedAmount,
        e.actualAmount ?? 0,
        e.paymentStatus.toUpperCase(),
        e.notes || "",
      ]),
    ];
    const expenseSheet = XLSX.utils.aoa_to_sheet(expenseRows);
    expenseSheet["!cols"] = [
      { wch: 28 },
      { wch: 18 },
      { wch: 15 },
      { wch: 15 },
      { wch: 15 },
      { wch: 18 },
      { wch: 35 },
    ];
    XLSX.utils.book_append_sheet(workbook, expenseSheet, "Expenses");
  }

  // 4. Sheet: Vendors
  if (vendors.length > 0) {
    const vendorRows = [
      ["VENDOR DIRECTORY & QUOTES", "", "", "", "", "", ""],
      ["Vendor Name", "Category", "Contact Name", "Phone", "Email", "Quoted Cost", "Booking Status"],
      ...vendors.map((v) => [
        v.name,
        v.category.toUpperCase(),
        v.contactName || "",
        v.contactPhone || "",
        v.contactEmail || "",
        v.quotedAmount || 0,
        v.bookingStatus.toUpperCase(),
      ]),
    ];
    const vendorSheet = XLSX.utils.aoa_to_sheet(vendorRows);
    vendorSheet["!cols"] = [
      { wch: 25 },
      { wch: 18 },
      { wch: 20 },
      { wch: 18 },
      { wch: 25 },
      { wch: 15 },
      { wch: 18 },
    ];
    XLSX.utils.book_append_sheet(workbook, vendorSheet, "Vendors");
  }

  // 5. Sheet: Timeline & Tasks
  if (tasks.length > 0) {
    const taskRows = [
      ["TIMELINE & MILESTONES", "", "", "", ""],
      ["Task Title", "Category", "Due Date", "Priority", "Status", "Estimated Cost"],
      ...tasks.map((t) => [
        t.title,
        t.category.toUpperCase(),
        t.dueDate,
        t.priority.toUpperCase(),
        t.status.toUpperCase(),
        t.estimatedCost || 0,
      ]),
    ];
    const taskSheet = XLSX.utils.aoa_to_sheet(taskRows);
    taskSheet["!cols"] = [
      { wch: 35 },
      { wch: 18 },
      { wch: 15 },
      { wch: 12 },
      { wch: 15 },
      { wch: 18 },
    ];
    XLSX.utils.book_append_sheet(workbook, taskSheet, "Timeline & Tasks");
  }

  // 6. Sheet: Budget History
  if (budgetHistory.length > 0) {
    const histRows = [
      ["BUDGET SNAPSHOT HISTORY", "", "", "", ""],
      ["Date", "Target Budget", "Planned Total", "Actual Spent", "Audit Note"],
      ...budgetHistory.map((h) => [
        h.date,
        h.totalBudget,
        h.totalEstimated,
        h.totalActual,
        h.note,
      ]),
    ];
    const histSheet = XLSX.utils.aoa_to_sheet(histRows);
    histSheet["!cols"] = [{ wch: 15 }, { wch: 18 }, { wch: 18 }, { wch: 18 }, { wch: 40 }];
    XLSX.utils.book_append_sheet(workbook, histSheet, "Budget History");
  }

  // 7. Sheet: Payment Ledger Transactions
  if (paymentLedger.length > 0) {
    const ledgerRows = [
      ["FINANCIAL PAYMENT LEDGER", "", "", "", "", ""],
      ["Date", "Payee / Vendor", "Category", "Payment Method", "Reference / Notes", "Amount Paid"],
      ...paymentLedger.map((p) => [
        p.paymentDate || p.createdAt.split("T")[0],
        p.recipientName,
        p.category || "General",
        p.paymentMethod || "Direct Transfer",
        p.notes || p.transactionRef || "",
        p.amount,
      ]),
    ];
    const ledgerSheet = XLSX.utils.aoa_to_sheet(ledgerRows);
    ledgerSheet["!cols"] = [
      { wch: 15 },
      { wch: 30 },
      { wch: 18 },
      { wch: 18 },
      { wch: 35 },
      { wch: 18 },
    ];
    XLSX.utils.book_append_sheet(workbook, ledgerSheet, "Payment Ledger");
  }

  // Download .xlsx file directly
  const safeTitle = event.title.replace(/[^a-zA-Z0-9_-]/g, "_");
  XLSX.writeFile(workbook, `${safeTitle}_UtsavAI_Masterplan.xlsx`);
}

/**
 * Renders and exports a high-resolution PNG image of the Budget History Chart
 */
export function exportBudgetChartToPNG(params: {
  event: Event;
  budgetSummary: BudgetSummary;
  budgetHistory?: BudgetHistoryEntry[];
}) {
  const { event, budgetSummary } = params;
  const currencySymbol = event.currency?.symbol || "₹";

  const width = 1200;
  const height = 630;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  // Background gradient: Deep Plum / Midnight Gala
  const bgGrad = ctx.createLinearGradient(0, 0, width, height);
  bgGrad.addColorStop(0, "#120F1A");
  bgGrad.addColorStop(0.5, "#1D1727");
  bgGrad.addColorStop(1, "#292035");
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, width, height);

  // Border Accent Glow
  ctx.strokeStyle = "rgba(239, 113, 135, 0.3)";
  ctx.lineWidth = 4;
  ctx.strokeRect(10, 10, width - 20, height - 20);

  // Header Brand
  ctx.font = "bold 20px 'Plus Jakarta Sans', sans-serif";
  ctx.fillStyle = "#FF7798";
  ctx.fillText("✨ UTSAVAI — THE CELEBRATION COPILOT", 50, 60);

  // Event Title
  ctx.font = "bold 34px 'Cormorant Garamond', serif";
  ctx.fillStyle = "#F7F0F8";
  ctx.fillText(event.title, 50, 105);

  // Subtitle
  ctx.font = "16px 'Inter', sans-serif";
  ctx.fillStyle = "#B6AABC";
  ctx.fillText(
    `${event.occasion.toUpperCase()} • ${event.location || "India"} • ${event.guestCount} Guests • Generated ${new Date().toLocaleDateString()}`,
    50,
    135
  );

  // KPI Metric Cards Bar
  const cards = [
    { label: "TOTAL BUDGET", value: `${currencySymbol} ${event.budget.toLocaleString()}`, color: "#EF7187" },
    { label: "PLANNED SPEND", value: `${currencySymbol} ${budgetSummary.totalEstimated.toLocaleString()}`, color: "#B8A4FF" },
    { label: "ACTUAL PAID", value: `${currencySymbol} ${budgetSummary.totalActual.toLocaleString()}`, color: "#83D9C9" },
    {
      label: "BALANCE",
      value: `${currencySymbol} ${budgetSummary.totalRemaining.toLocaleString()}`,
      color: budgetSummary.isOverBudget ? "#FF5555" : "#638773",
    },
  ];

  const cardWidth = 260;
  const cardHeight = 90;
  const cardY = 165;
  cards.forEach((card, idx) => {
    const cardX = 50 + idx * (cardWidth + 20);
    ctx.fillStyle = "rgba(255, 255, 255, 0.05)";
    ctx.strokeStyle = "rgba(255, 255, 255, 0.1)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(cardX, cardY, cardWidth, cardHeight, 12);
    ctx.fill();
    ctx.stroke();

    ctx.font = "bold 11px 'Plus Jakarta Sans', sans-serif";
    ctx.fillStyle = "#B6AABC";
    ctx.fillText(card.label, cardX + 18, cardY + 30);

    ctx.font = "bold 22px 'Plus Jakarta Sans', sans-serif";
    ctx.fillStyle = card.color;
    ctx.fillText(card.value, cardX + 18, cardY + 65);
  });

  // Chart Title
  ctx.font = "bold 18px 'Plus Jakarta Sans', sans-serif";
  ctx.fillStyle = "#F7F0F8";
  ctx.fillText("Budget Allocation by Category", 50, 305);

  // Category Bar Chart Area
  const chartY = 330;
  const maxBarWidth = 600;
  const maxSpend = Math.max(...budgetSummary.categories.map((c) => c.estimated), event.budget || 1);

  budgetSummary.categories.slice(0, 6).forEach((cat, idx) => {
    const rowY = chartY + idx * 42;
    ctx.font = "14px 'Inter', sans-serif";
    ctx.fillStyle = "#F7F0F8";
    ctx.fillText(cat.label, 50, rowY + 16);

    const barW = Math.max(15, (cat.estimated / maxSpend) * maxBarWidth);
    ctx.fillStyle = cat.color || "#EF7187";
    ctx.beginPath();
    ctx.roundRect(220, rowY, barW, 22, 6);
    ctx.fill();

    ctx.font = "bold 13px 'Plus Jakarta Sans', sans-serif";
    ctx.fillStyle = "#F7F0F8";
    ctx.fillText(`${currencySymbol} ${cat.estimated.toLocaleString()} (${cat.percentage}%)`, 230 + barW + 12, rowY + 16);
  });

  // Right Side: Quick Legend / Audit Note
  const rightBoxX = 850;
  const rightBoxY = 300;
  const rightBoxW = 300;
  const rightBoxH = 260;
  ctx.fillStyle = "rgba(255, 255, 255, 0.04)";
  ctx.strokeStyle = "rgba(255, 255, 255, 0.1)";
  ctx.beginPath();
  ctx.roundRect(rightBoxX, rightBoxY, rightBoxW, rightBoxH, 16);
  ctx.fill();
  ctx.stroke();

  ctx.font = "bold 15px 'Plus Jakarta Sans', sans-serif";
  ctx.fillStyle = "#F7F0F8";
  ctx.fillText("Reality Check Audit", rightBoxX + 20, rightBoxY + 36);

  ctx.font = "13px 'Inter', sans-serif";
  ctx.fillStyle = "#B6AABC";
  const statusLine1 = budgetSummary.isOverBudget
    ? `⚠️ Over Budget by ${currencySymbol}${budgetSummary.overBudgetAmount}`
    : `✅ Safe Surplus: ${currencySymbol}${budgetSummary.totalRemaining}`;
  ctx.fillText(statusLine1, rightBoxX + 20, rightBoxY + 70);

  ctx.fillText(`Contingency: ${currencySymbol}${(event.contingencyReserve || 0).toLocaleString()}`, rightBoxX + 20, rightBoxY + 100);
  ctx.fillText(`Planned Ratio: ${Math.round((budgetSummary.totalEstimated / (event.budget || 1)) * 100)}%`, rightBoxX + 20, rightBoxY + 130);

  ctx.font = "italic 11px 'Inter', sans-serif";
  ctx.fillStyle = "#776D7D";
  ctx.fillText("All totals validated mathematically in code.", rightBoxX + 20, rightBoxY + 220);

  // Trigger Download
  const link = document.createElement("a");
  const safeTitle = event.title.replace(/[^a-zA-Z0-9_-]/g, "_");
  link.download = `${safeTitle}_Budget_Chart.png`;
  link.href = canvas.toDataURL("image/png");
  link.click();
}

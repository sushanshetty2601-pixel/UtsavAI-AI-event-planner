"use client";

import React, { useMemo } from "react";
import { useApp } from "@/contexts/app-context";
import { formatCurrency } from "@/lib/utils";
import {
  Printer,
  X,
  Calendar,
  MapPin,
  Clock,
  Store,
} from "lucide-react";

interface CoordinatorHandoutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CoordinatorHandoutModal({ isOpen, onClose }: CoordinatorHandoutModalProps) {
  const {
    activeEvent,
    vendors,
    paymentLedger,
    tasks,
    guests,
    subEvents,
  } = useApp();

  // Vendor settlement numbers - mathematically exact
  const vendorSettlements = useMemo(() => {
    if (!activeEvent) return [];

    return vendors.map((vendor) => {
      const quoted = vendor.quotedAmount || 0;
      const vendorPayments = paymentLedger.filter(
        (p) =>
          p.vendorId === vendor.id ||
          (p.recipientName && p.recipientName.toLowerCase() === vendor.name.toLowerCase())
      );
      const paid = vendorPayments.length > 0
        ? vendorPayments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0)
        : vendor.actualAmount || 0;
      const balance = Math.max(0, quoted - paid);

      return {
        vendor,
        quoted,
        paid,
        balance,
      };
    });
  }, [activeEvent, vendors, paymentLedger]);

  const totals = useMemo(() => {
    const totalQuoted = vendorSettlements.reduce((acc, v) => acc + v.quoted, 0);
    const totalPaid = vendorSettlements.reduce((acc, v) => acc + v.paid, 0);
    const totalBalance = vendorSettlements.reduce((acc, v) => acc + v.balance, 0);
    return { totalQuoted, totalPaid, totalBalance };
  }, [vendorSettlements]);

  // Dietary counts
  const dietarySummary = useMemo(() => {
    const counts: Record<string, number> = {
      Vegetarian: 0,
      Jain: 0,
      Vegan: 0,
      "Non-Veg": 0,
      Halal: 0,
      "Gluten-Free": 0,
    };
    let confirmedCount = 0;

    guests.forEach((g) => {
      if (g.rsvpStatus === "attending") {
        const seats = 1 + (g.plusOnes || 0);
        confirmedCount += seats;
        if (g.dietary === "vegetarian") counts.Vegetarian += seats;
        if (g.dietary === "jain") counts.Jain += seats;
        if (g.dietary === "vegan") counts.Vegan += seats;
        if (g.dietary === "non_veg") counts["Non-Veg"] += seats;
        if (g.dietary === "halal") counts.Halal += seats;
        if (g.dietary === "gluten_free") counts["Gluten-Free"] += seats;
      }
    });

    return { counts, confirmedCount };
  }, [guests]);

  // Urgent tasks
  const urgentTasks = useMemo(() => {
    return tasks.filter((t) => t.priority === "urgent" || t.priority === "high");
  }, [tasks]);

  const handlePrint = () => {
    window.print();
  };

  if (!isOpen || !activeEvent) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="handout-sheet-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/70 backdrop-blur-sm overflow-y-auto print:p-0 print:bg-white print:static"
    >
      <div className="bg-card text-foreground border border-border w-full max-w-4xl rounded-3xl shadow-elevated overflow-hidden my-auto print:border-none print:shadow-none print:w-full print:max-w-none print:rounded-none">
        {/* Top Modal Controls (Hidden in Print) */}
        <div className="flex items-center justify-between p-4 px-6 border-b border-border bg-muted/40 print:hidden">
          <div className="flex items-center gap-2">
            <Printer className="w-4 h-4 text-primary" />
            <h2 id="handout-sheet-title" className="font-bold text-sm text-foreground">
              Day-of Coordinator Handout Sheet & Settlement Report
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl gradient-cta text-white text-xs font-bold shadow-sm hover:opacity-95 transition-all"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / Save as PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl hover:bg-muted text-muted-foreground transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Document Body */}
        <div className="p-6 sm:p-8 space-y-6 print:p-6 print:text-black print:bg-white" id="printable-handout">
          {/* Header Banner */}
          <div className="border-b-2 border-primary/30 pb-4 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
            <div>
              <div className="text-[10px] font-bold uppercase tracking-widest text-primary mb-1">
                UtsavAI • Master Celebration Brief & Day-of Logistics
              </div>
              <h1 className="font-serif text-3xl font-bold tracking-tight text-foreground print:text-black">
                {activeEvent.title}
              </h1>
              <p className="text-xs text-muted-foreground print:text-gray-600 mt-1 flex items-center gap-3 flex-wrap">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  {activeEvent.date || "Scheduled Date"}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  {activeEvent.startTime || "18:00"} – {activeEvent.endTime || "22:00"}
                </span>
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5" />
                  {activeEvent.location || "Venue Location"}
                </span>
              </p>
            </div>

            <div className="text-left sm:text-right text-xs">
              <span className="text-[10px] uppercase font-bold text-muted-foreground print:text-gray-500">
                Document Generated
              </span>
              <p className="font-bold text-foreground print:text-black">
                {new Date().toLocaleDateString("en-IN", {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                })}
              </p>
              <span className="text-[11px] text-primary font-semibold">
                Official Settlement Handout
              </span>
            </div>
          </div>

          {/* Key Event Overview & Catering Headcount */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 print:border print:border-gray-300 print:p-3 print:rounded-lg">
            <div className="p-3 rounded-xl bg-muted/40 print:bg-gray-50">
              <span className="text-[10px] uppercase font-bold text-muted-foreground print:text-gray-600">Confirmed Headcount</span>
              <p className="font-bold text-lg text-foreground print:text-black mt-0.5">
                {dietarySummary.confirmedCount || activeEvent.guestCount} Guests
              </p>
            </div>
            <div className="p-3 rounded-xl bg-muted/40 print:bg-gray-50">
              <span className="text-[10px] uppercase font-bold text-muted-foreground print:text-gray-600">Total Budget Target</span>
              <p className="font-bold text-lg text-foreground print:text-black mt-0.5">
                {formatCurrency(activeEvent.budget, activeEvent.currency?.code || "INR")}
              </p>
            </div>
            <div className="p-3 rounded-xl bg-muted/40 print:bg-gray-50">
              <span className="text-[10px] uppercase font-bold text-muted-foreground print:text-gray-600">Vendor Commitments</span>
              <p className="font-bold text-lg text-foreground print:text-black mt-0.5">
                {formatCurrency(totals.totalQuoted, activeEvent.currency?.code || "INR")}
              </p>
            </div>
            <div className="p-3 rounded-xl bg-muted/40 print:bg-gray-50">
              <span className="text-[10px] uppercase font-bold text-amber-600 print:text-black">Balance Pending Payment</span>
              <p className="font-bold text-lg text-amber-600 print:text-black mt-0.5">
                {formatCurrency(totals.totalBalance, activeEvent.currency?.code || "INR")}
              </p>
            </div>
          </div>

          {/* Dietary Breakdown Bar */}
          <div className="p-3.5 rounded-xl border border-border bg-card print:border-gray-300 text-xs space-y-1.5">
            <span className="font-bold uppercase tracking-wider text-[10px] text-muted-foreground print:text-gray-700">
              Catering & Dietary Requirements (Confirmed):
            </span>
            <div className="flex items-center gap-3 flex-wrap">
              {Object.entries(dietarySummary.counts)
                .filter(([, count]) => count > 0)
                .map(([diet, count]) => (
                  <span key={diet} className="font-semibold text-foreground print:text-black">
                    • {diet}: <strong className="text-primary print:text-black">{count}</strong>
                  </span>
                ))}
              {Object.values(dietarySummary.counts).every((c) => c === 0) && (
                <span className="text-muted-foreground">Standard celebration catering</span>
              )}
            </div>
          </div>

          {/* Multi-Day Ceremonies Schedule */}
          {subEvents.length > 0 && (
            <div className="space-y-2.5">
              <h3 className="font-serif font-bold text-base text-foreground print:text-black flex items-center gap-2">
                <Calendar className="w-4 h-4 text-primary" />
                <span>Ceremony Schedule & Logistics</span>
              </h3>
              <div className="rounded-xl border border-border print:border-gray-300 overflow-hidden text-xs">
                <table className="w-full text-left">
                  <thead className="bg-muted/70 print:bg-gray-100 font-bold text-[10px] uppercase text-muted-foreground print:text-gray-700">
                    <tr>
                      <th className="py-2 px-3">Day / Ceremony</th>
                      <th className="py-2 px-3">Time</th>
                      <th className="py-2 px-3">Venue / Location</th>
                      <th className="py-2 px-3">Dress Code</th>
                      <th className="py-2 px-3">Catering Style</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border print:divide-gray-300">
                    {subEvents.map((sub) => (
                      <tr key={sub.id}>
                        <td className="py-2.5 px-3 font-bold text-foreground print:text-black">
                          Day {sub.dayNumber}: {sub.title}
                        </td>
                        <td className="py-2.5 px-3 text-muted-foreground print:text-black">
                          {sub.startTime} – {sub.endTime}
                        </td>
                        <td className="py-2.5 px-3 text-muted-foreground print:text-black">
                          {sub.venueLocation}
                        </td>
                        <td className="py-2.5 px-3 text-muted-foreground print:text-black">
                          {sub.dressCode}
                        </td>
                        <td className="py-2.5 px-3 text-muted-foreground print:text-black">
                          {sub.cateringStyle || "Buffet"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Mathematically Exact Vendor Settlement Sheet */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <h3 className="font-serif font-bold text-base text-foreground print:text-black flex items-center gap-2">
                <Store className="w-4 h-4 text-primary" />
                <span>Vendor Settlement & Disbursement Sheet</span>
              </h3>
              <span className="text-[11px] text-muted-foreground print:text-gray-600">
                Single Source of Truth: Verified Payment Ledger
              </span>
            </div>

            <div className="rounded-xl border border-border print:border-gray-300 overflow-hidden text-xs">
              <table className="w-full text-left">
                <thead className="bg-muted/70 print:bg-gray-100 font-bold text-[10px] uppercase text-muted-foreground print:text-gray-700">
                  <tr>
                    <th className="py-2.5 px-3">Vendor / Service</th>
                    <th className="py-2.5 px-3">Phone</th>
                    <th className="py-2.5 px-3 text-right">Quoted Fee</th>
                    <th className="py-2.5 px-3 text-right">Paid to Date</th>
                    <th className="py-2.5 px-3 text-right">Balance Due</th>
                    <th className="py-2.5 px-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border print:divide-gray-300">
                  {vendorSettlements.map((item) => (
                    <tr key={item.vendor.id}>
                      <td className="py-2.5 px-3">
                        <span className="font-bold text-foreground print:text-black">{item.vendor.name}</span>
                        <span className="text-[10px] text-muted-foreground block uppercase">{item.vendor.category}</span>
                      </td>
                      <td className="py-2.5 px-3 text-muted-foreground print:text-black">
                        {item.vendor.contactPhone || "—"}
                      </td>
                      <td className="py-2.5 px-3 text-right font-semibold text-foreground print:text-black">
                        {formatCurrency(item.quoted, activeEvent.currency?.code || "INR")}
                      </td>
                      <td className="py-2.5 px-3 text-right font-semibold text-emerald-600 print:text-black">
                        {formatCurrency(item.paid, activeEvent.currency?.code || "INR")}
                      </td>
                      <td className="py-2.5 px-3 text-right font-bold text-amber-600 print:text-black">
                        {formatCurrency(item.balance, activeEvent.currency?.code || "INR")}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            item.balance === 0
                              ? "bg-emerald-500/10 text-emerald-600 print:text-black"
                              : item.paid > 0
                              ? "bg-amber-500/10 text-amber-600 print:text-black"
                              : "bg-red-500/10 text-red-600 print:text-black"
                          }`}
                        >
                          {item.balance === 0 ? "Settled" : item.paid > 0 ? "Part Paid" : "Unpaid"}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {/* Totals Row */}
                  <tr className="bg-muted/80 print:bg-gray-100 font-bold border-t-2 border-border print:border-gray-400">
                    <td colSpan={2} className="py-2.5 px-3 text-foreground print:text-black uppercase text-[11px]">
                      Total Settlement Commitments
                    </td>
                    <td className="py-2.5 px-3 text-right text-foreground print:text-black">
                      {formatCurrency(totals.totalQuoted, activeEvent.currency?.code || "INR")}
                    </td>
                    <td className="py-2.5 px-3 text-right text-emerald-600 print:text-black">
                      {formatCurrency(totals.totalPaid, activeEvent.currency?.code || "INR")}
                    </td>
                    <td className="py-2.5 px-3 text-right text-amber-600 print:text-black">
                      {formatCurrency(totals.totalBalance, activeEvent.currency?.code || "INR")}
                    </td>
                    <td className="py-2.5 px-3 text-center text-muted-foreground print:text-black">
                      {totals.totalBalance === 0 ? "100% Settled" : "Pending"}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* High Priority Day-of Tasks Checklist */}
          {urgentTasks.length > 0 && (
            <div className="space-y-2">
              <h3 className="font-serif font-bold text-sm text-foreground print:text-black">
                Critical Day-of Checklist & Deliverables:
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {urgentTasks.map((task) => (
                  <div
                    key={task.id}
                    className="p-2 rounded-lg border border-border print:border-gray-300 flex items-center gap-2"
                  >
                    <div className="w-3.5 h-3.5 rounded border border-primary shrink-0" />
                    <span className="font-medium text-foreground print:text-black truncate">{task.title}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Footer Signature Box */}
          <div className="pt-6 border-t border-border print:border-gray-400 grid grid-cols-2 gap-8 text-xs text-muted-foreground print:text-gray-600">
            <div>
              <p className="font-semibold text-foreground print:text-black">Host / Planner Verification:</p>
              <div className="h-10 border-b border-border print:border-gray-300 mt-2" />
              <p className="text-[10px] mt-1">Signature & Date</p>
            </div>
            <div>
              <p className="font-semibold text-foreground print:text-black">Day-of Coordinator Acknowledgment:</p>
              <div className="h-10 border-b border-border print:border-gray-300 mt-2" />
              <p className="text-[10px] mt-1">Signature & Date</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

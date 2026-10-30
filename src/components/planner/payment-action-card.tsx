"use client";

import React, { useState } from "react";
import { ChatMessage } from "@/types";
import { Coins, Check, CheckCircle2 } from "lucide-react";
import Link from "next/link";

export function PaymentActionCard({
  paymentAction,
  currencySymbol,
  onRecord,
}: {
  paymentAction: NonNullable<ChatMessage["actionData"]>["paymentAction"] extends infer T ? T extends undefined ? never : T : never;
  currencySymbol: string;
  onRecord: (details: Record<string, unknown>) => void;
}) {
  const [recorded, setRecorded] = useState(false);

  if (paymentAction.action === "payment_inquiry" && paymentAction.inquirySummary) {
    const s = paymentAction.inquirySummary;
    return (
      <div className="mt-2.5 p-3.5 rounded-2xl bg-card border border-border shadow-xs space-y-3">
        <div className="flex items-center justify-between border-b border-border/70 pb-2">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <Coins className="w-3.5 h-3.5" />
            </div>
            <span className="font-bold text-xs text-foreground">Financial Ledger Balances</span>
          </div>
          <Link href="/vendors" className="text-[11px] font-semibold text-primary hover:underline">
            Manage Vendors →
          </Link>
        </div>

        <div className="grid grid-cols-3 gap-2 text-[11px] p-2 rounded-xl bg-muted/40">
          <div>
            <span className="text-muted-foreground block text-[10px] uppercase font-semibold">Paid</span>
            <span className="font-bold text-sage">{currencySymbol}{s.totalPaid.toLocaleString()}</span>
          </div>
          <div>
            <span className="text-muted-foreground block text-[10px] uppercase font-semibold">Committed</span>
            <span className="font-bold text-foreground">{currencySymbol}{s.totalQuoted.toLocaleString()}</span>
          </div>
          <div>
            <span className="text-muted-foreground block text-[10px] uppercase font-semibold">Outstanding</span>
            <span className={`font-bold ${s.remainingPayable > 0 ? "text-amber-500" : "text-muted-foreground"}`}>
              {currencySymbol}{s.remainingPayable.toLocaleString()}
            </span>
          </div>
        </div>

        {s.items && s.items.length > 0 && (
          <div className="space-y-1.5 pt-1">
            {s.items.map((it: { name: string; category: string; quoted: number; paid: number; remaining: number; status: string }, i: number) => (
              <div key={i} className="flex items-center justify-between text-[11px] py-1 border-b border-border/40 last:border-0">
                <div>
                  <span className="font-semibold text-foreground">{it.name}</span>
                  <span className="text-[10px] text-muted-foreground ml-1.5 capitalize">({it.category})</span>
                </div>
                <div className="text-right">
                  <span className="font-bold text-foreground">{currencySymbol}{it.paid.toLocaleString()}</span>
                  <span className="text-muted-foreground text-[10px]"> / {currencySymbol}{it.quoted.toLocaleString()}</span>
                  <span
                    className={`ml-2 text-[10px] px-1.5 py-0.5 rounded-full ${
                      it.status === "Paid in Full"
                        ? "bg-sage/15 text-sage font-semibold"
                        : it.status === "Partially Paid"
                        ? "bg-amber-500/15 text-amber-500 font-semibold"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {it.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  if (paymentAction.action === "record_payment" && paymentAction.details) {
    const d = paymentAction.details;

    return (
      <div className="mt-2.5 p-3.5 rounded-2xl bg-card border border-border shadow-xs space-y-3">
        <div className="flex items-center justify-between border-b border-border/70 pb-2">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
              <CheckCircle2 className="w-3.5 h-3.5" />
            </div>
            <div>
              <span className="font-bold text-xs text-foreground">Record Payment to Ledger</span>
              {d.isAdvance && (
                <span className="ml-2 text-[10px] px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-500 font-semibold">
                  Advance Deposit
                </span>
              )}
            </div>
          </div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            {d.category || "General"}
          </span>
        </div>

        <div className="flex items-baseline justify-between">
          <div>
            <span className="text-[10px] text-muted-foreground uppercase font-semibold">Payee / Vendor</span>
            <p className="font-serif text-sm font-bold text-foreground">{d.vendorName}</p>
          </div>
          <div className="text-right">
            <span className="text-[10px] text-muted-foreground uppercase font-semibold">Payment Amount</span>
            <p className="font-sans text-base font-extrabold text-emerald-600 dark:text-emerald-400">
              +{currencySymbol}{d.amount.toLocaleString()}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 text-[11px] p-2 rounded-xl bg-muted/40">
          <div>
            <span className="text-muted-foreground block text-[10px]">Previously Paid</span>
            <span className="font-semibold text-foreground">{currencySymbol}{(d.previousPaid || 0).toLocaleString()}</span>
          </div>
          <div>
            <span className="text-muted-foreground block text-[10px]">New Total Paid</span>
            <span className="font-bold text-sage">{currencySymbol}{(d.newTotalPaid || d.amount).toLocaleString()}</span>
          </div>
          <div>
            <span className="text-muted-foreground block text-[10px]">Balance Left</span>
            <span className={`font-semibold ${(d.remainingPayable || 0) > 0 ? "text-amber-500" : "text-muted-foreground"}`}>
              {currencySymbol}{(d.remainingPayable || 0).toLocaleString()}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between pt-1">
          <div className="text-[11px] text-muted-foreground">
            Status: <span className="font-bold text-foreground capitalize">{d.paymentStatus?.replace("_", " ") || "Recorded"}</span>
          </div>
          <button
            onClick={() => {
              onRecord(d);
              setRecorded(true);
            }}
            disabled={recorded}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs ${
              recorded
                ? "bg-sage/15 text-sage border border-sage/30 cursor-default"
                : "gradient-cta text-white hover:opacity-95 active:scale-95"
            }`}
          >
            {recorded ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>Recorded to Ledger</span>
              </>
            ) : (
              <>
                <Coins className="w-3.5 h-3.5" />
                <span>Confirm & Record to Ledger</span>
              </>
            )}
          </button>
        </div>
      </div>
    );
  }

  return null;
}

"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useApp } from "@/contexts/app-context";
import { AppShell } from "@/components/app-shell";
import { formatCurrency } from "@/lib/utils";
import { Vendor, VendorCategory, BookingStatus, PaymentStatus } from "@/types";
import { CoordinatorHandoutModal } from '@/components/coordinator-handout-modal';
import {
  Store,
  Printer,
  Plus,
  Star,
  Trash2,
  Edit2,
  Phone,
  X,
  Search,
  Coins,
} from "lucide-react";

export default function VendorsPage() {
  const {
    activeEvent,
    vendors,
    createVendor,
    updateVendor,
    deleteVendor,
    setPreferredVendor,
    paymentLedger,
    deletePayment,
  } = useApp();

  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [handoutOpen, setHandoutOpen] = useState(false);
  const [editingVendor, setEditingVendor] = useState<Vendor | null>(null);

  // Form Fields
  const [name, setName] = useState("");
  const [category, setCategory] = useState<VendorCategory>("catering");
  const [contactName, setContactName] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [quotedAmount, setQuotedAmount] = useState<number>(0);
  const [actualAmount, setActualAmount] = useState<number>(0);
  const [bookingStatus, setBookingStatus] = useState<BookingStatus>("pending");
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>("unpaid");
  const [notes, setNotes] = useState("");

  const getVendorCategoryLabel = (cat: string) => {
    const labels: Record<string, string> = {
      venue: "Venue",
      catering: "Food & Catering",
      photography: "Photography",
      decoration: "Decorations",
      cake: "Cake & Desserts",
      entertainment: "Entertainment",
      invitations: "Invitations",
      transport: "Rentals & Transport",
      other: "Other Services",
    };
    return labels[cat] || cat;
  };

  if (!activeEvent) {
    return (
      <AppShell>
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-5 max-w-xl mx-auto py-12">
          <div className="w-16 h-16 rounded-3xl bg-primary/10 text-primary flex items-center justify-center text-3xl shadow-card">
            <Store className="w-8 h-8" />
          </div>
          <h2 className="font-serif text-3xl font-bold text-foreground">
            Vendor Directory & Quotes
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Create an event or load our sample to compare caterers, photographers, decorators, and manage booking quotes.
          </p>
          <div className="flex items-center gap-3 pt-2">
            <Link
              href="/wizard"
              className="px-5 py-2.5 rounded-xl gradient-cta text-white text-xs font-bold shadow-md hover:opacity-95 transition-opacity"
            >
              + Create New Event
            </Link>
          </div>
        </div>
            <CoordinatorHandoutModal isOpen={handoutOpen} onClose={() => setHandoutOpen(false)} />
    </AppShell>
    );
  }

  const currencyCode = activeEvent.currency?.code || "INR";
  const currencyLocale = activeEvent.currency?.locale || "en-IN";

  const filteredVendors = vendors.filter((v) => {
    const matchCat = categoryFilter === "all" || v.category === categoryFilter;
    const matchSearch =
      search.trim() === "" ||
      v.name.toLowerCase().includes(search.toLowerCase()) ||
      v.category.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  const openAddDialog = () => {
    setEditingVendor(null);
    setName("");
    setCategory("catering");
    setContactName("");
    setContactPhone("");
    setContactEmail("");
    setQuotedAmount(5000);
    setActualAmount(0);
    setBookingStatus("pending");
    setPaymentStatus("unpaid");
    setNotes("");
    setDialogOpen(true);
  };

  const openEditDialog = (v: Vendor) => {
    setEditingVendor(v);
    setName(v.name);
    setCategory(v.category);
    setContactName(v.contactName || "");
    setContactPhone(v.contactPhone || "");
    setContactEmail(v.contactEmail || "");
    setQuotedAmount(v.quotedAmount || 0);
    const paidVal =
      v.paymentStatus === "paid"
        ? (v.actualAmount && v.actualAmount > 0 ? v.actualAmount : (v.quotedAmount || 0))
        : (v.actualAmount || 0);
    setActualAmount(paidVal);
    setBookingStatus(v.bookingStatus);
    setPaymentStatus(v.paymentStatus);
    setNotes(v.notes || "");
    setDialogOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const finalActual =
      paymentStatus === "paid"
        ? (actualAmount > 0 ? actualAmount : (Number(quotedAmount) || 0))
        : (paymentStatus === "unpaid" ? 0 : (Number(actualAmount) || 0));

    if (editingVendor) {
      updateVendor(editingVendor.id, {
        name,
        category,
        contactName,
        contactPhone,
        contactEmail,
        quotedAmount: Number(quotedAmount) || 0,
        actualAmount: finalActual,
        bookingStatus,
        paymentStatus,
        notes,
      });
    } else {
      createVendor({
        eventId: activeEvent.id,
        name,
        category,
        contactName,
        contactPhone,
        contactEmail,
        quotedAmount: Number(quotedAmount) || 0,
        actualAmount: finalActual,
        bookingStatus,
        paymentStatus,
        notes,
        isPreferred: false,
      });
    }
    setDialogOpen(false);
  };

  const totalQuoted = vendors.reduce((acc, v) => acc + (v.quotedAmount || 0), 0);
  const totalPaid = vendors.reduce((acc, v) => acc + (v.actualAmount || 0), 0);
  const totalOutstanding = Math.max(0, totalQuoted - totalPaid);
  const confirmedCount = vendors.filter((v) => v.bookingStatus === "confirmed").length;

  return (
    <AppShell>
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-foreground">
            Vendor Tracker & Quotes
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Compare quotes side-by-side, manage booking contracts, and track advance payments.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap self-start sm:self-auto">
          <button
            onClick={() => setHandoutOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-border bg-card hover:bg-muted text-foreground text-xs font-semibold shadow-xs transition-all"
            title="Print Coordinator Settlement Sheet"
          >
            <Printer className="w-3.5 h-3.5 text-primary" />
            <span>Settlement Handout / PDF</span>
          </button>
          <button
            onClick={openAddDialog}
            className="px-4 py-2 rounded-xl gradient-cta text-white text-xs font-bold shadow-sm hover:opacity-95 flex items-center gap-1.5 transition-opacity"
          >
            <Plus className="w-4 h-4" />
            <span>Add Vendor</span>
          </button>
        </div>
      </div>

      {/* Financial Overview KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="p-4 rounded-2xl border border-border bg-card shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Total Quoted</span>
          <p className="font-serif text-xl sm:text-2xl font-bold text-foreground mt-0.5">
            {formatCurrency(totalQuoted, activeEvent.currency.code)}
          </p>
          <span className="text-[11px] text-muted-foreground">{vendors.length} vendors tracked</span>
        </div>
        <div className="p-4 rounded-2xl border border-border bg-card shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Total Paid to Date</span>
          <p className="font-serif text-xl sm:text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
            {formatCurrency(totalPaid, activeEvent.currency.code)}
          </p>
          <span className="text-[11px] text-muted-foreground">
            {totalQuoted > 0 ? `${Math.round((totalPaid / totalQuoted) * 100)}% of commitments` : "0% paid"}
          </span>
        </div>
        <div className="p-4 rounded-2xl border border-border bg-card shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Outstanding Balance</span>
          <p className="font-serif text-xl sm:text-2xl font-bold text-amber-600 dark:text-amber-400 mt-0.5">
            {formatCurrency(totalOutstanding, activeEvent.currency.code)}
          </p>
          <span className="text-[11px] text-muted-foreground">Payable before celebration</span>
        </div>
        <div className="p-4 rounded-2xl border border-border bg-card shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Bookings Confirmed</span>
          <p className="font-serif text-xl sm:text-2xl font-bold text-foreground mt-0.5">
            {confirmedCount} / {vendors.length}
          </p>
          <span className="text-[11px] text-muted-foreground">Locked with contracts</span>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1">
          {["all", "venue", "catering", "photography", "decoration"].map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold capitalize whitespace-nowrap transition-colors ${
                categoryFilter === cat
                  ? "bg-primary text-white shadow-xs"
                  : "bg-card border border-border text-muted-foreground hover:bg-muted"
              }`}
            >
              {cat === "all" ? "All Categories" : getVendorCategoryLabel(cat)}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search vendors..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-input bg-card text-xs focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
        </div>
      </div>

      {/* Dedicated Financial Payment Ledger (Real Outflows) */}
      <div className="rounded-3xl border border-border bg-card p-6 shadow-card space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-border">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                <Coins className="w-4 h-4" />
              </div>
              <h3 className="font-serif text-lg font-bold text-foreground">
                Payment Ledger & Cash Outflows
              </h3>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Verified record of every payment, advance deposit, and balance transfer for this celebration.
            </p>
          </div>
          <span className="text-xs font-semibold px-3 py-1 rounded-full bg-muted/60 text-foreground self-start sm:self-auto">
            {paymentLedger.length} Transactions Recorded
          </span>
        </div>

        {paymentLedger.length === 0 ? (
          <div className="py-8 text-center text-xs text-muted-foreground">
            No payment transactions logged yet. Payments recorded in the AI Planner or here will be tracked permanently.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-border/70 text-muted-foreground font-semibold uppercase tracking-wider text-[10px]">
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Payee / Vendor</th>
                  <th className="py-2.5 px-3">Category</th>
                  <th className="py-2.5 px-3">Method</th>
                  <th className="py-2.5 px-3">Reference / Notes</th>
                  <th className="py-2.5 px-3 text-right">Amount</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {paymentLedger.map((pay) => (
                  <tr key={pay.id} className="hover:bg-muted/20 transition-colors">
                    <td className="py-2.5 px-3 whitespace-nowrap text-muted-foreground">
                      {pay.paymentDate || pay.createdAt.split("T")[0]}
                    </td>
                    <td className="py-2.5 px-3 font-semibold text-foreground">
                      {pay.recipientName}
                      {pay.isAdvance && (
                        <span className="ml-1.5 text-[9px] px-1.5 py-0.5 rounded-full bg-amber-500/15 text-amber-500 font-semibold">
                          Advance
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 capitalize text-muted-foreground">
                      {pay.category || "General"}
                    </td>
                    <td className="py-2.5 px-3 text-muted-foreground">
                      {pay.paymentMethod || "Direct Transfer"}
                    </td>
                    <td className="py-2.5 px-3 text-muted-foreground max-w-xs truncate">
                      {pay.notes || pay.transactionRef || "—"}
                    </td>
                    <td className="py-2.5 px-3 text-right font-bold text-emerald-600 dark:text-emerald-400">
                      +{formatCurrency(pay.amount, pay.currency?.code ?? activeEvent.currency.code)}
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <button
                        onClick={() => {
                          if (
                            confirm(
                              `Delete payment transaction of ${formatCurrency(
                                pay.amount,
                                pay.currency?.code ?? activeEvent.currency.code)} to ${pay.recipientName}?`
                            )
                          ) {
                            deletePayment(pay.id);
                          }
                        }}
                        className="p-1 rounded-md hover:bg-red-500/10 text-muted-foreground hover:text-red-500 transition-colors"
                        title="Delete transaction"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Vendors Table / Cards */}
      <div className="rounded-3xl border border-border bg-card p-6 shadow-card space-y-4">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-border text-muted-foreground font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-2.5 px-3">Preferred</th>
                <th className="py-2.5 px-3">Vendor / Business</th>
                <th className="py-2.5 px-3">Category</th>
                <th className="py-2.5 px-3 text-right">Quoted Price</th>
                <th className="py-2.5 px-3 text-center">Booking Status</th>
                <th className="py-2.5 px-3 text-center">Payment</th>
                <th className="py-2.5 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {filteredVendors.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-muted-foreground">
                    No vendors found. Click &quot;Add Vendor&quot; to log your first quote.
                  </td>
                </tr>
              ) : (
                filteredVendors.map((v) => (
                  <tr key={v.id} className="hover:bg-muted/30 transition-colors">
                    <td className="py-3 px-3">
                      <button
                        onClick={() => setPreferredVendor(v.id)}
                        className="p-1 rounded-full hover:bg-muted"
                        title={v.isPreferred ? "Preferred Vendor" : "Mark as Preferred"}
                      >
                        <Star
                          className={`w-4 h-4 ${
                            v.isPreferred
                              ? "fill-amber-400 text-amber-400"
                              : "text-muted-foreground"
                          }`}
                        />
                      </button>
                    </td>

                    <td className="py-3 px-3">
                      <p className="font-bold text-foreground flex items-center gap-2">
                        {v.name}
                        {v.isDemo && (
                          <span className="text-[9px] uppercase px-1.5 py-0.2 rounded bg-muted text-muted-foreground font-semibold">
                            Sample
                          </span>
                        )}
                      </p>
                      {v.contactPhone && (
                        <p className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
                          <Phone className="w-3 h-3" />
                          <span>{v.contactPhone}</span>
                        </p>
                      )}
                    </td>

                    <td className="py-3 px-3">
                      <span className="capitalize px-2 py-0.5 rounded-md bg-muted text-[11px] font-medium text-foreground">
                        {getVendorCategoryLabel(v.category)}
                      </span>
                    </td>

                    <td className="py-3 px-3 text-right">
                      <p className="font-bold text-foreground">
                        {formatCurrency(v.quotedAmount || 0, currencyCode, currencyLocale)}
                      </p>
                      {v.paymentStatus !== "unpaid" && (
                        <p className="text-[10px] text-sage font-semibold">
                          {formatCurrency(
                            v.paymentStatus === "paid"
                              ? (v.actualAmount && v.actualAmount > 0 ? v.actualAmount : (v.quotedAmount || 0))
                              : (v.actualAmount || 0),
                            currencyCode,
                            currencyLocale
                          )} paid
                        </p>
                      )}
                    </td>

                    <td className="py-3 px-3 text-center">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full capitalize ${
                          v.bookingStatus === "confirmed"
                            ? "bg-sage/20 text-sage"
                            : v.bookingStatus === "pending"
                            ? "bg-amber-500/20 text-amber-600 dark:text-amber-400"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {v.bookingStatus.replace("_", " ")}
                      </span>
                    </td>

                    <td className="py-3 px-3 text-center">
                      <div className="flex flex-col items-center">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full capitalize ${
                            v.paymentStatus === "paid"
                              ? "bg-sage/20 text-sage"
                              : v.paymentStatus === "partially_paid"
                              ? "bg-amber-500/20 text-amber-600 dark:text-amber-400"
                              : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {v.paymentStatus.replace("_", " ")}
                        </span>
                      </div>
                    </td>

                    <td className="py-3 px-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => openEditDialog(v)}
                          className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground"
                          title="Edit Vendor"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => deleteVendor(v.id)}
                          className="p-1.5 rounded-lg hover:bg-red-500/10 text-muted-foreground hover:text-red-500"
                          title="Delete Vendor"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Dedicated Financial Payment Ledger (Real Outflows) */}
      <div className="rounded-3xl border border-border bg-card p-6 shadow-card space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-border">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                <Coins className="w-4 h-4" />
              </div>
              <h3 className="font-serif text-lg font-bold text-foreground">
                Payment Ledger & Cash Outflows
              </h3>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Verified record of every payment, advance deposit, and balance transfer for this celebration.
            </p>
          </div>
          <span className="text-xs font-semibold px-3 py-1 rounded-full bg-muted/60 text-foreground self-start sm:self-auto">
            {paymentLedger.length} Transactions Recorded
          </span>
        </div>

        {paymentLedger.length === 0 ? (
          <div className="py-8 text-center text-xs text-muted-foreground">
            No payment transactions logged yet. Payments recorded in the AI Planner or here will be tracked permanently.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-border/70 text-muted-foreground font-semibold uppercase tracking-wider text-[10px]">
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Payee / Vendor</th>
                  <th className="py-2.5 px-3">Category</th>
                  <th className="py-2.5 px-3">Method</th>
                  <th className="py-2.5 px-3">Reference / Notes</th>
                  <th className="py-2.5 px-3 text-right">Amount</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {paymentLedger.map((pay) => (
                  <tr key={pay.id} className="hover:bg-muted/20 transition-colors">
                    <td className="py-2.5 px-3 whitespace-nowrap text-muted-foreground">
                      {pay.paymentDate || pay.createdAt.split("T")[0]}
                    </td>
                    <td className="py-2.5 px-3 font-semibold text-foreground">
                      {pay.recipientName}
                      {pay.isAdvance && (
                        <span className="ml-1.5 text-[9px] px-1.5 py-0.5 rounded-full bg-amber-500/15 text-amber-500 font-semibold">
                          Advance
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 capitalize text-muted-foreground">
                      {pay.category || "General"}
                    </td>
                    <td className="py-2.5 px-3 text-muted-foreground">
                      {pay.paymentMethod || "Direct Transfer"}
                    </td>
                    <td className="py-2.5 px-3 text-muted-foreground max-w-xs truncate">
                      {pay.notes || pay.transactionRef || "—"}
                    </td>
                    <td className="py-2.5 px-3 text-right font-bold text-emerald-600 dark:text-emerald-400">
                      +{formatCurrency(pay.amount, pay.currency?.code ?? activeEvent.currency.code)}
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <button
                        onClick={() => {
                          if (
                            confirm(
                              `Delete payment transaction of ${formatCurrency(
                                pay.amount,
                                pay.currency?.code ?? activeEvent.currency.code)} to ${pay.recipientName}?`
                            )
                          ) {
                            deletePayment(pay.id);
                          }
                        }}
                        className="p-1 rounded-md hover:bg-red-500/10 text-muted-foreground hover:text-red-500 transition-colors"
                        title="Delete transaction"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit Vendor Modal */}
      {dialogOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="w-full max-w-md rounded-3xl border border-border bg-card p-6 shadow-elevated space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-border">
              <h3 className="font-serif text-lg font-bold">
                {editingVendor ? "Edit Vendor Details" : "Add Vendor Quote"}
              </h3>
              <button
                onClick={() => setDialogOpen(false)}
                className="p-1 rounded-lg hover:bg-muted text-muted-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold mb-1">Vendor / Business Name *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Tasty Bites Catering"
                  className="w-full px-3 py-2 rounded-xl border border-input bg-background"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as VendorCategory)}
                    className="w-full px-3 py-2 rounded-xl border border-input bg-background"
                  >
                    <option value="venue">Venue</option>
                    <option value="catering">Catering</option>
                    <option value="photography">Photography</option>
                    <option value="decoration">Decoration</option>
                    <option value="cake">Cake & Desserts</option>
                    <option value="entertainment">Entertainment</option>
                    <option value="invitations">Invitations</option>
                    <option value="transport">Rentals & Transport</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold mb-1">Quoted Price ({currencyCode})</label>
                  <input
                    type="number"
                    min={0}
                    value={quotedAmount}
                    onChange={(e) => setQuotedAmount(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-input bg-background"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Booking Status</label>
                  <select
                    value={bookingStatus}
                    onChange={(e) => setBookingStatus(e.target.value as BookingStatus)}
                    className="w-full px-3 py-2 rounded-xl border border-input bg-background"
                  >
                    <option value="not_booked">Reviewing / Not Booked</option>
                    <option value="pending">Pending Advance</option>
                    <option value="confirmed">Confirmed / Locked</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold mb-1">Payment Status</label>
                  <select
                    value={paymentStatus}
                    onChange={(e) => {
                      const newStatus = e.target.value as PaymentStatus;
                      setPaymentStatus(newStatus);
                      if (newStatus === "paid") {
                        setActualAmount(quotedAmount > 0 ? quotedAmount : (actualAmount || 2000));
                      } else if (newStatus === "unpaid") {
                        setActualAmount(0);
                      }
                    }}
                    className="w-full px-3 py-2 rounded-xl border border-input bg-background"
                  >
                    <option value="unpaid">Unpaid</option>
                    <option value="partially_paid">Partially Paid</option>
                    <option value="paid">Fully Paid</option>
                  </select>
                </div>
              </div>

              {/* Payment Amount Sync Input */}
              <div className="p-3.5 rounded-2xl bg-muted/40 border border-border space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block font-semibold text-foreground">
                    Paid / Advance Amount ({currencyCode})
                  </label>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      paymentStatus === "paid"
                        ? "bg-sage/15 text-sage"
                        : paymentStatus === "partially_paid"
                        ? "bg-amber-500/15 text-amber-600"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {paymentStatus === "paid"
                      ? "100% Fully Paid"
                      : paymentStatus === "partially_paid"
                      ? "Advance Payment"
                      : "Unpaid (₹0)"}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={0}
                    value={actualAmount}
                    onChange={(e) => {
                      const val = Math.max(0, Number(e.target.value) || 0);
                      setActualAmount(val);
                      if (val >= quotedAmount && quotedAmount > 0) {
                        setPaymentStatus("paid");
                      } else if (val > 0) {
                        setPaymentStatus("partially_paid");
                      } else {
                        setPaymentStatus("unpaid");
                      }
                    }}
                    placeholder="Enter amount paid"
                    className="w-full px-3.5 py-2 rounded-xl border border-input bg-background font-bold text-foreground"
                  />
                  {quotedAmount > 0 && paymentStatus !== "paid" && (
                    <button
                      type="button"
                      onClick={() => {
                        setActualAmount(quotedAmount);
                        setPaymentStatus("paid");
                      }}
                      className="px-3 py-2 rounded-xl border border-primary/40 bg-primary/10 hover:bg-primary/20 text-primary text-[11px] font-bold whitespace-nowrap transition-colors"
                    >
                      Set Full ({currencyCode}{quotedAmount.toLocaleString()})
                    </button>
                  )}
                </div>

                <p className="text-[11px] text-muted-foreground">
                  {paymentStatus === "paid"
                    ? `✓ Full payment of ${currencyCode}${(actualAmount || quotedAmount).toLocaleString()} synchronizes directly with Budget Allocations & Paid KPI.`
                    : paymentStatus === "partially_paid"
                    ? `✓ Advance payment of ${currencyCode}${actualAmount.toLocaleString()} synchronizes directly with Budget Allocations & Paid KPI.`
                    : "No payment logged. When payment is made, enter the advance or full amount to reflect in Budget Allocations."}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Contact Phone</label>
                  <input
                    type="text"
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    placeholder="+91 98450 ..."
                    className="w-full px-3 py-2 rounded-xl border border-input bg-background"
                  />
                </div>

                <div>
                  <label className="block font-semibold mb-1">Contact Email</label>
                  <input
                    type="email"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    placeholder="vendor@domain.com"
                    className="w-full px-3 py-2 rounded-xl border border-input bg-background"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1">Notes / Terms</label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. ₹180 per plate, includes welcome mocktail"
                  className="w-full px-3 py-2 rounded-xl border border-input bg-background"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setDialogOpen(false)}
                  className="px-4 py-2 rounded-xl border border-border hover:bg-muted text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl gradient-cta text-white text-xs font-bold"
                >
                  Save Vendor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppShell>
  );
}

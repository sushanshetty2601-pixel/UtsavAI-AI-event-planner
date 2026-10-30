"use client";

import React, { useState, useEffect } from "react";
import { Vendor, VendorCategory, BookingStatus, PaymentStatus } from "@/types";
import { X } from "lucide-react";

interface VendorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (vendorData: {
    name: string;
    category: VendorCategory;
    quotedAmount: number;
    actualAmount: number;
    bookingStatus: BookingStatus;
    paymentStatus: PaymentStatus;
    contactPhone: string;
    contactEmail: string;
    notes: string;
  }) => void;
  editingVendor: Vendor | null;
  currencyCode: string;
}

function VendorModalContent({
  onClose,
  onSave,
  editingVendor,
  currencyCode,
}: Omit<VendorModalProps, "isOpen">) {
  const [name, setName] = useState(editingVendor?.name || "");
  const [category, setCategory] = useState<VendorCategory>(editingVendor?.category || "venue");
  const [quotedAmount, setQuotedAmount] = useState<number>(editingVendor?.quotedAmount || 0);
  const [actualAmount, setActualAmount] = useState<number>(editingVendor?.actualAmount || 0);
  const [bookingStatus, setBookingStatus] = useState<BookingStatus>(editingVendor?.bookingStatus || "not_booked");
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>(editingVendor?.paymentStatus || "unpaid");
  const [contactPhone, setContactPhone] = useState(editingVendor?.contactPhone || "");
  const [contactEmail, setContactEmail] = useState(editingVendor?.contactEmail || "");
  const [notes, setNotes] = useState(editingVendor?.notes || "");

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSave({
      name: name.trim(),
      category,
      quotedAmount,
      actualAmount,
      bookingStatus,
      paymentStatus,
      contactPhone: contactPhone.trim(),
      contactEmail: contactEmail.trim(),
      notes: notes.trim(),
    });
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="vendor-modal-title"
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in"
    >
      <div className="w-full max-w-md rounded-3xl border border-border bg-card p-6 shadow-elevated space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-border">
          <h3 id="vendor-modal-title" className="font-serif text-lg font-bold">
            {editingVendor ? "Edit Vendor Details" : "Add Vendor Quote"}
          </h3>
          <button
            onClick={onClose}
            aria-label="Close dialog"
            className="p-1 rounded-lg hover:bg-muted text-muted-foreground"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3 text-xs">
          <div>
            <label htmlFor="vendor-name-input" className="block font-semibold mb-1">
              Vendor / Business Name *
            </label>
            <input
              id="vendor-name-input"
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
              <label htmlFor="vendor-category-select" className="block font-semibold mb-1">
                Category
              </label>
              <select
                id="vendor-category-select"
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
              <label htmlFor="vendor-quoted-input" className="block font-semibold mb-1">
                Quoted Price ({currencyCode})
              </label>
              <input
                id="vendor-quoted-input"
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
              <label htmlFor="vendor-booking-status" className="block font-semibold mb-1">
                Booking Status
              </label>
              <select
                id="vendor-booking-status"
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
              <label htmlFor="vendor-payment-status" className="block font-semibold mb-1">
                Payment Status
              </label>
              <select
                id="vendor-payment-status"
                value={paymentStatus}
                onChange={(e) => {
                  const newStatus = e.target.value as PaymentStatus;
                  setPaymentStatus(newStatus);
                  if (newStatus === "paid") {
                    setActualAmount(quotedAmount > 0 ? quotedAmount : actualAmount || 2000);
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
              <label htmlFor="vendor-paid-amount" className="block font-semibold text-foreground">
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
                id="vendor-paid-amount"
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
              <label htmlFor="vendor-contact-phone" className="block font-semibold mb-1">
                Contact Phone
              </label>
              <input
                id="vendor-contact-phone"
                type="text"
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                placeholder="+91 98450 ..."
                className="w-full px-3 py-2 rounded-xl border border-input bg-background"
              />
            </div>

            <div>
              <label htmlFor="vendor-contact-email" className="block font-semibold mb-1">
                Contact Email
              </label>
              <input
                id="vendor-contact-email"
                type="email"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                placeholder="vendor@domain.com"
                className="w-full px-3 py-2 rounded-xl border border-input bg-background"
              />
            </div>
          </div>

          <div>
            <label htmlFor="vendor-notes-input" className="block font-semibold mb-1">
              Notes / Terms
            </label>
            <input
              id="vendor-notes-input"
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
              onClick={onClose}
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
  );
}

export function VendorModal(props: VendorModalProps) {
  if (!props.isOpen) return null;
  return <VendorModalContent {...props} key={props.editingVendor?.id || "new-vendor"} />;
}

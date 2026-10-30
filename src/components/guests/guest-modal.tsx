"use client";

import React, { useState, useEffect } from "react";
import { Guest, RSVPStatus, GuestGroup, DietaryPreference } from "@/types";
import { X } from "lucide-react";

interface GuestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (guestData: {
    name: string;
    phone: string;
    email: string;
    rsvpStatus: RSVPStatus;
    group: GuestGroup;
    plusOnes: number;
    dietary: DietaryPreference;
    tableNumber: string;
    dietaryNotes: string;
    notes: string;
  }) => void;
  editingGuest: Guest | null;
}

function GuestModalContent({
  onClose,
  onSave,
  editingGuest,
}: Omit<GuestModalProps, "isOpen">) {
  const [formData, setFormData] = useState({
    name: editingGuest?.name || "",
    phone: editingGuest?.phone || "",
    email: editingGuest?.email || "",
    rsvpStatus: (editingGuest?.rsvpStatus || "attending") as RSVPStatus,
    group: (editingGuest?.group || "general") as GuestGroup,
    plusOnes: editingGuest?.plusOnes || 0,
    dietary: (editingGuest?.dietary || "vegetarian") as DietaryPreference,
    tableNumber: editingGuest?.tableNumber || "",
    dietaryNotes: editingGuest?.dietaryNotes || "",
    notes: editingGuest?.notes || "",
  });

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;
    onSave({
      name: formData.name.trim(),
      phone: formData.phone.trim(),
      email: formData.email.trim(),
      rsvpStatus: formData.rsvpStatus,
      group: formData.group,
      plusOnes: Number(formData.plusOnes) || 0,
      dietary: formData.dietary,
      tableNumber: formData.tableNumber.trim(),
      dietaryNotes: formData.dietaryNotes.trim(),
      notes: formData.notes.trim(),
    });
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="guest-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in"
    >
      <div className="bg-card border border-border w-full max-w-lg rounded-2xl shadow-elevated p-6 space-y-5 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-3 border-b border-border">
          <h3 id="guest-modal-title" className="font-serif text-lg font-bold text-foreground">
            {editingGuest ? "Edit Guest Details" : "Add New Guest"}
          </h3>
          <button
            onClick={onClose}
            aria-label="Close dialog"
            className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label htmlFor="guest-name-input" className="block text-[11px] font-bold text-muted-foreground uppercase mb-1">
              Guest Name(s) *
            </label>
            <input
              id="guest-name-input"
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Vikram & Maya Malhotra"
              className="w-full px-3 py-2 rounded-xl border border-border bg-background text-foreground text-xs focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="guest-phone-input" className="block text-[11px] font-bold text-muted-foreground uppercase mb-1">
                Phone / WhatsApp
              </label>
              <input
                id="guest-phone-input"
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+91 98450 12345"
                className="w-full px-3 py-2 rounded-xl border border-border bg-background text-foreground text-xs focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <div>
              <label htmlFor="guest-email-input" className="block text-[11px] font-bold text-muted-foreground uppercase mb-1">
                Email Address
              </label>
              <input
                id="guest-email-input"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="guest@example.com"
                className="w-full px-3 py-2 rounded-xl border border-border bg-background text-foreground text-xs focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label htmlFor="guest-rsvp-status" className="block text-[11px] font-bold text-muted-foreground uppercase mb-1">
                RSVP Status
              </label>
              <select
                id="guest-rsvp-status"
                value={formData.rsvpStatus}
                onChange={(e) => setFormData({ ...formData, rsvpStatus: e.target.value as RSVPStatus })}
                className="w-full px-3 py-2 rounded-xl border border-border bg-background text-foreground text-xs focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="attending">Attending</option>
                <option value="pending">Pending</option>
                <option value="declined">Declined</option>
              </select>
            </div>

            <div>
              <label htmlFor="guest-group-select" className="block text-[11px] font-bold text-muted-foreground uppercase mb-1">
                Guest Group
              </label>
              <select
                id="guest-group-select"
                value={formData.group}
                onChange={(e) => setFormData({ ...formData, group: e.target.value as GuestGroup })}
                className="w-full px-3 py-2 rounded-xl border border-border bg-background text-foreground text-xs focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="vip">VIP</option>
                <option value="bride_family">Bride&apos;s Family</option>
                <option value="groom_family">Groom&apos;s Family</option>
                <option value="friends">Friends</option>
                <option value="colleagues">Colleagues</option>
                <option value="general">General</option>
              </select>
            </div>

            <div>
              <label htmlFor="guest-plus-ones" className="block text-[11px] font-bold text-muted-foreground uppercase mb-1">
                +1 Companions
              </label>
              <input
                id="guest-plus-ones"
                type="number"
                min="0"
                max="10"
                value={formData.plusOnes}
                onChange={(e) => setFormData({ ...formData, plusOnes: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 rounded-xl border border-border bg-background text-foreground text-xs focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="guest-dietary-select" className="block text-[11px] font-bold text-muted-foreground uppercase mb-1">
                Dietary Requirement
              </label>
              <select
                id="guest-dietary-select"
                value={formData.dietary}
                onChange={(e) => setFormData({ ...formData, dietary: e.target.value as DietaryPreference })}
                className="w-full px-3 py-2 rounded-xl border border-border bg-background text-foreground text-xs focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="vegetarian">🥦 Vegetarian</option>
                <option value="jain">🥬 Jain (No Root Veg)</option>
                <option value="vegan">🌱 Vegan</option>
                <option value="non_veg">🍗 Non-Veg</option>
                <option value="halal">🥩 Halal</option>
                <option value="gluten_free">🌾 Gluten-Free</option>
                <option value="no_preference">🍽️ Standard / No Preference</option>
              </select>
            </div>

            <div>
              <label htmlFor="guest-table-number" className="block text-[11px] font-bold text-muted-foreground uppercase mb-1">
                Table Seating Label
              </label>
              <input
                id="guest-table-number"
                type="text"
                value={formData.tableNumber}
                onChange={(e) => setFormData({ ...formData, tableNumber: e.target.value })}
                placeholder="e.g. Table 1 (Family)"
                className="w-full px-3 py-2 rounded-xl border border-border bg-background text-foreground text-xs focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>

          <div>
            <label htmlFor="guest-dietary-notes" className="block text-[11px] font-bold text-muted-foreground uppercase mb-1">
              Specific Dietary Notes (Allergies, etc.)
            </label>
            <input
              id="guest-dietary-notes"
              type="text"
              value={formData.dietaryNotes}
              onChange={(e) => setFormData({ ...formData, dietaryNotes: e.target.value })}
              placeholder="e.g. Severe peanut allergy, strict no onion/garlic"
              className="w-full px-3 py-2 rounded-xl border border-border bg-background text-foreground text-xs focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          <div>
            <label htmlFor="guest-host-notes" className="block text-[11px] font-bold text-muted-foreground uppercase mb-1">
              Host Notes / Logistics
            </label>
            <textarea
              id="guest-host-notes"
              rows={2}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="e.g. Arriving on evening flight, needs hotel airport pickup"
              className="w-full px-3 py-2 rounded-xl border border-border bg-background text-foreground text-xs focus:outline-none focus:ring-1 focus:ring-primary resize-none"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-border hover:bg-muted text-xs font-semibold transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl gradient-cta text-white text-xs font-bold shadow-sm hover:opacity-95 transition-all"
            >
              {editingGuest ? "Update Guest" : "Add to List"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function GuestModal(props: GuestModalProps) {
  if (!props.isOpen) return null;
  return <GuestModalContent {...props} key={props.editingGuest?.id || "new-guest"} />;
}

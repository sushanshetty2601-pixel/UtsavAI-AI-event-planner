"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { useApp } from "@/contexts/app-context";
import {
  Guest,
  RSVPStatus,
  GuestGroup,
  DietaryPreference,
} from "@/types";
import {
  Users,
  Sparkles,
  Search,
  Utensils,
  Phone,
  Mail,
  Trash2,
  Edit2,
  LayoutGrid,
  List,
  Plus,
} from "lucide-react";

export default function GuestsPage() {
  const {
    activeEvent,
    guests,
    createGuest,
    updateGuest,
    deleteGuest,
    autoAssignTables,
    isDemoMode,
  } = useApp();

  const [viewMode, setViewMode] = useState<"list" | "tables">("list");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterRSVP, setFilterRSVP] = useState<string>("all");
  const [filterGroup, setFilterGroup] = useState<string>("all");
  const [filterDietary, setFilterDietary] = useState<string>("all");

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGuest, setEditingGuest] = useState<Guest | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    rsvpStatus: "pending" as RSVPStatus,
    group: "general" as GuestGroup,
    plusOnes: 0,
    dietary: "vegetarian" as DietaryPreference,
    dietaryNotes: "",
    tableNumber: "",
    notes: "",
  });

  // Calculate Metrics
  const metrics = useMemo(() => {
    let totalInvited = 0;
    let totalConfirmedHeadcount = 0;
    let attendingCount = 0;
    let pendingCount = 0;
    let declinedCount = 0;
    let seatedCount = 0;

    const dietaryCounts: Record<DietaryPreference, number> = {
      vegetarian: 0,
      jain: 0,
      vegan: 0,
      non_veg: 0,
      halal: 0,
      gluten_free: 0,
      no_preference: 0,
    };

    guests.forEach((g) => {
      const seats = 1 + (g.plusOnes || 0);
      totalInvited += seats;

      if (g.rsvpStatus === "attending") {
        attendingCount++;
        totalConfirmedHeadcount += seats;
        dietaryCounts[g.dietary] = (dietaryCounts[g.dietary] || 0) + seats;
      } else if (g.rsvpStatus === "pending") {
        pendingCount++;
      } else if (g.rsvpStatus === "declined") {
        declinedCount++;
      }

      if (g.tableNumber && g.tableNumber.trim() !== "") {
        seatedCount += seats;
      }
    });

    return {
      totalGuests: guests.length,
      totalInvited,
      attendingCount,
      totalConfirmedHeadcount,
      pendingCount,
      declinedCount,
      seatedCount,
      dietaryCounts,
    };
  }, [guests]);

  // Filtered Guests
  const filteredGuests = useMemo(() => {
    return guests.filter((g) => {
      const matchSearch =
        searchQuery === "" ||
        g.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (g.phone && g.phone.includes(searchQuery)) ||
        (g.tableNumber && g.tableNumber.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (g.notes && g.notes.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchRSVP = filterRSVP === "all" || g.rsvpStatus === filterRSVP;
      const matchGroup = filterGroup === "all" || g.group === filterGroup;
      const matchDietary = filterDietary === "all" || g.dietary === filterDietary;

      return matchSearch && matchRSVP && matchGroup && matchDietary;
    });
  }, [guests, searchQuery, filterRSVP, filterGroup, filterDietary]);

  // Grouped by Table for Table View
  const tablesMap = useMemo(() => {
    const map = new Map<string, Guest[]>();
    guests.forEach((g) => {
      const tableKey = g.tableNumber && g.tableNumber.trim() !== "" ? g.tableNumber : "Unassigned";
      if (!map.has(tableKey)) {
        map.set(tableKey, []);
      }
      map.get(tableKey)!.push(g);
    });
    return map;
  }, [guests]);

  const handleOpenAddModal = () => {
    setEditingGuest(null);
    setFormData({
      name: "",
      phone: "",
      email: "",
      rsvpStatus: "pending",
      group: "general",
      plusOnes: 0,
      dietary: "vegetarian",
      dietaryNotes: "",
      tableNumber: "",
      notes: "",
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (guest: Guest) => {
    setEditingGuest(guest);
    setFormData({
      name: guest.name,
      phone: guest.phone || "",
      email: guest.email || "",
      rsvpStatus: guest.rsvpStatus,
      group: guest.group,
      plusOnes: guest.plusOnes || 0,
      dietary: guest.dietary,
      dietaryNotes: guest.dietaryNotes || "",
      tableNumber: guest.tableNumber || "",
      notes: guest.notes || "",
    });
    setIsModalOpen(true);
  };

  const handleSubmitModal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !activeEvent) return;

    if (editingGuest) {
      updateGuest(editingGuest.id, {
        ...formData,
      });
    } else {
      createGuest({
        eventId: activeEvent.id,
        ...formData,
      });
    }

    setIsModalOpen(false);
  };

  const getGroupBadge = (group: GuestGroup) => {
    const badges: Record<GuestGroup, { label: string; color: string }> = {
      vip: { label: "VIP", color: "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30" },
      bride_family: { label: "Bride&apos;s Family", color: "bg-pink-500/15 text-pink-600 dark:text-pink-400 border-pink-500/30" },
      groom_family: { label: "Groom&apos;s Family", color: "bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30" },
      friends: { label: "Friends", color: "bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-500/30" },
      colleagues: { label: "Colleagues", color: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30" },
      general: { label: "Guest", color: "bg-muted text-muted-foreground border-border" },
    };
    const b = badges[group] || badges.general;
    return (
      <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold border ${b.color}`}>
        {b.label}
      </span>
    );
  };

  const getDietaryBadge = (dietary: DietaryPreference, notes?: string) => {
    const labels: Record<DietaryPreference, { name: string; emoji: string }> = {
      vegetarian: { name: "Vegetarian", emoji: "🥦" },
      jain: { name: "Jain", emoji: "🥬" },
      vegan: { name: "Vegan", emoji: "🌱" },
      non_veg: { name: "Non-Veg", emoji: "🍗" },
      halal: { name: "Halal", emoji: "🥩" },
      gluten_free: { name: "Gluten-Free", emoji: "🌾" },
      no_preference: { name: "Standard", emoji: "🍽️" },
    };
    const d = labels[dietary] || labels.no_preference;
    return (
      <div className="flex flex-col">
        <span className="inline-flex items-center gap-1 text-xs font-medium text-foreground">
          <span>{d.emoji}</span>
          <span>{d.name}</span>
        </span>
        {notes && <span className="text-[10px] text-muted-foreground truncate max-w-[140px]" title={notes}>{notes}</span>}
      </div>
    );
  };

  if (!activeEvent) {
    return (
      <div className="max-w-6xl mx-auto py-16 px-4 text-center space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto">
          <Users className="w-6 h-6" />
        </div>
        <h2 className="font-serif text-2xl font-bold">No Event Selected</h2>
        <p className="text-sm text-muted-foreground">Please select an event or load the demo celebration from the top navigation.</p>
        <Link href="/wizard" className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl gradient-cta text-white font-bold text-sm shadow-sm">
          <span>Create an Event</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-20">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-serif text-2xl sm:text-3xl font-bold text-foreground">
              Guest RSVP & Seating Copilot
            </h1>
            {isDemoMode && (
              <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                Demo
              </span>
            )}
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Track RSVPs, dietary requirements (Jain, Halal, Vegan), and auto-group guests into balanced table arrangements.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => autoAssignTables(8)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-primary/30 bg-primary/10 text-primary hover:bg-primary/20 text-xs font-bold transition-all shadow-xs"
            title="Auto-group guests into balanced tables based on family, friends, and VIP groups"
          >
            <Sparkles className="w-3.5 h-3.5 text-primary" />
            <span>AI Auto-Seat Guests</span>
          </button>


          <button
            onClick={handleOpenAddModal}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl gradient-cta text-white text-xs font-bold shadow-sm hover:opacity-95 active:scale-95 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Add Guest</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <div className="p-4 rounded-2xl border border-border bg-card shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Total Headcount</span>
          <p className="font-serif text-xl sm:text-2xl font-bold text-foreground mt-0.5">
            {metrics.totalConfirmedHeadcount} <span className="text-xs font-normal text-muted-foreground">/ {metrics.totalInvited} invited</span>
          </p>
          <span className="text-[11px] text-muted-foreground">Including +1 companions</span>
        </div>

        <div className="p-4 rounded-2xl border border-border bg-card shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">Confirmed (Attending)</span>
          <p className="font-serif text-xl sm:text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
            {metrics.attendingCount}
          </p>
          <span className="text-[11px] text-muted-foreground">
            {metrics.totalGuests > 0 ? `${Math.round((metrics.attendingCount / metrics.totalGuests) * 100)}% of invitations` : "0%"}
          </span>
        </div>

        <div className="p-4 rounded-2xl border border-border bg-card shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">Awaiting RSVP</span>
          <p className="font-serif text-xl sm:text-2xl font-bold text-amber-600 dark:text-amber-400 mt-0.5">
            {metrics.pendingCount}
          </p>
          <span className="text-[11px] text-muted-foreground">Pending confirmation</span>
        </div>

        <div className="p-4 rounded-2xl border border-border bg-card shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-red-600 dark:text-red-400">Declined</span>
          <p className="font-serif text-xl sm:text-2xl font-bold text-red-600 dark:text-red-400 mt-0.5">
            {metrics.declinedCount}
          </p>
          <span className="text-[11px] text-muted-foreground">Regrets received</span>
        </div>

        <div className="p-4 rounded-2xl border border-border bg-card shadow-xs col-span-2 sm:col-span-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-primary">Seated at Tables</span>
          <p className="font-serif text-xl sm:text-2xl font-bold text-foreground mt-0.5">
            {metrics.seatedCount} <span className="text-xs font-normal text-muted-foreground">/ {metrics.totalConfirmedHeadcount}</span>
          </p>
          <span className="text-[11px] text-muted-foreground">
            {metrics.totalConfirmedHeadcount > 0 && metrics.seatedCount >= metrics.totalConfirmedHeadcount
              ? "All guests assigned 🎉"
              : "Use Auto-Seat to finish"}
          </span>
        </div>
      </div>

      {/* Dietary Preference Summary Bar */}
      <div className="p-4 rounded-2xl border border-border bg-card/60 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Utensils className="w-4 h-4 text-primary shrink-0" />
          <span className="text-xs font-bold uppercase tracking-wider text-foreground">
            Catering & Dietary Requirements (Confirmed Guests):
          </span>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {metrics.dietaryCounts.vegetarian > 0 && (
            <span className="px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-semibold border border-emerald-500/20">
              🥦 {metrics.dietaryCounts.vegetarian} Vegetarian
            </span>
          )}
          {metrics.dietaryCounts.jain > 0 && (
            <span className="px-2.5 py-1 rounded-lg bg-green-500/10 text-green-600 dark:text-green-400 text-xs font-semibold border border-green-500/20">
              🥬 {metrics.dietaryCounts.jain} Jain (No Root Veg)
            </span>
          )}
          {metrics.dietaryCounts.vegan > 0 && (
            <span className="px-2.5 py-1 rounded-lg bg-teal-500/10 text-teal-600 dark:text-teal-400 text-xs font-semibold border border-teal-500/20">
              🌱 {metrics.dietaryCounts.vegan} Vegan
            </span>
          )}
          {metrics.dietaryCounts.halal > 0 && (
            <span className="px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs font-semibold border border-amber-500/20">
              🥩 {metrics.dietaryCounts.halal} Halal
            </span>
          )}
          {metrics.dietaryCounts.gluten_free > 0 && (
            <span className="px-2.5 py-1 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 text-xs font-semibold border border-purple-500/20">
              🌾 {metrics.dietaryCounts.gluten_free} Gluten-Free
            </span>
          )}
          {metrics.dietaryCounts.non_veg > 0 && (
            <span className="px-2.5 py-1 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400 text-xs font-semibold border border-rose-500/20">
              🍗 {metrics.dietaryCounts.non_veg} Non-Veg
            </span>
          )}
        </div>
      </div>

      {/* Filter and View Toggle Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-1 flex-wrap">
          {/* Search Box */}
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search guests by name, phone, table..."
              className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-border bg-card text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          {/* Filter RSVP */}
          <select
            value={filterRSVP}
            onChange={(e) => setFilterRSVP(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-border bg-card text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="all">All RSVP Statuses</option>
            <option value="attending">Attending</option>
            <option value="pending">Pending</option>
            <option value="declined">Declined</option>
          </select>

          {/* Filter Group */}
          <select
            value={filterGroup}
            onChange={(e) => setFilterGroup(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-border bg-card text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="all">All Groups</option>
            <option value="vip">VIP</option>
            <option value="bride_family">Bride&apos;s Family</option>
            <option value="groom_family">Groom&apos;s Family</option>
            <option value="friends">Friends</option>
            <option value="colleagues">Colleagues</option>
            <option value="general">General</option>
          </select>

          {/* Filter Dietary */}
          <select
            value={filterDietary}
            onChange={(e) => setFilterDietary(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-border bg-card text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="all">All Dietary Preferences</option>
            <option value="vegetarian">Vegetarian</option>
            <option value="jain">Jain</option>
            <option value="vegan">Vegan</option>
            <option value="non_veg">Non-Veg</option>
            <option value="halal">Halal</option>
            <option value="gluten_free">Gluten-Free</option>
          </select>
        </div>

        {/* View Toggle */}
        <div className="flex items-center self-end sm:self-auto p-1 rounded-xl border border-border bg-card">
          <button
            onClick={() => setViewMode("list")}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
              viewMode === "list"
                ? "bg-primary text-white shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <List className="w-3.5 h-3.5" />
            <span>List View</span>
          </button>
          <button
            onClick={() => setViewMode("tables")}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
              viewMode === "tables"
                ? "bg-primary text-white shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span>Table Arrangement</span>
          </button>
        </div>
      </div>

      {/* View Mode: List View */}
      {viewMode === "list" && (
        <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-muted/60 text-muted-foreground uppercase font-bold text-[10px] border-b border-border tracking-wider">
                <tr>
                  <th className="py-3 px-4">Guest Name</th>
                  <th className="py-3 px-3">Group</th>
                  <th className="py-3 px-3">RSVP Status</th>
                  <th className="py-3 px-3 text-center">+1 Companions</th>
                  <th className="py-3 px-3">Dietary Preference</th>
                  <th className="py-3 px-3">Table Seating</th>
                  <th className="py-3 px-3">Contact</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredGuests.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-muted-foreground space-y-2">
                      <Users className="w-8 h-8 mx-auto text-muted-foreground/40" />
                      <p>No guests match the current search or filters.</p>
                      <button
                        onClick={handleOpenAddModal}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-border text-xs text-primary font-semibold hover:bg-muted"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add First Guest</span>
                      </button>
                    </td>
                  </tr>
                ) : (
                  filteredGuests.map((g) => (
                    <tr key={g.id} className="hover:bg-muted/30 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-semibold text-foreground text-sm">{g.name}</div>
                        {g.notes && <div className="text-[11px] text-muted-foreground truncate max-w-xs">{g.notes}</div>}
                      </td>
                      <td className="py-3 px-3">{getGroupBadge(g.group)}</td>
                      <td className="py-3 px-3">
                        <select
                          value={g.rsvpStatus}
                          onChange={(e) => updateGuest(g.id, { rsvpStatus: e.target.value as RSVPStatus })}
                          className="text-xs rounded-lg border border-border bg-card px-2 py-1 font-semibold focus:outline-none focus:ring-1 focus:ring-primary"
                        >
                          <option value="attending">Attending</option>
                          <option value="pending">Pending</option>
                          <option value="declined">Declined</option>
                        </select>
                      </td>
                      <td className="py-3 px-3 text-center font-bold text-foreground">
                        {g.plusOnes > 0 ? `+${g.plusOnes}` : "—"}
                      </td>
                      <td className="py-3 px-3">{getDietaryBadge(g.dietary, g.dietaryNotes)}</td>
                      <td className="py-3 px-3">
                        {g.tableNumber ? (
                          <span className="px-2.5 py-1 rounded-lg bg-primary/10 text-primary font-semibold border border-primary/20 text-xs">
                            {g.tableNumber}
                          </span>
                        ) : (
                          <span className="text-muted-foreground italic text-[11px]">Unassigned</span>
                        )}
                      </td>
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2">
                          {g.phone && (
                            <a
                              href={`https://wa.me/${g.phone.replace(/[^0-9]/g, "")}`}
                              target="_blank"
                              rel="noreferrer"
                              className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 transition-colors"
                              title="Chat on WhatsApp"
                            >
                              <Phone className="w-3.5 h-3.5" />
                            </a>
                          )}
                          {g.email && (
                            <a
                              href={`mailto:${g.email}`}
                              className="p-1.5 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 hover:bg-blue-500/20 transition-colors"
                              title="Send Email"
                            >
                              <Mail className="w-3.5 h-3.5" />
                            </a>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleOpenEditModal(g)}
                            className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                            title="Edit Guest"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`Remove guest ${g.name} from the celebration list?`)) {
                                deleteGuest(g.id);
                              }
                            }}
                            className="p-1.5 rounded-lg hover:bg-red-500/10 text-muted-foreground hover:text-red-500 transition-colors"
                            title="Delete Guest"
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
      )}

      {/* View Mode: Table Arrangement View */}
      {viewMode === "tables" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-2xl border border-primary/20 bg-primary/5">
            <div className="flex items-center gap-2.5">
              <Sparkles className="w-5 h-5 text-primary" />
              <div>
                <p className="text-xs font-bold text-foreground">AI Table Arrangement Spatializer</p>
                <p className="text-[11px] text-muted-foreground">
                  Guests are grouped logically (VIPs, Bride & Groom Families, Friends, Colleagues) with dietary requirement visibility.
                </p>
              </div>
            </div>
            <button
              onClick={() => autoAssignTables(8)}
              className="px-3.5 py-1.5 rounded-xl gradient-cta text-white text-xs font-bold shadow-xs hover:opacity-95 transition-all"
            >
              Re-Seat Guests
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from(tablesMap.entries()).map(([tableTitle, tableGuests]) => {
              const tableTotalSeats = tableGuests.reduce((acc, g) => acc + 1 + (g.plusOnes || 0), 0);
              const isUnassigned = tableTitle === "Unassigned";

              return (
                <div
                  key={tableTitle}
                  className={`rounded-2xl border ${
                    isUnassigned ? "border-amber-500/30 bg-amber-500/5" : "border-border bg-card"
                  } p-5 shadow-xs space-y-3 flex flex-col justify-between`}
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between border-b border-border pb-2.5">
                      <div className="flex items-center gap-2">
                        <span className="font-serif font-bold text-base text-foreground">{tableTitle}</span>
                      </div>
                      <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-muted text-muted-foreground">
                        {tableTotalSeats} {tableTotalSeats === 1 ? "seat" : "seats"}
                      </span>
                    </div>

                    <div className="space-y-2">
                      {tableGuests.map((g) => (
                        <div
                          key={g.id}
                          className="flex items-center justify-between p-2 rounded-xl bg-muted/40 hover:bg-muted/70 text-xs transition-colors"
                        >
                          <div className="space-y-0.5">
                            <span className="font-semibold text-foreground">{g.name}</span>
                            {g.plusOnes > 0 && (
                              <span className="text-[10px] text-muted-foreground ml-1">(+{g.plusOnes})</span>
                            )}
                            <div className="flex items-center gap-1.5">{getGroupBadge(g.group)}</div>
                          </div>
                          <div>{getDietaryBadge(g.dietary)}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {isUnassigned && (
                    <button
                      onClick={() => autoAssignTables(8)}
                      className="w-full py-1.5 rounded-xl border border-primary/30 text-primary text-xs font-semibold hover:bg-primary/10 transition-colors"
                    >
                      Auto-Seat Unassigned Guests
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Add / Edit Guest Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-card border border-border w-full max-w-lg rounded-2xl shadow-elevated p-6 space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <h3 className="font-serif text-lg font-bold text-foreground">
                {editingGuest ? "Edit Guest Details" : "Add New Guest"}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg hover:bg-muted text-muted-foreground"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitModal} className="space-y-4 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-muted-foreground uppercase mb-1">
                  Guest Name(s) *
                </label>
                <input
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
                  <label className="block text-[11px] font-bold text-muted-foreground uppercase mb-1">
                    Phone / WhatsApp
                  </label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+91 98450 12345"
                    className="w-full px-3 py-2 rounded-xl border border-border bg-background text-foreground text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-muted-foreground uppercase mb-1">
                    Email Address
                  </label>
                  <input
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
                  <label className="block text-[11px] font-bold text-muted-foreground uppercase mb-1">
                    RSVP Status
                  </label>
                  <select
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
                  <label className="block text-[11px] font-bold text-muted-foreground uppercase mb-1">
                    Guest Group
                  </label>
                  <select
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
                  <label className="block text-[11px] font-bold text-muted-foreground uppercase mb-1">
                    +1 Companions
                  </label>
                  <input
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
                  <label className="block text-[11px] font-bold text-muted-foreground uppercase mb-1">
                    Dietary Requirement
                  </label>
                  <select
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
                  <label className="block text-[11px] font-bold text-muted-foreground uppercase mb-1">
                    Table Seating Label
                  </label>
                  <input
                    type="text"
                    value={formData.tableNumber}
                    onChange={(e) => setFormData({ ...formData, tableNumber: e.target.value })}
                    placeholder="e.g. Table 1 (Family)"
                    className="w-full px-3 py-2 rounded-xl border border-border bg-background text-foreground text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-muted-foreground uppercase mb-1">
                  Specific Dietary Notes (Allergies, etc.)
                </label>
                <input
                  type="text"
                  value={formData.dietaryNotes}
                  onChange={(e) => setFormData({ ...formData, dietaryNotes: e.target.value })}
                  placeholder="e.g. Severe peanut allergy, strict no onion/garlic"
                  className="w-full px-3 py-2 rounded-xl border border-border bg-background text-foreground text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-muted-foreground uppercase mb-1">
                  Host Notes / Logistics
                </label>
                <textarea
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
                  onClick={() => setIsModalOpen(false)}
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
      )}
    </div>
  );
}

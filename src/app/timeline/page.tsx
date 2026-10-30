"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useApp } from "@/contexts/app-context";
import { AppShell } from "@/components/app-shell";
import { formatDateShort, daysUntil } from "@/lib/utils";
import { Task, TaskPriority, TaskStatus, TaskCategory, SubEventItinerary } from "@/types";
import { CoordinatorHandoutModal } from "@/components/coordinator-handout-modal";
import confetti from "canvas-confetti";
import {
  Clock,
  Plus,
  CheckCircle2,
  Calendar,
  Trash2,
  Edit2,
  Check,
  Sparkles,
  Printer,
  MapPin,
  ListTodo,
} from "lucide-react";

export default function TimelinePage() {
  const {
    activeEvent,
    tasks,
    createTask,
    updateTask,
    deleteTask,
    subEvents,
    createSubEvent,
    updateSubEvent,
    deleteSubEvent,
    isDemoMode,
  } = useApp();

  const [mainTab, setMainTab] = useState<"ceremonies" | "tasks">("ceremonies");
  const [phaseFilter, setPhaseFilter] = useState<string>("all");
  const [handoutOpen, setHandoutOpen] = useState(false);

  // Task Dialog State
  const [taskDialogOpen, setTaskDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [priority, setPriority] = useState<TaskPriority>("medium");
  const [category, setCategory] = useState<TaskCategory>("planning");
  const [phase, setPhase] = useState<"planning" | "bookings" | "one_week" | "event_day" | "post_event">("planning");

  // Sub-Event / Ceremony Dialog State
  const [subDialogOpen, setSubDialogOpen] = useState(false);
  const [editingSub, setEditingSub] = useState<SubEventItinerary | null>(null);
  const [subForm, setSubForm] = useState({
    title: "",
    dayNumber: 1,
    date: "",
    startTime: "18:00",
    endTime: "22:00",
    venueLocation: "",
    dressCode: "Pastel Elegance",
    cateringStyle: "Multi-Cuisine Buffet",
    description: "",
    keyMomentsText: "Guest Arrival\nCake Cutting / Ceremony\nDinner & DJ",
    coordinatorName: "",
    coordinatorPhone: "",
  });

  if (!activeEvent) {
    return (
      <AppShell>
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-5 max-w-xl mx-auto py-12">
          <div className="w-16 h-16 rounded-3xl bg-primary/10 text-primary flex items-center justify-center text-3xl shadow-card">
            <Clock className="w-8 h-8" />
          </div>
          <h2 className="font-serif text-3xl font-bold text-foreground">
            Multi-Day Itinerary & Task Checklists
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Create an event or load our sample celebration to schedule multi-day ceremonies (Sangeet, Haldi, Reception), dress codes, and booking milestones.
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
      </AppShell>
    );
  }

  const completedCount = tasks.filter((t) => t.status === "completed").length;
  const totalCount = tasks.length || 1;
  const pct = Math.round((completedCount / totalCount) * 100);

  const filteredTasks = tasks.filter((t) => {
    if (phaseFilter === "completed") return t.status === "completed";
    if (phaseFilter === "planning") return t.phase === "planning" && t.status !== "completed";
    if (phaseFilter === "bookings") return t.phase === "bookings" && t.status !== "completed";
    if (phaseFilter === "event_day") return (t.phase === "one_week" || t.phase === "event_day") && t.status !== "completed";
    return true;
  });

  const handleToggleComplete = (t: Task) => {
    const nextStatus: TaskStatus = t.status === "completed" ? "pending" : "completed";
    updateTask(t.id, { status: nextStatus });

    if (nextStatus === "completed") {
      try {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.7 },
          colors: ["#EF7187", "#9782E8", "#638773", "#F2D9C0"],
        });
      } catch {
        // Safe if canvas blocked
      }
    }
  };

  const openAddTaskDialog = () => {
    setEditingTask(null);
    setTitle("");
    setDescription("");
    setDueDate(new Date(Date.now() + 7 * 86400000).toISOString().split("T")[0]);
    setPriority("medium");
    setCategory("planning");
    setPhase("planning");
    setTaskDialogOpen(true);
  };

  const openEditTaskDialog = (t: Task) => {
    setEditingTask(t);
    setTitle(t.title);
    setDescription(t.description || "");
    setDueDate(t.dueDate.split("T")[0]);
    setPriority(t.priority);
    setCategory(t.category);
    setPhase(t.phase || "planning");
    setTaskDialogOpen(true);
  };

  const handleSaveTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    if (editingTask) {
      updateTask(editingTask.id, {
        title,
        description,
        dueDate,
        priority,
        category,
        phase,
      });
    } else {
      createTask({
        eventId: activeEvent.id,
        title,
        description,
        dueDate,
        priority,
        status: "pending",
        category,
        phase,
      });
    }
    setTaskDialogOpen(false);
  };

  const openAddSubDialog = () => {
    setEditingSub(null);
    setSubForm({
      title: "",
      dayNumber: (subEvents.length > 0 ? Math.max(...subEvents.map((s) => s.dayNumber)) + 1 : 1),
      date: activeEvent.date || new Date().toISOString().split("T")[0],
      startTime: "18:00",
      endTime: "22:00",
      venueLocation: activeEvent.location || "",
      dressCode: "Festive Pastels & Traditional",
      cateringStyle: "Multi-Cuisine Gala Buffet",
      description: "",
      keyMomentsText: "Host Welcome\nSpecial Ceremony\nDinner & DJ",
      coordinatorName: "",
      coordinatorPhone: "",
    });
    setSubDialogOpen(true);
  };

  const openEditSubDialog = (sub: SubEventItinerary) => {
    setEditingSub(sub);
    setSubForm({
      title: sub.title,
      dayNumber: sub.dayNumber,
      date: sub.date,
      startTime: sub.startTime,
      endTime: sub.endTime,
      venueLocation: sub.venueLocation,
      dressCode: sub.dressCode,
      cateringStyle: sub.cateringStyle,
      description: sub.description || "",
      keyMomentsText: (sub.keyMoments || []).join("\n"),
      coordinatorName: sub.coordinatorName || "",
      coordinatorPhone: sub.coordinatorPhone || "",
    });
    setSubDialogOpen(true);
  };

  const handleSaveSub = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subForm.title.trim()) return;

    const keyMoments = subForm.keyMomentsText
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);

    if (editingSub) {
      updateSubEvent(editingSub.id, {
        title: subForm.title,
        dayNumber: Number(subForm.dayNumber) || 1,
        date: subForm.date,
        startTime: subForm.startTime,
        endTime: subForm.endTime,
        venueLocation: subForm.venueLocation,
        dressCode: subForm.dressCode,
        cateringStyle: subForm.cateringStyle,
        description: subForm.description,
        keyMoments,
        coordinatorName: subForm.coordinatorName,
        coordinatorPhone: subForm.coordinatorPhone,
      });
    } else {
      createSubEvent({
        eventId: activeEvent.id,
        title: subForm.title,
        dayNumber: Number(subForm.dayNumber) || 1,
        date: subForm.date,
        startTime: subForm.startTime,
        endTime: subForm.endTime,
        venueLocation: subForm.venueLocation,
        dressCode: subForm.dressCode,
        cateringStyle: subForm.cateringStyle,
        description: subForm.description,
        keyMoments,
        coordinatorName: subForm.coordinatorName,
        coordinatorPhone: subForm.coordinatorPhone,
      });
    }
    setSubDialogOpen(false);
  };

  // Preset Ceremony Templates for Indian celebrations
  const applyCeremonyPreset = (name: string, dress: string, catering: string) => {
    setSubForm((prev) => ({
      ...prev,
      title: name,
      dressCode: dress,
      cateringStyle: catering,
    }));
  };

  // Group sub-events by Day
  const sortedSubEvents = [...subEvents].sort((a, b) => a.dayNumber - b.dayNumber);

  return (
    <AppShell>
      {/* Header & Milestone Status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-serif text-3xl sm:text-4xl font-bold text-foreground">
              Timeline & Multi-Day Itinerary
            </h1>
            {isDemoMode && (
              <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                Demo
              </span>
            )}
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Coordinate multi-day Indian ceremonies (Sangeet, Haldi, Reception), dress codes, and booking task checklists.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setHandoutOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-border bg-card hover:bg-muted text-foreground text-xs font-semibold shadow-xs transition-all"
            title="Open printable day-of coordinator sheet with verified vendor settlement balances"
          >
            <Printer className="w-3.5 h-3.5 text-primary" />
            <span>Coordinator Handout / PDF</span>
          </button>

          {mainTab === "ceremonies" ? (
            <button
              onClick={openAddSubDialog}
              className="px-4 py-2 rounded-xl gradient-cta text-white text-xs font-bold shadow-sm hover:opacity-95 flex items-center gap-1.5 transition-opacity"
            >
              <Plus className="w-4 h-4" />
              <span>Add Ceremony / Sub-Event</span>
            </button>
          ) : (
            <button
              onClick={openAddTaskDialog}
              className="px-4 py-2 rounded-xl gradient-cta text-white text-xs font-bold shadow-sm hover:opacity-95 flex items-center gap-1.5 transition-opacity"
            >
              <Plus className="w-4 h-4" />
              <span>Add Task</span>
            </button>
          )}
        </div>
      </div>

      {/* Primary Tab Switcher */}
      <div className="flex items-center gap-2 p-1 rounded-2xl border border-border bg-card w-full sm:w-fit">
        <button
          onClick={() => setMainTab("ceremonies")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            mainTab === "ceremonies"
              ? "bg-primary text-white shadow-xs"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Calendar className="w-3.5 h-3.5" />
          <span>Multi-Day Ceremonies ({subEvents.length})</span>
        </button>

        <button
          onClick={() => setMainTab("tasks")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            mainTab === "tasks"
              ? "bg-primary text-white shadow-xs"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <ListTodo className="w-3.5 h-3.5" />
          <span>Master Task Checklist ({completedCount}/{tasks.length})</span>
        </button>
      </div>

      {/* ── TAB 1: MULTI-DAY CEREMONIES ── */}
      {mainTab === "ceremonies" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between p-4 rounded-2xl border border-primary/20 bg-primary/5 flex-wrap gap-3">
            <div className="flex items-center gap-2.5">
              <Sparkles className="w-4 h-4 text-primary" />
              <div>
                <span className="text-xs font-bold text-foreground">Multi-Day Celebration Architecture</span>
                <p className="text-[11px] text-muted-foreground">
                  Schedule individual functions across days with day-specific dress codes, catering styles, and key moments.
                </p>
              </div>
            </div>

          </div>

          {sortedSubEvents.length === 0 ? (
            <div className="py-16 text-center text-muted-foreground rounded-3xl border border-border bg-card space-y-3">
              <Calendar className="w-10 h-10 mx-auto text-muted-foreground/40" />
              <h3 className="font-serif text-lg font-bold text-foreground">No Sub-Events Scheduled Yet</h3>
              <p className="text-xs max-w-sm mx-auto">
                Add your celebration ceremonies (e.g. Mehendi, Sangeet, Haldi, Muhurat, Reception) to organize schedules and dress codes.
              </p>
              <button
                onClick={openAddSubDialog}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl gradient-cta text-white text-xs font-bold shadow-xs hover:opacity-95"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add First Ceremony</span>
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {sortedSubEvents.map((sub) => (
                <div
                  key={sub.id}
                  className="rounded-3xl border border-border bg-card p-6 sm:p-7 shadow-card hover:shadow-elevated transition-all space-y-4"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="px-3 py-1 rounded-full gradient-cta text-white font-bold text-xs shadow-xs">
                          Day {sub.dayNumber}
                        </span>
                        <h2 className="font-serif text-xl sm:text-2xl font-bold text-foreground">
                          {sub.title}
                        </h2>
                      </div>
                      <p className="text-xs text-muted-foreground flex items-center gap-3 flex-wrap">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-primary" />
                          {sub.date || "Scheduled Date"}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-primary" />
                          {sub.startTime} – {sub.endTime}
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-primary" />
                          {sub.venueLocation || activeEvent.location}
                        </span>
                      </p>
                    </div>

                    <div className="flex items-center gap-1 self-end sm:self-auto">
                      <button
                        onClick={() => openEditSubDialog(sub)}
                        className="p-2 rounded-xl hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                        title="Edit Ceremony"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`Remove ceremony ${sub.title}?`)) {
                            deleteSubEvent(sub.id);
                          }
                        }}
                        className="p-2 rounded-xl hover:bg-red-500/10 text-muted-foreground hover:text-red-500 transition-colors"
                        title="Delete Ceremony"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Highlights Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
                    <div className="p-3.5 rounded-2xl bg-muted/40 space-y-1">
                      <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
                        👗 Dress Code & Aesthetic
                      </span>
                      <p className="font-semibold text-foreground text-sm">{sub.dressCode}</p>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-muted/40 space-y-1">
                      <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
                        🍽️ Catering Style
                      </span>
                      <p className="font-semibold text-foreground text-sm">{sub.cateringStyle || "Buffet"}</p>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-muted/40 space-y-1 sm:col-span-2 lg:col-span-1">
                      <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
                        👤 Day-of Coordinator
                      </span>
                      <p className="font-semibold text-foreground text-sm">
                        {sub.coordinatorName || "Host Family"}
                        {sub.coordinatorPhone && ` (${sub.coordinatorPhone})`}
                      </p>
                    </div>
                  </div>

                  {/* Description & Key Moments */}
                  {sub.description && (
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {sub.description}
                    </p>
                  )}

                  {sub.keyMoments && sub.keyMoments.length > 0 && (
                    <div className="space-y-1.5 pt-1">
                      <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
                        Key Ceremony Milestones:
                      </span>
                      <div className="flex items-center gap-2 flex-wrap">
                        {sub.keyMoments.map((moment, mIdx) => (
                          <span
                            key={mIdx}
                            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-card border border-border text-xs text-foreground font-medium shadow-2xs"
                          >
                            <CheckCircle2 className="w-3 h-3 text-primary shrink-0" />
                            <span>{moment}</span>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── TAB 2: MASTER TASK CHECKLIST ── */}
      {mainTab === "tasks" && (
        <div className="space-y-6">
          {/* Progress Card */}
          <div className="rounded-3xl border border-border bg-card p-6 shadow-card space-y-3">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="font-bold text-foreground">Checklist Progress</span>
                <span className="text-muted-foreground">
                  ({completedCount} of {tasks.length} tasks completed)
                </span>
              </div>
              <span className="font-extrabold text-primary">{pct}% Complete</span>
            </div>
            <div className="w-full bg-muted rounded-full h-2.5 overflow-hidden">
              <div
                className="gradient-cta h-full transition-all duration-500 rounded-full"
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-border">
            {[
              { id: "all", label: `All Tasks (${tasks.length})` },
              { id: "planning", label: "Planning Phase" },
              { id: "bookings", label: "Vendor Bookings" },
              { id: "event_day", label: "Week-of & Event Day" },
              { id: "completed", label: `Completed (${completedCount})` },
            ].map((tab) => {
              const isActive = phaseFilter === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setPhaseFilter(tab.id)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
                    isActive
                      ? "bg-primary text-white"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Tasks List */}
          <div className="space-y-2.5">
            {filteredTasks.length === 0 ? (
              <div className="p-12 text-center text-muted-foreground rounded-2xl border border-border bg-card">
                No tasks found in this view.
              </div>
            ) : (
              filteredTasks.map((t) => {
                const isCompleted = t.status === "completed";
                const isOverdue =
                  !isCompleted && daysUntil(t.dueDate) < 0;

                return (
                  <div
                    key={t.id}
                    className={`group p-4 rounded-2xl border transition-all flex items-start justify-between gap-4 ${
                      isCompleted
                        ? "bg-muted/30 border-border opacity-70"
                        : "bg-card border-border hover:shadow-card"
                    }`}
                  >
                    <div className="flex items-start gap-3 flex-1">
                      <button
                        onClick={() => handleToggleComplete(t)}
                        className={`w-6 h-6 rounded-lg border flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                          isCompleted
                            ? "bg-primary border-primary text-white"
                            : "border-muted-foreground/40 hover:border-primary"
                        }`}
                      >
                        {isCompleted && <Check className="w-4 h-4 stroke-[3]" />}
                      </button>

                      <div className="space-y-1">
                        <p
                          className={`text-sm font-semibold text-foreground ${
                            isCompleted ? "line-through text-muted-foreground" : ""
                          }`}
                        >
                          {t.title}
                        </p>
                        {t.description && (
                          <p className="text-xs text-muted-foreground">{t.description}</p>
                        )}

                        <div className="flex items-center gap-2 pt-1 flex-wrap text-[11px]">
                          <span className="capitalize px-2 py-0.5 rounded-md bg-muted text-muted-foreground font-medium">
                            {t.category}
                          </span>

                          <span
                            className={`px-2 py-0.5 rounded-md font-semibold ${
                              t.priority === "urgent"
                                ? "bg-red-500/10 text-red-500"
                                : t.priority === "high"
                                ? "bg-amber-500/10 text-amber-500"
                                : "bg-muted text-muted-foreground"
                            }`}
                          >
                            {t.priority}
                          </span>

                          <span
                            className={`flex items-center gap-1 ${
                              isOverdue ? "text-red-500 font-bold" : "text-muted-foreground"
                            }`}
                          >
                            <Calendar className="w-3 h-3" />
                            {formatDateShort(t.dueDate)}
                            {isOverdue && " (Overdue)"}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => openEditTaskDialog(t)}
                        className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground"
                        title="Edit Task"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => deleteTask(t.id)}
                        className="p-1.5 rounded-lg hover:bg-red-500/10 text-muted-foreground hover:text-red-500"
                        title="Delete Task"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Coordinator Handout Printable Sheet Modal */}
      <CoordinatorHandoutModal
        isOpen={handoutOpen}
        onClose={() => setHandoutOpen(false)}
      />

      {/* Add / Edit Ceremony Dialog */}
      {subDialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-card border border-border w-full max-w-lg rounded-2xl shadow-elevated p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <h3 className="font-serif text-lg font-bold text-foreground">
                {editingSub ? "Edit Ceremony Details" : "Add Celebration Ceremony"}
              </h3>
              <button
                onClick={() => setSubDialogOpen(false)}
                className="p-1 rounded-lg hover:bg-muted text-muted-foreground"
              >
                ✕
              </button>
            </div>

            {/* Indian Ceremony Presets */}
            <div className="space-y-1.5">
              <span className="text-[10px] uppercase font-bold text-muted-foreground">Quick Presets:</span>
              <div className="flex items-center gap-1.5 flex-wrap text-xs">
                {[
                  { name: "Mehendi Ceremony", dress: "Yellow / Green Breezy Florals", catering: "Live Chaat & Mocktail Bar" },
                  { name: "Sangeet Gala & DJ Night", dress: "Indo-Western Glitz & Metallics", catering: "Royal Mughlai & Multi-Cuisine" },
                  { name: "Haldi & Phoolon ki Holi", dress: "Mustard & Marigold Yellow", catering: "Traditional Satvik Banana Leaf" },
                  { name: "Wedding Muhurat & Pheras", dress: "Royal Red / Pastel Lehengas", catering: "Grand Satvik Feast" },
                  { name: "Cocktail Evening", dress: "Black Tie & Velvet Glamour", catering: "Canapés & Global Tapas" },
                ].map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => applyCeremonyPreset(preset.name, preset.dress, preset.catering)}
                    className="px-2.5 py-1 rounded-lg border border-border bg-muted/40 hover:bg-primary/10 hover:text-primary text-[11px] font-medium transition-colors"
                  >
                    + {preset.name}
                  </button>
                ))}
              </div>
            </div>

            <form onSubmit={handleSaveSub} className="space-y-3 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-muted-foreground uppercase mb-1">
                  Ceremony Title *
                </label>
                <input
                  type="text"
                  required
                  value={subForm.title}
                  onChange={(e) => setSubForm({ ...subForm, title: e.target.value })}
                  placeholder="e.g. Sangeet & Cocktail Soirée"
                  className="w-full px-3 py-2 rounded-xl border border-border bg-background text-foreground text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-muted-foreground uppercase mb-1">
                    Day Number (1, 2, 3...)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={subForm.dayNumber}
                    onChange={(e) => setSubForm({ ...subForm, dayNumber: parseInt(e.target.value) || 1 })}
                    className="w-full px-3 py-2 rounded-xl border border-border bg-background text-foreground text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-muted-foreground uppercase mb-1">
                    Date
                  </label>
                  <input
                    type="date"
                    value={subForm.date}
                    onChange={(e) => setSubForm({ ...subForm, date: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-border bg-background text-foreground text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-muted-foreground uppercase mb-1">
                    Start Time
                  </label>
                  <input
                    type="time"
                    value={subForm.startTime}
                    onChange={(e) => setSubForm({ ...subForm, startTime: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-border bg-background text-foreground text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-muted-foreground uppercase mb-1">
                    End Time
                  </label>
                  <input
                    type="time"
                    value={subForm.endTime}
                    onChange={(e) => setSubForm({ ...subForm, endTime: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-border bg-background text-foreground text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-muted-foreground uppercase mb-1">
                  Venue & Hall Location
                </label>
                <input
                  type="text"
                  value={subForm.venueLocation}
                  onChange={(e) => setSubForm({ ...subForm, venueLocation: e.target.value })}
                  placeholder="e.g. Lawn B, The Oberoi Palace"
                  className="w-full px-3 py-2 rounded-xl border border-border bg-background text-foreground text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-muted-foreground uppercase mb-1">
                    Dress Code Aesthetic
                  </label>
                  <input
                    type="text"
                    value={subForm.dressCode}
                    onChange={(e) => setSubForm({ ...subForm, dressCode: e.target.value })}
                    placeholder="e.g. Yellow & Floral Pastels"
                    className="w-full px-3 py-2 rounded-xl border border-border bg-background text-foreground text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-muted-foreground uppercase mb-1">
                    Catering Style
                  </label>
                  <input
                    type="text"
                    value={subForm.cateringStyle}
                    onChange={(e) => setSubForm({ ...subForm, cateringStyle: e.target.value })}
                    placeholder="e.g. Live Chaat & Gala Buffet"
                    className="w-full px-3 py-2 rounded-xl border border-border bg-background text-foreground text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-muted-foreground uppercase mb-1">
                  Key Milestones (One per line)
                </label>
                <textarea
                  rows={3}
                  value={subForm.keyMomentsText}
                  onChange={(e) => setSubForm({ ...subForm, keyMomentsText: e.target.value })}
                  placeholder="Bride & Groom Grand Entry&#10;Cake Cutting&#10;Open DJ & Dinner"
                  className="w-full px-3 py-2 rounded-xl border border-border bg-background text-foreground text-xs focus:outline-none focus:ring-1 focus:ring-primary resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-muted-foreground uppercase mb-1">
                    Coordinator Name
                  </label>
                  <input
                    type="text"
                    value={subForm.coordinatorName}
                    onChange={(e) => setSubForm({ ...subForm, coordinatorName: e.target.value })}
                    placeholder="e.g. Rohan Varma"
                    className="w-full px-3 py-2 rounded-xl border border-border bg-background text-foreground text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-muted-foreground uppercase mb-1">
                    Coordinator Phone
                  </label>
                  <input
                    type="text"
                    value={subForm.coordinatorPhone}
                    onChange={(e) => setSubForm({ ...subForm, coordinatorPhone: e.target.value })}
                    placeholder="+91 98450 12345"
                    className="w-full px-3 py-2 rounded-xl border border-border bg-background text-foreground text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setSubDialogOpen(false)}
                  className="px-4 py-2 rounded-xl border border-border hover:bg-muted text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl gradient-cta text-white text-xs font-bold"
                >
                  {editingSub ? "Update Ceremony" : "Save Ceremony"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add / Edit Task Dialog */}
      {taskDialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-card border border-border w-full max-w-md rounded-2xl shadow-elevated p-6 space-y-4">
            <h3 className="font-serif text-lg font-bold text-foreground">
              {editingTask ? "Edit Checklist Task" : "Add Checklist Task"}
            </h3>

            <form onSubmit={handleSaveTask} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold mb-1">Task Title *</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Finalize sangeet choreography music"
                  className="w-full px-3 py-2 rounded-xl border border-input bg-background"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Description</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Add notes or vendor contacts..."
                  className="w-full px-3 py-2 rounded-xl border border-input bg-background resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Due Date</label>
                  <input
                    type="date"
                    required
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-input bg-background"
                  />
                </div>

                <div>
                  <label className="block font-semibold mb-1">Priority</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as TaskPriority)}
                    className="w-full px-3 py-2 rounded-xl border border-input bg-background"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as TaskCategory)}
                    className="w-full px-3 py-2 rounded-xl border border-input bg-background"
                  >
                    <option value="planning">Planning</option>
                    <option value="venue">Venue</option>
                    <option value="catering">Catering</option>
                    <option value="photography">Photography</option>
                    <option value="decoration">Decoration</option>
                    <option value="cake">Cake</option>
                    <option value="invitations">Invitations</option>
                    <option value="entertainment">Entertainment</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold mb-1">Phase</label>
                  <select
                    value={phase}
                    onChange={(e) => setPhase(e.target.value as NonNullable<Task["phase"]>)}
                    className="w-full px-3 py-2 rounded-xl border border-input bg-background"
                  >
                    <option value="planning">Planning Phase</option>
                    <option value="bookings">Bookings Phase</option>
                    <option value="one_week">Week-Of</option>
                    <option value="event_day">Event Day</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setTaskDialogOpen(false)}
                  className="px-4 py-2 rounded-xl border border-border hover:bg-muted text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl gradient-cta text-white text-xs font-bold"
                >
                  Save Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppShell>
  );
}

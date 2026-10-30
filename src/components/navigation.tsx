"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { useApp } from "@/contexts/app-context";
import { ThemeToggle } from "@/components/theme-toggle";
import { CurrencySelector } from "@/components/currency-selector";
import {
  Sparkles,
  LayoutDashboard,
  WalletCards,
  Clock,
  Store,
  Lightbulb,
  Settings,
  Plus,
  ChevronDown,
  Menu,
  X,
  Trash2,
  LogOut,
  Users,
} from "lucide-react";

export function Navigation() {
  const pathname = usePathname();
  const router = useRouter();
  const shouldReduceMotion = useReducedMotion();
  const {
    events,
    activeEvent,
    activeEventId,
    setActiveEventId,
    deleteEvent,
    budgetSummary,
    isDemoMode,
    loadDemoEvent,
    clearDemoMode,
  } = useApp();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [eventDropdownOpen, setEventDropdownOpen] = useState(false);
  const [deleteConfirmEventId, setDeleteConfirmEventId] = useState<string | null>(null);
  const [clearDemoConfirmOpen, setClearDemoConfirmOpen] = useState(false);

  const navItems = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/planner", label: "AI Planner", icon: Sparkles },
    {
      href: "/budget",
      label: "Budget",
      icon: WalletCards,
      badge: budgetSummary.isOverBudget ? "Alert" : undefined,
    },
    { href: "/timeline", label: "Timeline & Tasks", icon: Clock },
    { href: "/vendors", label: "Vendors", icon: Store },
    { href: "/guests", label: "Guests & Seating", icon: Users },
    { href: "/inspiration", label: "Inspiration", icon: Lightbulb },
    { href: "/settings", label: "Settings", icon: Settings },
  ];

  const handleConfirmDelete = (id: string) => {
    deleteEvent(id);
    setDeleteConfirmEventId(null);
  };

  const handleConfirmClearDemo = () => {
    clearDemoMode();
    setClearDemoConfirmOpen(false);
    router.push("/dashboard");
  };

  return (
    <>
      {/* Top Header */}
      <header className="sticky top-0 z-40 w-full border-b border-border bg-card/90 backdrop-blur-md transition-colors">
        <div className="flex h-16 items-center justify-between px-4 sm:px-6">
          {/* Left: Mobile menu toggle & Logo */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg text-muted-foreground hover:bg-muted"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            <Link href="/" className="flex items-center gap-2 group">
              <div className="w-9 h-9 rounded-xl gradient-cta flex items-center justify-center text-white shadow-sm group-hover:scale-105 transition-transform">
                <Sparkles className="w-5 h-5" />
              </div>
              <div className="flex flex-col">
                <span className="font-display font-bold text-lg leading-tight tracking-tight text-foreground flex items-center gap-1.5">
                  UtsavAI
                  {isDemoMode && (
                    <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                      Demo Mode
                    </span>
                  )}
                </span>
                <span className="text-[10px] tracking-wider uppercase font-medium text-muted-foreground hidden sm:inline">
                  The Celebration Copilot
                </span>
              </div>
            </Link>
          </div>

          {/* Center: Multi-Event Switcher (Desktop) */}
          <div className="hidden md:flex items-center gap-2">
            <div className="relative">
              <button
                onClick={() => setEventDropdownOpen(!eventDropdownOpen)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-border bg-background hover:bg-muted text-sm font-medium transition-colors shadow-xs"
              >
                <span className="w-2 h-2 rounded-full bg-primary" />
                <span className="max-w-[200px] truncate text-foreground font-semibold">
                  {activeEvent ? activeEvent.title : "No Event Selected"}
                </span>
                <ChevronDown className="w-4 h-4 text-muted-foreground" />
              </button>

              <AnimatePresence>
                {eventDropdownOpen && (
                  <motion.div
                    initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: -6, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: -6, scale: 0.98 }}
                    transition={{ duration: 0.15 }}
                    className="absolute left-0 mt-2 w-72 rounded-2xl border border-border bg-popover text-popover-foreground shadow-elevated z-50 py-2"
                  >
                  <div className="px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground border-b border-border/60 flex items-center justify-between">
                    <span>Your Celebrations</span>
                    <span className="text-[10px]">{events.length}</span>
                  </div>

                  <div className="max-h-64 overflow-y-auto py-1">
                    {events.length === 0 ? (
                      <div className="px-4 py-4 text-center text-xs text-muted-foreground">
                        No celebrations created yet.
                      </div>
                    ) : (
                      events.map((ev) => (
                        <div
                          key={ev.id}
                          className={`flex items-center justify-between px-3 py-2 text-xs transition-colors ${
                            ev.id === activeEventId
                              ? "bg-primary/10 text-primary font-bold"
                              : "hover:bg-muted/60 text-foreground"
                          }`}
                        >
                          <button
                            onClick={() => {
                              setActiveEventId(ev.id);
                              setEventDropdownOpen(false);
                            }}
                            className="flex-1 text-left truncate mr-2"
                          >
                            <div className="truncate">{ev.title}</div>
                            <div className="text-[10px] text-muted-foreground font-normal capitalize">
                              {ev.occasion} • {ev.date || "Upcoming"}
                            </div>
                          </button>

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeleteConfirmEventId(ev.id);
                            }}
                            className="p-1 rounded text-muted-foreground hover:text-red-500 hover:bg-red-500/10 transition-colors"
                            title="Delete event"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))
                    )}
                  </div>

                  <div className="p-2 border-t border-border/60 space-y-1">
                    <Link
                      href="/wizard"
                      onClick={() => setEventDropdownOpen(false)}
                      className="w-full py-2 px-3 rounded-xl gradient-cta text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs hover:opacity-95 transition-opacity"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>+ Create New Event</span>
                    </Link>

                    {!isDemoMode && (
                      <button
                        onClick={() => {
                          loadDemoEvent();
                          setEventDropdownOpen(false);
                        }}
                        className="w-full py-1.5 px-3 rounded-xl border border-border bg-card hover:bg-muted text-[11px] font-semibold text-muted-foreground flex items-center justify-center gap-1.5 transition-colors"
                      >
                        <span>Load 50-Guest Demo</span>
                      </button>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            </div>

            {/* Clear Demo Mode Button in Header when in Demo Mode */}
            {isDemoMode && (
              <button
                onClick={() => setClearDemoConfirmOpen(true)}
                className="px-3 py-1.5 rounded-xl border border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-400 text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs"
                title="Remove demo event and return to clean state"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Exit Demo</span>
              </button>
            )}
          </div>

          {/* Right Controls */}
          <div className="flex items-center gap-2.5">
            <CurrencySelector />
            <ThemeToggle />

            <Link
              href="/wizard"
              className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl gradient-cta text-white text-xs font-bold shadow-sm hover:opacity-95 transition-opacity"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Event</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Desktop Sidebar Navigation */}
      <aside className="hidden md:flex flex-col w-60 border-r border-border bg-card/50 backdrop-blur-md fixed top-16 bottom-0 z-30 transition-colors">
        <div className="flex-1 py-4 px-3 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`relative flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-colors group ${
                  isActive
                    ? "text-white"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                }`}
              >
                {isActive && (
                  <motion.span
                    layoutId="activeNavIndicator"
                    className="absolute inset-0 rounded-xl gradient-cta shadow-xs -z-10"
                    transition={
                      shouldReduceMotion
                        ? { duration: 0 }
                        : { type: "spring", stiffness: 380, damping: 30 }
                    }
                  />
                )}
                <div className="flex items-center gap-3 relative z-10">
                  <Icon
                    className={`w-4 h-4 transition-transform duration-200 ${
                      isActive ? "" : "group-hover:scale-110"
                    }`}
                  />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className="relative z-10 px-2 py-0.5 rounded-full bg-red-500 text-white text-[10px] font-bold">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </div>

        {/* Sidebar Footer Info */}
        <div className="p-3 border-t border-border/60">
          {activeEvent ? (
            <div className="p-3 rounded-2xl bg-muted/40 border border-border/60 text-xs space-y-1">
              <p className="font-bold text-foreground truncate">{activeEvent.title}</p>
              <p className="text-[11px] text-muted-foreground">
                {activeEvent.guestCount} Guests • {activeEvent.currency.symbol}
                {activeEvent.budget.toLocaleString()}
              </p>
            </div>
          ) : (
            <div className="p-3 rounded-2xl border border-dashed border-border text-center text-[11px] text-muted-foreground">
              No event active
            </div>
          )}
        </div>
      </aside>

      {/* Mobile Drawer Navigation */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            role="dialog"
            aria-modal="true"
            aria-label="Navigation Menu"
            className="md:hidden fixed inset-0 z-50 bg-black/60 backdrop-blur-xs"
          >
            <motion.div
              initial={shouldReduceMotion ? { opacity: 0 } : { x: "-100%" }}
              animate={shouldReduceMotion ? { opacity: 1 } : { x: 0 }}
              exit={shouldReduceMotion ? { opacity: 0 } : { x: "-100%" }}
              transition={{ type: "spring", stiffness: 360, damping: 32 }}
              className="w-72 h-full bg-card border-r border-border p-4 flex flex-col justify-between"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-border">
                  <span className="font-display font-bold text-foreground">UtsavAI Menu</span>
                  <button
                    onClick={() => setMobileMenuOpen(false)}
                    aria-label="Close navigation menu"
                    className="p-1 rounded-lg text-muted-foreground hover:bg-muted"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-1">
                  {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = pathname === item.href;
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setMobileMenuOpen(false)}
                        className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold ${
                          isActive
                            ? "gradient-cta text-white"
                            : "text-muted-foreground hover:bg-muted"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <Icon className="w-4 h-4" />
                          <span>{item.label}</span>
                        </div>
                        {item.badge && (
                          <span className="px-2 py-0.5 rounded-full bg-red-500 text-white text-[10px]">
                            {item.badge}
                          </span>
                        )}
                      </Link>
                    );
                  })}
                </div>
              </div>

              <div className="pt-4 border-t border-border space-y-2">
                <Link
                  href="/wizard"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full py-2.5 rounded-xl gradient-cta text-white text-xs font-bold flex items-center justify-center gap-2 shadow-xs"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ Create New Event</span>
                </Link>
                {isDemoMode && (
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      setClearDemoConfirmOpen(true);
                    }}
                    className="w-full py-2 rounded-xl border border-amber-500/30 text-amber-600 text-xs font-bold"
                  >
                    Clear Demo Data
                  </button>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Confirmation Dialog: Delete Event */}
      <AnimatePresence>
        {deleteConfirmEventId && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-event-dialog-title"
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4"
          >
            <motion.div
              initial={shouldReduceMotion ? { opacity: 0 } : { scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={shouldReduceMotion ? { opacity: 0 } : { scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.18 }}
              className="w-full max-w-sm rounded-3xl border border-border bg-card p-6 shadow-elevated space-y-4 text-center"
            >
              <div className="w-12 h-12 rounded-2xl bg-red-500/10 text-red-500 flex items-center justify-center mx-auto">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 id="delete-event-dialog-title" className="font-serif text-xl font-bold text-foreground">Delete Celebration?</h3>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  This will permanently delete this event along with its associated budget, expenses, tasks, vendors, and AI history.
                </p>
              </div>
              <div className="flex items-center justify-center gap-2 pt-2">
                <button
                  onClick={() => setDeleteConfirmEventId(null)}
                  className="px-4 py-2 rounded-xl border border-border bg-card hover:bg-muted text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleConfirmDelete(deleteConfirmEventId)}
                  className="px-5 py-2 rounded-xl bg-red-500 hover:bg-red-600 text-white text-xs font-bold shadow-xs transition-colors"
                >
                  Yes, Delete Event
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Confirmation Dialog: Clear Demo Data */}
      <AnimatePresence>
        {clearDemoConfirmOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="clear-demo-dialog-title"
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4"
          >
            <motion.div
              initial={shouldReduceMotion ? { opacity: 0 } : { scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={shouldReduceMotion ? { opacity: 0 } : { scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.18 }}
              className="w-full max-w-sm rounded-3xl border border-border bg-card p-6 shadow-elevated space-y-4 text-center"
            >
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center mx-auto">
                <LogOut className="w-6 h-6" />
              </div>
              <div>
                <h3 id="clear-demo-dialog-title" className="font-serif text-xl font-bold text-foreground">Clear Demo Data?</h3>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  This will remove the sample 50-guest birthday event and all related demo records. Any events you personally created will remain completely safe.
                </p>
              </div>
              <div className="flex items-center justify-center gap-2 pt-2">
                <button
                  onClick={() => setClearDemoConfirmOpen(false)}
                  className="px-4 py-2 rounded-xl border border-border bg-card hover:bg-muted text-xs font-semibold"
                >
                  Keep Demo
                </button>
                <button
                  onClick={handleConfirmClearDemo}
                  className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-xs transition-colors"
                >
                  Clear Demo
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

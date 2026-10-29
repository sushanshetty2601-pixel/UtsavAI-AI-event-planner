"use client";

import React, { useState } from "react";
import { useApp } from "@/contexts/app-context";
import { AppShell } from "@/components/app-shell";
import { CurrencySelector } from "@/components/currency-selector";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  Download,
  RefreshCw,
  ShieldCheck,
  Check,
  Coins,
} from "lucide-react";

export default function SettingsPage() {
  const {
    activeEvent,
    loadDemoEvent,
    clearDemoMode,
    deleteEvent,
    exportData,
    importData,
  } = useApp();

  const [importJson, setImportJson] = useState("");
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  const handleDownload = () => {
    const jsonStr = exportData();
    const blob = new Blob([jsonStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `utsavai-backup-${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setDownloadSuccess(true);
    setTimeout(() => setDownloadSuccess(false), 3000);
  };

  const handleImport = () => {
    if (!importJson.trim()) return;
    const ok = importData(importJson);
    if (ok) {
      setImportStatus("Data imported successfully!");
      setImportJson("");
    } else {
      setImportStatus("Failed to import. Please check JSON format.");
    }
    setTimeout(() => setImportStatus(null), 3500);
  };

  return (
    <AppShell>
      <div className="max-w-4xl space-y-6">
        <div>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-foreground">
            Settings & Data Preferences
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Configure currency scales, visual themes, backups and demo parameters.
          </p>
        </div>

        {/* Currency & Locale Settings */}
        <div className="rounded-3xl border border-border bg-card p-6 shadow-card space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-border">
            <Coins className="w-5 h-5 text-primary" />
            <h3 className="font-serif text-xl font-bold">Currency & Localization</h3>
          </div>

          <p className="text-xs text-muted-foreground leading-relaxed">
            <strong>Indian Rupee (₹ INR)</strong> is configured as the permanent default currency for all new celebration plans in UtsavAI. When you switch currencies, all budget metrics, vendor quotes, and export breakdowns adjust in code.
          </p>

          <div className="flex items-center justify-between p-4 rounded-2xl bg-muted/40 text-xs">
            <div>
              <p className="font-bold text-foreground">Active Celebration Currency</p>
              <p className="text-muted-foreground">Current event: {activeEvent?.title || "None"}</p>
            </div>
            <CurrencySelector />
          </div>
        </div>

        {/* Theme Settings */}
        <div className="rounded-3xl border border-border bg-card p-6 shadow-card space-y-4">
          <h3 className="font-serif text-xl font-bold">Visual Theme & Atmosphere</h3>
          <p className="text-xs text-muted-foreground">
            Choose between <strong>Ivory Celebration (Light)</strong> for a warm editorial daytime feel and <strong>Midnight Gala (Dark)</strong> for an evening aesthetic with luminous coral and lavender accents.
          </p>
          <div className="flex items-center justify-between p-4 rounded-2xl bg-muted/40 text-xs">
            <div>
              <p className="font-bold text-foreground">Toggle Theme</p>
              <p className="text-muted-foreground">Persists across reloads</p>
            </div>
            <ThemeToggle />
          </div>
        </div>

        {/* Demo State Control & Event Deletion */}
        <div className="rounded-3xl border border-border bg-card p-6 shadow-card space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-serif text-xl font-bold">Demo Event & Data Controls</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Load the sample 50-person birthday event or clear all demo records to return to a clean workspace.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={loadDemoEvent}
                className="px-4 py-2 rounded-xl border border-border bg-card hover:bg-muted text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Load Demo</span>
              </button>
              <button
                onClick={clearDemoMode}
                className="px-4 py-2 rounded-xl border border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 text-xs font-bold transition-colors shadow-xs"
              >
                <span>Clear Demo Data</span>
              </button>
            </div>
          </div>

          {activeEvent && !activeEvent.isDemoEvent && (
            <div className="pt-3 border-t border-border flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-foreground">Delete Current Celebration: {activeEvent.title}</p>
                <p className="text-[11px] text-muted-foreground">Permanently removes all expenses, tasks, and plans for this event.</p>
              </div>
              <button
                onClick={() => {
                  if (confirm(`Are you sure you want to delete "${activeEvent.title}"?`)) {
                    deleteEvent(activeEvent.id);
                  }
                }}
                className="px-3.5 py-1.5 rounded-xl border border-red-500/30 bg-red-500/10 hover:bg-red-500/20 text-red-600 text-xs font-bold transition-colors"
              >
                Delete Event
              </button>
            </div>
          )}
        </div>

        {/* Data Backup & Portability */}
        <div className="rounded-3xl border border-border bg-card p-6 shadow-card space-y-5">
          <div>
            <h3 className="font-serif text-xl font-bold">Data Portability (Export & Import)</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Export your plans, expenses, and vendor quotes as portable JSON or restore from a previous backup.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <button
              onClick={handleDownload}
              className="px-5 py-2.5 rounded-xl gradient-cta text-white text-xs font-bold shadow-sm hover:opacity-95 flex items-center justify-center gap-2"
            >
              {downloadSuccess ? <Check className="w-4 h-4" /> : <Download className="w-4 h-4" />}
              <span>{downloadSuccess ? "Downloaded Backup!" : "Export All Data (JSON)"}</span>
            </button>
          </div>

          <div className="space-y-2 pt-2 border-t border-border">
            <label className="block text-xs font-semibold text-foreground">
              Import / Restore from JSON String:
            </label>
            <textarea
              rows={3}
              value={importJson}
              onChange={(e) => setImportJson(e.target.value)}
              placeholder="Paste exported JSON data here..."
              className="w-full p-3 rounded-xl border border-input bg-background text-xs font-mono resize-none focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
            {importStatus && (
              <p className="text-xs font-semibold text-primary">{importStatus}</p>
            )}
            <button
              onClick={handleImport}
              disabled={!importJson.trim()}
              className="px-4 py-2 rounded-xl border border-border bg-card hover:bg-muted text-xs font-semibold disabled:opacity-40 transition-colors"
            >
              Restore Backup
            </button>
          </div>
        </div>

        {/* AI & Security Transparency Box */}
        <div className="p-5 rounded-3xl border border-border bg-primary/5 space-y-2 text-xs">
          <div className="flex items-center gap-2 font-bold text-foreground">
            <ShieldCheck className="w-4 h-4 text-primary" />
            <span>AI Architecture & Privacy</span>
          </div>
          <p className="text-muted-foreground leading-relaxed">
            Calls to Google Gemini execute strictly on server-side Next.js route handlers. Your API keys are never bundled into client scripts or exposed to browser storage. When an API key is not present in the environment, UtsavAI operates seamlessly in demo mode with mathematically balanced sample plans.
          </p>
        </div>
      </div>
    </AppShell>
  );
}

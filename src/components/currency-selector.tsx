"use client";

import React, { useState, useRef, useEffect } from "react";
import { useApp } from "@/contexts/app-context";
import { CURRENCIES, Currency } from "@/types";
import { ChevronDown, Check } from "lucide-react";

interface CurrencySelectorProps {
  compact?: boolean;
}

export function CurrencySelector({ compact = false }: CurrencySelectorProps) {
  const { activeEvent, changeCurrency } = useApp();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const currentCurrency = activeEvent?.currency || CURRENCIES[0];

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (c: Currency) => {
    changeCurrency(c);
    setOpen(false);
  };

  return (
    <div className="relative inline-block text-left" ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={`inline-flex items-center gap-1.5 rounded-lg border border-border bg-card text-foreground font-medium transition-all hover:bg-muted focus:outline-none focus:ring-2 focus:ring-primary/40 ${
          compact ? "px-2 py-1 text-xs" : "px-3 py-1.5 text-sm"
        }`}
        aria-label="Select display currency"
        title="Change currency"
      >
        <span className="font-semibold text-primary">{currentCurrency.symbol}</span>
        <span>{currentCurrency.code}</span>
        <ChevronDown className="w-3.5 h-3.5 opacity-60 ml-0.5" />
      </button>

      {open && (
        <div className="absolute right-0 mt-1.5 w-44 rounded-xl border border-border bg-popover text-popover-foreground shadow-elevated z-50 py-1.5 animate-in fade-in-50 zoom-in-95 duration-150">
          <div className="px-3 py-1 text-[11px] font-semibold tracking-wider uppercase text-muted-foreground border-b border-border/60">
            Display Currency
          </div>
          {CURRENCIES.map((c) => {
            const isSelected = c.code === currentCurrency.code;
            return (
              <button
                key={c.code}
                onClick={() => handleSelect(c)}
                className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-muted transition-colors ${
                  isSelected ? "bg-primary/10 text-primary font-semibold" : "text-foreground"
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="w-5 text-center font-bold text-sm text-primary">{c.symbol}</span>
                  <span>{c.name}</span>
                </div>
                {isSelected && <Check className="w-3.5 h-3.5 text-primary" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

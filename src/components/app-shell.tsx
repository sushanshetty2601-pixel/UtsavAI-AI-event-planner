"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { motion, useReducedMotion } from "framer-motion";
import { Navigation } from "@/components/navigation";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const shouldReduceMotion = useReducedMotion();

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Navigation />
      <main id="main-content" className="flex-1 md:pl-60 transition-all duration-200">
        <motion.div
          key={pathname}
          initial={
            shouldReduceMotion
              ? { opacity: 0 }
              : { opacity: 0, y: 8 }
          }
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: shouldReduceMotion ? 0.08 : 0.22,
            ease: [0.22, 1, 0.36, 1],
          }}
          className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6 overflow-x-hidden"
        >
          {children}
        </motion.div>
      </main>
    </div>
  );
}

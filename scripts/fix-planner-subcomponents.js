const fs = require('fs');

// 1. Create formatted-message-content.tsx
const formattedContent = `"use client";

import React from "react";

export function FormattedMessageContent({ content, isUser }: { content: string; isUser: boolean }) {
  if (isUser) {
    return <div className="whitespace-pre-wrap font-sans">{content}</div>;
  }

  const lines = content.split("\\n");
  return (
    <div className="space-y-1.5 font-sans leading-relaxed">
      {lines.map((line, idx) => {
        const trimmed = line.trim();
        if (!trimmed) return <div key={idx} className="h-1" />;

        if (trimmed.startsWith("### ")) {
          return (
            <h4 key={idx} className="font-serif text-sm font-bold text-foreground mt-2 mb-1">
              {trimmed.replace(/^###\\s+/, "")}
            </h4>
          );
        }

        const isBullet = trimmed.startsWith("•") || trimmed.startsWith("- ");
        const cleanLine = isBullet ? trimmed.replace(/^(?:•|-)\\s*/, "") : line;
        const parts = cleanLine.split(/(\\*\\*.*?\\*\\*|\\*.*?\\*)/g);

        return (
          <div key={idx} className={isBullet ? "flex items-start gap-1.5 pl-1" : ""}>
            {isBullet && <span className="text-primary font-bold mt-0.5">•</span>}
            <div>
              {parts.map((part, pIdx) => {
                if (part.startsWith("**") && part.endsWith("**")) {
                  return (
                    <strong key={pIdx} className="font-bold text-foreground">
                      {part.slice(2, -2)}
                    </strong>
                  );
                }
                if (part.startsWith("*") && part.endsWith("*")) {
                  return (
                    <em key={pIdx} className="italic text-muted-foreground">
                      {part.slice(1, -1)}
                    </em>
                  );
                }
                return <span key={pIdx}>{part}</span>;
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
`;
fs.writeFileSync('src/components/planner/formatted-message-content.tsx', formattedContent, 'utf8');
console.log('Created formatted-message-content.tsx');

// 2. Clean allocation-builder-card.tsx
let alloc = fs.readFileSync('src/components/planner/allocation-builder-card.tsx', 'utf8');
// remove FormattedMessageContent from alloc
const fmtIdx = alloc.indexOf('function FormattedMessageContent');
if (fmtIdx !== -1) {
  alloc = alloc.slice(0, fmtIdx).trim() + '\n';
}
// Add proper imports
alloc = alloc.replace(
  'import { Sparkles, Plus, Trash2, Check } from "lucide-react";',
  'import { Sparkles, Plus, Trash2, Check, SlidersHorizontal, CheckCircle2, WalletCards } from "lucide-react";\nimport Link from "next/link";\nimport { CATEGORY_LABELS } from "@/lib/utils";'
);
fs.writeFileSync('src/components/planner/allocation-builder-card.tsx', alloc, 'utf8');
console.log('Updated allocation-builder-card.tsx');

// 3. Update payment-action-card.tsx
let pay = fs.readFileSync('src/components/planner/payment-action-card.tsx', 'utf8');
pay = pay.replace(
  'import { Coins, Check } from "lucide-react";',
  'import { Coins, Check, CheckCircle2 } from "lucide-react";\nimport Link from "next/link";'
);
fs.writeFileSync('src/components/planner/payment-action-card.tsx', pay, 'utf8');
console.log('Updated payment-action-card.tsx');

// 4. Update src/app/planner/page.tsx
let planner = fs.readFileSync('src/app/planner/page.tsx', 'utf8');
if (!planner.includes('FormattedMessageContent')) {
  planner = planner.replace(
    'import { PaymentActionCard } from "@/components/planner/payment-action-card";',
    'import { PaymentActionCard } from "@/components/planner/payment-action-card";\nimport { FormattedMessageContent } from "@/components/planner/formatted-message-content";'
  );
  fs.writeFileSync('src/app/planner/page.tsx', planner, 'utf8');
  console.log('Updated planner/page.tsx with FormattedMessageContent import');
}

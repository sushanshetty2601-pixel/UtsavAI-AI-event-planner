"use client";

import React from "react";

export function FormattedMessageContent({ content, isUser }: { content: string; isUser: boolean }) {
  if (isUser) {
    return <div className="whitespace-pre-wrap font-sans">{content}</div>;
  }

  const lines = content.split("\n");
  return (
    <div className="space-y-1.5 font-sans leading-relaxed">
      {lines.map((line, idx) => {
        const trimmed = line.trim();
        if (!trimmed) return <div key={idx} className="h-1" />;

        if (trimmed.startsWith("### ")) {
          return (
            <h4 key={idx} className="font-serif text-sm font-bold text-foreground mt-2 mb-1">
              {trimmed.replace(/^###\s+/, "")}
            </h4>
          );
        }

        const isBullet = trimmed.startsWith("•") || trimmed.startsWith("- ");
        const cleanLine = isBullet ? trimmed.replace(/^(?:•|-)\s*/, "") : line;
        const parts = cleanLine.split(/(\*\*.*?\*\*|\*.*?\*)/g);

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

const fs = require('fs');

const planner = fs.readFileSync('src/app/planner/page.tsx', 'utf8');

const allocStart = planner.indexOf('const CATEGORY_OPTIONS:');
const paymentStart = planner.indexOf('function PaymentActionCard(');
const plannerPageStart = planner.indexOf('export default function AIPlannerPage(');

if (allocStart === -1 || paymentStart === -1 || plannerPageStart === -1) {
  console.error('Failed to find component boundaries', { allocStart, paymentStart, plannerPageStart });
  process.exit(1);
}

const allocCode = planner.slice(allocStart, paymentStart).trim();
const paymentCode = planner.slice(paymentStart, plannerPageStart).trim();

// 1. Create AllocationBuilderCard component
const allocFileContent = `"use client";

import React, { useState, useMemo } from "react";
import { ExpenseCategory, BudgetCategoryAllocation } from "@/types";
import { Sparkles, Plus, Trash2, Check } from "lucide-react";

${allocCode.replace('function AllocationBuilderCard', 'export function AllocationBuilderCard')}
`;

fs.mkdirSync('src/components/planner', { recursive: true });
fs.writeFileSync('src/components/planner/allocation-builder-card.tsx', allocFileContent, 'utf8');
console.log('Created src/components/planner/allocation-builder-card.tsx');

// 2. Create PaymentActionCard component
const paymentFileContent = `"use client";

import React, { useState } from "react";
import { ChatMessage } from "@/types";
import { Coins, Check } from "lucide-react";

${paymentCode.replace('function PaymentActionCard', 'export function PaymentActionCard')}
`;

fs.writeFileSync('src/components/planner/payment-action-card.tsx', paymentFileContent, 'utf8');
console.log('Created src/components/planner/payment-action-card.tsx');

// 3. Update PlannerPage
const importsToAdd = `import { AllocationBuilderCard } from "@/components/planner/allocation-builder-card";
import { PaymentActionCard } from "@/components/planner/payment-action-card";`;

let updatedPlanner = planner.slice(0, allocStart) + importsToAdd + '\n\n' + planner.slice(plannerPageStart);
fs.writeFileSync('src/app/planner/page.tsx', updatedPlanner, 'utf8');
console.log('Updated src/app/planner/page.tsx');

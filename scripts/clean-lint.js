const fs = require('fs');

// 1. Budget Page
let budget = fs.readFileSync('src/app/budget/page.tsx', 'utf8');

// remove unused icons
budget = budget.replace(/  AlertTriangle,\r?\n/, '');
budget = budget.replace(/  CheckCircle2,\r?\n/, '');
budget = budget.replace(/  TrendingDown,\r?\n/, '');
budget = budget.replace(/  Coins,\r?\n/, '');
budget = budget.replace(/  Download,\r?\n/, '');
budget = budget.replace(/  ArrowRight,\r?\n/, '');
budget = budget.replace(/  PieChart,\r?\n/, '');

// remove unused context items
budget = budget.replace(/    budgetAlternatives,\r?\n/, '');
budget = budget.replace(/    applyBudgetAlternative,\r?\n/, '');
budget = budget.replace(/    applyMultipleAlternatives,\r?\n/, '');
budget = budget.replace(/    simulateOverBudget,\r?\n/, '');
budget = budget.replace(/    resetToNormalBudget,\r?\n/, '');

// remove unused selectedAltIds
budget = budget.replace(/  const \[selectedAltIds, setSelectedAltIds\] = useState<string\[\]>\(\[\]\);\r?\n/, '');

// remove unused _err
budget = budget.replace(/} catch \(_err\) {/, '} catch {');

// remove unused _pct
if (budget.includes('_pct')) {
  budget = budget.replace(/const _pct =[\s\S]*?: 0;\r?\n\s*return \(/, 'return (');
}

fs.writeFileSync('src/app/budget/page.tsx', budget, 'utf8');
console.log('Cleaned budget/page.tsx');

// 2. Planner Page
let planner = fs.readFileSync('src/app/planner/page.tsx', 'utf8');
planner = planner.replace('import { formatCurrency, CATEGORY_LABELS } from "@/lib/utils";', 'import { CATEGORY_LABELS } from "@/lib/utils";');
planner = planner.replace(/    updateExpense,\r?\n/, '');
planner = planner.replace(/    expenses,\r?\n/, '');
planner = planner.replace(/  const currencyCode = activeEvent\.currency\?\.code \|\| "INR";\r?\n/, '');
fs.writeFileSync('src/app/planner/page.tsx', planner, 'utf8');
console.log('Cleaned planner/page.tsx');

// 3. Wizard Page
let wizard = fs.readFileSync('src/app/wizard/page.tsx', 'utf8');
wizard = wizard.replace('import React, { useState, useEffect } from "react";', 'import React, { useState } from "react";');
wizard = wizard.replace('const [currencyCode, setCurrencyCode] = useState("INR");', 'const currencyCode = "INR";');
wizard = wizard.replace('const [foodPreferences, setFoodPreferences] = useState("");', 'const foodPreferences = "";');
fs.writeFileSync('src/app/wizard/page.tsx', wizard, 'utf8');
console.log('Cleaned wizard/page.tsx');

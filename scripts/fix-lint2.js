const fs = require('fs');

// 1. Fix chat/route.ts: Vendor type is passed to parsePaymentIntent, so it's actually used via ai-intent module.
// The import is a type import but the Vendor type is used in function arg list. Remove bare import, functions handle it.
let chat = fs.readFileSync('src/app/api/chat/route.ts', 'utf8');
chat = chat.replace('import type { Vendor } from "@/types";\n', '');
fs.writeFileSync('src/app/api/chat/route.ts', chat, 'utf8');
console.log('Fixed chat/route.ts - removed unused Vendor import');

// 2. Fix planner/page.tsx: remove imports that were moved to extracted subcomponents
let planner = fs.readFileSync('src/app/planner/page.tsx', 'utf8');
planner = planner.replace("import { CATEGORY_LABELS } from \"@/lib/utils\";\n", '');
planner = planner.replace(', BudgetCategoryAllocation', '');
planner = planner.replace(', ChatMessage', '');
planner = planner.replace('  WalletCards,\n', '');
planner = planner.replace('  CheckCircle2,\n', '');
planner = planner.replace('  SlidersHorizontal,\n', '');
fs.writeFileSync('src/app/planner/page.tsx', planner, 'utf8');
console.log('Fixed planner/page.tsx - removed orphaned imports');

// 3. Fix allocation-builder-card.tsx: remove unused useMemo and Sparkles
let alloc = fs.readFileSync('src/components/planner/allocation-builder-card.tsx', 'utf8');
alloc = alloc.replace('import React, { useState, useMemo } from "react";', 'import React, { useState } from "react";');
alloc = alloc.replace(', Sparkles', '');
fs.writeFileSync('src/components/planner/allocation-builder-card.tsx', alloc, 'utf8');
console.log('Fixed allocation-builder-card.tsx - removed unused useMemo, Sparkles');

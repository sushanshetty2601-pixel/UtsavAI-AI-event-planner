const fs = require('fs');
let ctx = fs.readFileSync('src/contexts/app-context.tsx', 'utf8');
ctx = ctx.replace(
  'import { calculateBudgetSummary, generateBudgetAlternatives } from "@/lib/budget";',
  'import { calculateBudgetSummary, generateBudgetAlternatives } from "@/lib/budget";\nimport { syncVendorsWithExpenses } from "@/lib/vendor-sync";\nimport { computeTableAssignments } from "@/lib/seating";'
);
fs.writeFileSync('src/contexts/app-context.tsx', ctx, 'utf8');
console.log('Added imports to app-context.tsx');

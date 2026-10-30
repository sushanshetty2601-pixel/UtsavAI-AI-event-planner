const fs = require('fs');

let ctx = fs.readFileSync('src/contexts/app-context.tsx', 'utf8');

// 1. Add imports for syncVendorsWithExpenses and computeTableAssignments
const importMarker = 'import { DEFAULT_PRESET_TEMPLATES } from "@/lib/default-events";';
const newImports = `import { DEFAULT_PRESET_TEMPLATES } from "@/lib/default-events";
import { syncVendorsWithExpenses } from "@/lib/vendor-sync";
import { computeTableAssignments } from "@/lib/seating";`;
ctx = ctx.replace(importMarker, newImports);

// 2. Remove syncVendorsWithExpenses function definition (from line 156 to before const AppContext)
const funcStart = '// Helper to bi-directionally synchronize vendor quotes & payments with itemized expenses';
const funcEnd = 'return updatedExpenses;\n}';
const startIdx = ctx.indexOf(funcStart);
const endIdx = ctx.indexOf(funcEnd);

if (startIdx !== -1 && endIdx !== -1) {
  ctx = ctx.slice(0, startIdx) + ctx.slice(endIdx + funcEnd.length);
} else {
  console.error('Could not find syncVendorsWithExpenses definition!');
  process.exit(1);
}

// 3. Simplify autoAssignTables
const oldAutoAssign = `  const autoAssignTables = useCallback(
    (seatsPerTable: number = 8) => {
      if (!activeEventId) return;
      const attendingGuests = guests.filter(
        (g) => g.rsvpStatus === "attending" || g.rsvpStatus === "pending"
      );
      const assignments: { guestId: string; tableNumber: string }[] = [];

      const groupsPriority = [
        "vip",
        "bride_family",
        "groom_family",
        "friends",
        "colleagues",
        "general",
      ];
      const sorted = [...attendingGuests].sort((a, b) => {
        return groupsPriority.indexOf(a.group) - groupsPriority.indexOf(b.group);
      });

      let currentTableIdx = 1;
      let currentTableSeats = 0;
      let currentGroupName = sorted[0]?.group || "general";

      const getTableLabel = (num: number, grp: string) => {
        const labels: Record<string, string> = {
          vip: \`Table \${num} (VIP)\`,
          bride_family: \`Table \${num} (Bride's Family)\`,
          groom_family: \`Table \${num} (Groom's Family)\`,
          friends: \`Table \${num} (Friends)\`,
          colleagues: \`Table \${num} (Colleagues)\`,
          general: \`Table \${num}\`,
        };
        return labels[grp] || \`Table \${num}\`;
      };

      sorted.forEach((g) => {
        const guestSeatCount = 1 + (g.plusOnes || 0);
        if (g.group !== currentGroupName && currentTableSeats > 0) {
          currentTableIdx++;
          currentTableSeats = 0;
          currentGroupName = g.group;
        } else if (currentTableSeats + guestSeatCount > seatsPerTable) {
          currentTableIdx++;
          currentTableSeats = 0;
        }

        const tableLabel = getTableLabel(currentTableIdx, g.group);
        assignments.push({ guestId: g.id, tableNumber: tableLabel });
        currentTableSeats += guestSeatCount;
      });

      guestService.bulkAssignTables(activeEventId, assignments);
      setGuests((prev) =>
        prev.map((g) => {
          const found = assignments.find((a) => a.guestId === g.id);
          return found ? { ...g, tableNumber: found.tableNumber } : g;
        })
      );
    },
    [activeEventId, guests]
  );`;

const newAutoAssign = `  const autoAssignTables = useCallback(
    (seatsPerTable: number = 8) => {
      if (!activeEventId) return;
      const assignments = computeTableAssignments(guests, seatsPerTable);

      guestService.bulkAssignTables(activeEventId, assignments);
      setGuests((prev) =>
        prev.map((g) => {
          const found = assignments.find((a) => a.guestId === g.id);
          return found ? { ...g, tableNumber: found.tableNumber } : g;
        })
      );
    },
    [activeEventId, guests]
  );`;

// Normalize CRLF to LF for reliable matching
const normalize = (s) => s.replace(/\r\n/g, '\n');
const normalizedCtx = normalize(ctx);
const normalizedOld = normalize(oldAutoAssign);
const normalizedNew = normalize(newAutoAssign);

if (normalizedCtx.includes(normalizedOld)) {
  ctx = normalizedCtx.replace(normalizedOld, normalizedNew);
  fs.writeFileSync('src/contexts/app-context.tsx', ctx, 'utf8');
  console.log('Successfully refactored app-context.tsx');
} else {
  console.error('Could not find oldAutoAssign in app-context.tsx');
  process.exit(1);
}

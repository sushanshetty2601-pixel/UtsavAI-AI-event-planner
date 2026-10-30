import { Guest } from "@/types";

export const TABLE_GROUPS_PRIORITY = [
  "vip",
  "bride_family",
  "groom_family",
  "friends",
  "colleagues",
  "general",
] as const;

export function getTableLabel(tableNumber: number, group: string): string {
  const labels: Record<string, string> = {
    vip: `Table ${tableNumber} (VIP)`,
    bride_family: `Table ${tableNumber} (Bride's Family)`,
    groom_family: `Table ${tableNumber} (Groom's Family)`,
    friends: `Table ${tableNumber} (Friends)`,
    colleagues: `Table ${tableNumber} (Colleagues)`,
    general: `Table ${tableNumber}`,
  };
  return labels[group] || `Table ${tableNumber}`;
}

export interface TableAssignment {
  guestId: string;
  tableNumber: string;
}

/**
 * Computes table assignments by grouping guests by relationship/priority
 * and respecting maximum seat capacities per table.
 */
export function computeTableAssignments(
  guests: Guest[],
  seatsPerTable: number = 8
): TableAssignment[] {
  const attendingGuests = guests.filter(
    (g) => g.rsvpStatus === "attending" || g.rsvpStatus === "pending"
  );
  const assignments: TableAssignment[] = [];

  const sorted = [...attendingGuests].sort((a, b) => {
    return (
      TABLE_GROUPS_PRIORITY.indexOf(a.group as (typeof TABLE_GROUPS_PRIORITY)[number]) -
      TABLE_GROUPS_PRIORITY.indexOf(b.group as (typeof TABLE_GROUPS_PRIORITY)[number])
    );
  });

  let currentTableIdx = 1;
  let currentTableSeats = 0;
  let currentGroupName = sorted[0]?.group || "general";

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

  return assignments;
}

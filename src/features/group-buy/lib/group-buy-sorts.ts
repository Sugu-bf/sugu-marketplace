import type { GroupBuySort } from "../api/group-buy.api";

/**
 * The sorts of the open groups list. A plain module: the server page reads it
 * to validate `?sort=`, the client list draws its tabs from it.
 */
export const GROUP_BUY_SORTS: { value: GroupBuySort; label: string }[] = [
  { value: "trending", label: "Bientôt au palier" },
  { value: "ending_soon", label: "Bientôt fermés" },
  { value: "best_saving", label: "Plus grosses remises" },
  { value: "newest", label: "Nouveaux" },
];

export function parseGroupBuySort(raw: string | undefined): GroupBuySort {
  return GROUP_BUY_SORTS.some((option) => option.value === raw) ? (raw as GroupBuySort) : "trending";
}

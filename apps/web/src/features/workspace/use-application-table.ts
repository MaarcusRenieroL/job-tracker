import { useState } from "react";
import type { Application } from "@/types/application";

type SortKey = "role" | "company" | "stage" | "priority" | "location";
type Sorting = { id: SortKey; desc: boolean }[];

export function useApplicationTable(applications: Application[]) {
  const [sorting, setSorting] = useState<Sorting>([]);
  const [page, setPage] = useState(0);
  const pageSize = 10;
  const sorted = [...applications];
  const sort = sorting[0];
  if (sort) sorted.sort((a, b) => String(a[sort.id] ?? "").localeCompare(String(b[sort.id] ?? "")) * (sort.desc ? -1 : 1));
  const pageCount = Math.max(1, Math.ceil(sorted.length / pageSize));
  const currentPage = Math.min(page, pageCount - 1);
  return { rows: sorted.slice(currentPage * pageSize, (currentPage + 1) * pageSize), sorting, setSorting, page: currentPage, setPage, pageCount };
}

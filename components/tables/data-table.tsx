"use client";

import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
  type ColumnFiltersState,
  type Row,
} from "@tanstack/react-table";
import { useEffect, useRef, useState } from "react";
import { ChevronUp, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface DataTableProps<TData> {
  columns: ColumnDef<TData, unknown>[];
  data: TData[];
  emptyState?: React.ReactNode;
  onRowClick?: (row: TData) => void;
  globalFilter?: string;
  className?: string;
  enableKeyboardNav?: boolean;
}

export function DataTable<TData>({
  columns,
  data,
  emptyState,
  onRowClick,
  globalFilter,
  className,
  enableKeyboardNav = true,
}: DataTableProps<TData>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [activeRow, setActiveRow] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const table = useReactTable({
    data,
    columns,
    state: { sorting, columnFilters, globalFilter },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  const rows = table.getRowModel().rows;

  useEffect(() => {
    if (!enableKeyboardNav) return;
    function onKey(e: KeyboardEvent) {
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable)
      ) {
        return;
      }
      if (e.key === "j" || e.key === "ArrowDown") {
        e.preventDefault();
        setActiveRow((r) => Math.min((r ?? -1) + 1, rows.length - 1));
      } else if (e.key === "k" || e.key === "ArrowUp") {
        e.preventDefault();
        setActiveRow((r) => Math.max((r ?? rows.length) - 1, 0));
      } else if (e.key === "Enter" && activeRow != null && onRowClick) {
        e.preventDefault();
        const row = rows[activeRow];
        if (row) onRowClick(row.original);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [rows, activeRow, enableKeyboardNav, onRowClick]);

  return (
    <div
      ref={containerRef}
      className={cn("relative w-full overflow-x-auto", className)}
    >
      <table className="w-full text-sm">
        <thead className="sticky top-0 z-10 bg-background">
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id} className="border-b border-border">
              {headerGroup.headers.map((header) => {
                const sortable = header.column.getCanSort();
                return (
                  <th
                    key={header.id}
                    style={{ width: header.column.columnDef.size }}
                    className={cn(
                      "h-9 px-3 text-left text-[11px] font-medium uppercase tracking-wide text-muted-foreground",
                      sortable && "cursor-pointer select-none",
                    )}
                    onClick={sortable ? header.column.getToggleSortingHandler() : undefined}
                  >
                    {header.isPlaceholder ? null : (
                      <span className="inline-flex items-center gap-1">
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        {{
                          asc: <ChevronUp className="h-3 w-3" />,
                          desc: <ChevronDown className="h-3 w-3" />,
                        }[header.column.getIsSorted() as string] ?? null}
                      </span>
                    )}
                  </th>
                );
              })}
            </tr>
          ))}
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="p-0">
                <div className="px-5 py-12">{emptyState}</div>
              </td>
            </tr>
          ) : (
            rows.map((row, idx) => (
              <DataTableRow
                key={row.id}
                row={row}
                active={idx === activeRow}
                onClick={() => onRowClick?.(row.original)}
              />
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

function DataTableRow<TData>({
  row,
  active,
  onClick,
}: {
  row: Row<TData>;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <tr
      className={cn(
        "border-b border-border last:border-b-0 transition-colors",
        active && "bg-accent",
        "hover:bg-accent cursor-pointer",
      )}
      onClick={onClick}
    >
      {row.getVisibleCells().map((cell) => (
        <td key={cell.id} className="px-3 py-2 align-middle">
          {flexRender(cell.column.columnDef.cell, cell.getContext())}
        </td>
      ))}
    </tr>
  );
}

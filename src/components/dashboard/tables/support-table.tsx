"use client";

import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { useVirtualizer } from "@tanstack/react-virtual";
import { CheckCircle2, Circle, Search, X, Loader2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { IssuePayload } from "~/app/compass/ui";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "~/components/ui/alert-dialog";
import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/components/ui/dialog";
import { Input } from "~/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { apiFetch } from "~/lib/fetcher";

type SupportTicket = {
  id: string;
  description: string;
  isResolved: boolean;
  createdAt: string;
  teamName: string;
  teamNo: number | null;
  labName: string | null;
  submitterName: string | null;
};

type Filters = {
  isResolved: string;
  labName: string;
};

const columnHelper = createColumnHelper<SupportTicket>();

export function SupportTable() {
  const [data, setData] = useState<SupportTicket[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<Filters>({
    isResolved: "all",
    labName: "all",
  });
  const [resolvingId, setResolvingId] = useState<string | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    ticketId: string;
    teamName: string;
    currentStatus: boolean;
  }>({ open: false, ticketId: "", teamName: "", currentStatus: false });

  const tableContainerRef = useRef<HTMLDivElement>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/dashboard/support");
      if (!res.ok) throw new Error("Failed to fetch tickets");
      const result = await res.json();
      setData(result.data ?? []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  const [availableLabs, setAvailableLabs] = useState<string[]>([]);

  useEffect(() => {
    async function fetchLabs() {
      try {
        const res = await fetch("/api/dashboard/allocations/labs");
        if (res.ok) {
          const result = await res.json();
          setAvailableLabs(result.labs.map((l: any) => l.name));
        }
      } catch (err) {
        console.error("Failed to fetch labs for filter", err);
      }
    }
    void fetchLabs();
  }, []);

  const filteredData = useMemo(() => {
    let filtered = data;

    const term = search.trim().toLowerCase();
    if (term) {
      filtered = filtered.filter(
        (t) =>
          t.teamName?.toLowerCase().includes(term) ||
          t.submitterName?.toLowerCase().includes(term),
      );
    }

    if (filters.isResolved !== "all") {
      const resolved = filters.isResolved === "true";
      filtered = filtered.filter((t) => t.isResolved === resolved);
    }

    if (filters.labName !== "all") {
      filtered = filtered.filter((t) => t.labName === filters.labName);
    }

    return filtered;
  }, [data, search, filters]);

  const openResolveDialog = (
    id: string,
    teamName: string,
    currentStatus: boolean,
  ) => {
    setConfirmDialog({ open: true, ticketId: id, teamName, currentStatus });
  };

  const handleConfirmResolve = async () => {
    const { ticketId, currentStatus } = confirmDialog;
    setConfirmDialog((prev) => ({ ...prev, open: false }));
    setResolvingId(ticketId);
    try {
      const res = await apiFetch<IssuePayload>("/api/dashboard/support", {
        method: "PATCH",
        body: JSON.stringify({ id: ticketId, isResolved: !currentStatus }),
      });
      if (res?.id) {
        setData((prev) =>
          prev.map((t) =>
            t.id === ticketId ? { ...t, isResolved: !currentStatus } : t,
          ),
        );
      }
    } catch (err) {
      console.error(err);
    } finally {
      setResolvingId(null);
    }
  };

  const columns = useMemo(
    () => [
      columnHelper.accessor("teamNo", {
        header: "No",
        cell: (info) => (
          <span className="font-mono text-xs">
            {info.getValue() !== null
              ? String(info.getValue()).padStart(2, "0")
              : "--"}
          </span>
        ),
      }),
      columnHelper.accessor("teamName", {
        header: "Team",
        cell: (info) => <span>{info.getValue()}</span>,
      }),
      columnHelper.accessor("labName", {
        header: "Lab",
        cell: (info) => <span>{info.getValue() || "TBA"}</span>,
      }),
      columnHelper.accessor("submitterName", {
        header: "Reported By",
        cell: (info) => <span>{info.getValue()}</span>,
      }),
      columnHelper.accessor("description", {
        header: "Description",
        cell: (info) => (
          <Dialog>
            <DialogTrigger asChild>
              <div
                className="max-w-50 cursor-pointer truncate text-muted-foreground hover:underline"
                title="Click to view full description"
              >
                {info.getValue()}
              </div>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle className="text-lg">Issue Description</DialogTitle>
              </DialogHeader>
              <div className="mt-4 max-h-[60vh] overflow-y-auto whitespace-pre-wrap text-md text-foreground">
                {info.getValue()}
              </div>
            </DialogContent>
          </Dialog>
        ),
      }),
      columnHelper.accessor("createdAt", {
        header: "Time",
        cell: (info) => (
          <span className="whitespace-nowrap text-muted-foreground">
            {new Date(info.getValue()).toLocaleDateString("en-IN", {
              day: "numeric",
              month: "short",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
        ),
      }),
      columnHelper.accessor("isResolved", {
        header: "Status",
        cell: (info) => {
          const isResolved = info.getValue();
          const ticket = info.row.original;
          const isProcessing = resolvingId === ticket.id;

          return (
            <Button
              variant="ghost"
              size="sm"
              className={`h-8 gap-2 ${isResolved ? "text-green-500" : "text-yellow-500"}`}
              onClick={() =>
                openResolveDialog(ticket.id, ticket.teamName, isResolved)
              }
              disabled={isProcessing}
            >
              {isProcessing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : isResolved ? (
                <CheckCircle2 className="h-4 w-4" />
              ) : (
                <Circle className="h-4 w-4" />
              )}
              {isResolved ? "Resolved" : "Pending"}
            </Button>
          );
        },
      }),
    ],
    [resolvingId, openResolveDialog],
  );

  const table = useReactTable({
    data: filteredData,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  const { rows } = table.getRowModel();

  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    estimateSize: () => 56,
    getScrollElement: () => tableContainerRef.current,
    overscan: 10,
  });

  const virtualRows = rowVirtualizer.getVirtualItems();

  const handleFilterChange = (key: keyof Filters, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setSearch("");
    setFilters({ isResolved: "all", labName: "all" });
  };

  const hasActiveFilters =
    search.trim() !== "" ||
    filters.isResolved !== "all" ||
    filters.labName !== "all";

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search team name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-2">
          <Select
            value={filters.isResolved}
            onValueChange={(v) => handleFilterChange("isResolved", v)}
          >
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="true">Resolved</SelectItem>
              <SelectItem value="false">Pending</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={filters.labName}
            onValueChange={(v) => handleFilterChange("labName", v)}
          >
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Lab" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Labs</SelectItem>
              {availableLabs.map((lab) => (
                <SelectItem key={lab} value={lab}>
                  {lab}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              <X className="h-4 w-4 mr-2" />
              Clear
            </Button>
          )}
        </div>
      </div>

      <div
        ref={tableContainerRef}
        className="rounded-lg border bg-card overflow-auto"
        style={{ height: "calc(100vh - 300px)" }}
      >
        <Table>
          <TableHeader className="sticky top-0 bg-card z-10">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {isLoading && data.length === 0 ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={`skeleton-${i}`}>
                  {columns.map((c, j) => (
                    <TableCell key={`skeleton-${i}-${j}`}>
                      <div className="h-4 w-20 animate-pulse rounded bg-muted font-medium" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : rows.length > 0 ? (
              <>
                {virtualRows.map((virtualRow) => {
                  const row = rows[virtualRow.index];
                  if (!row) return null;
                  return (
                    <TableRow key={row.id}>
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id}>
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext(),
                          )}
                        </TableCell>
                      ))}
                    </TableRow>
                  );
                })}
              </>
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-32 text-center text-muted-foreground"
                >
                  {hasActiveFilters
                    ? "No tickets match your filters."
                    : "No support tickets found."}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Confirm status change dialog */}
      <AlertDialog
        open={confirmDialog.open}
        onOpenChange={(open) => setConfirmDialog((prev) => ({ ...prev, open }))}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-lg">
              {confirmDialog.currentStatus
                ? "Mark as Pending?"
                : "Mark as Resolved?"}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-md">
              Are you sure you want to mark the ticket from{" "}
              <span className="font-bold">{confirmDialog.teamName}</span> as{" "}
              <span className="font-bold">
                {confirmDialog.currentStatus ? "pending" : "resolved"}
              </span>
              ?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmResolve}>
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

"use client";

import {
  ChevronLeft,
  ChevronRight,
  Download,
  Eye,
  Loader2,
  Search,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { TeamDetailDialog } from "~/components/dashboard/other/team-detail-dialog";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
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

type SelectedTeamRow = {
  teamId: string;
  teamName: string;
  teamNo: number | null;
  collegeName: string | null;
  stateName: string | null;
  trackId: string;
  trackName: string | null;
  teamStage: "NOT_SELECTED" | "SEMI_SELECTED" | "SELECTED";
  teamProgress:
    | "WINNER"
    | "RUNNER"
    | "SECOND_RUNNER"
    | "TRACK"
    | "PARTICIPATION"
    | null;
  pptUrl: string | null;
  createdAt: string;
  genderCounts: {
    Male: number;
    Female: number;
    "Prefer Not To Say": number;
  };
};

export function SelectionsTab() {
  const [rows, setRows] = useState<SelectedTeamRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [trackIdFilter, setTrackIdFilter] = useState("all");
  const [stateNameFilter, setStateNameFilter] = useState("all");
  const [collegeNameFilter, setCollegeNameFilter] = useState("all");
  const [progressFilter, setProgressFilter] = useState("all");

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [refreshKey, setRefreshKey] = useState(0);

  const [downloadDialogOpen, setDownloadDialogOpen] = useState(false);
  const [exportType, setExportType] = useState<
    "leader_emails" | "all_emails" | "csv"
  >("csv");
  const [isExporting, setIsExporting] = useState(false);

  const [statsModalOpen, setStatsModalOpen] = useState(false);
  const [statsModalType, setStatsModalType] = useState<
    "colleges" | "states" | "gender"
  >("colleges");

  const [detailTeamId, setDetailTeamId] = useState<string | null>(null);
  const [detailTeamName, setDetailTeamName] = useState<string | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  // biome-ignore lint/correctness/useExhaustiveDependencies: <needed>
  useEffect(() => {
    setIsLoading(true);
    fetch("/api/dashboard/selections")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load selected teams");
        return res.json();
      })
      .then((data) => {
        setRows(data.rows || []);
      })
      .catch((err) => {
        console.error(err);
        toast.error("Failed to load selected teams list");
      })
      .finally(() => setIsLoading(false));
  }, [refreshKey]);

  const uniqueTracks = useMemo(() => {
    const tracks = new Map<string, string>();
    for (const row of rows) {
      if (row.trackId && row.trackName) {
        tracks.set(row.trackId, row.trackName);
      }
    }
    return Array.from(tracks.entries())
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [rows]);

  const uniqueStates = useMemo(() => {
    const states = new Set<string>();
    for (const row of rows) {
      if (row.stateName) states.add(row.stateName);
    }
    return Array.from(states).sort();
  }, [rows]);

  const uniqueColleges = useMemo(() => {
    const colleges = new Set<string>();
    for (const row of rows) {
      if (row.collegeName) colleges.add(row.collegeName);
    }
    return Array.from(colleges).sort();
  }, [rows]);

  const filteredRows = useMemo(() => {
    let result = rows;

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((r) => r.teamName.toLowerCase().includes(q));
    }
    if (trackIdFilter !== "all") {
      result = result.filter((r) => r.trackId === trackIdFilter);
    }
    if (stateNameFilter !== "all") {
      result = result.filter((r) => r.stateName === stateNameFilter);
    }
    if (collegeNameFilter !== "all") {
      result = result.filter((r) => r.collegeName === collegeNameFilter);
    }
    if (progressFilter !== "all") {
      if (progressFilter === "none") {
        result = result.filter((r) => !r.teamProgress);
      } else {
        result = result.filter((r) => r.teamProgress === progressFilter);
      }
    }

    return result;
  }, [
    rows,
    search,
    trackIdFilter,
    stateNameFilter,
    collegeNameFilter,
    progressFilter,
  ]);

  const collegesBreakdown = useMemo(() => {
    const counts = new Map<string, number>();
    for (const team of filteredRows) {
      if (!team.collegeName) continue;
      counts.set(team.collegeName, (counts.get(team.collegeName) || 0) + 1);
    }
    return Array.from(counts.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  }, [filteredRows]);

  const statesBreakdown = useMemo(() => {
    const counts = new Map<string, number>();
    for (const team of filteredRows) {
      if (!team.stateName) continue;
      counts.set(team.stateName, (counts.get(team.stateName) || 0) + 1);
    }
    return Array.from(counts.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  }, [filteredRows]);

  const genderBreakdown = useMemo(() => {
    const totals = { Male: 0, Female: 0, "Prefer Not To Say": 0 };
    for (const team of filteredRows) {
      totals.Male += team.genderCounts.Male;
      totals.Female += team.genderCounts.Female;
      totals["Prefer Not To Say"] += team.genderCounts["Prefer Not To Say"];
    }
    return [
      { name: "Male", count: totals.Male },
      { name: "Female", count: totals.Female },
      { name: "Prefer Not To Say", count: totals["Prefer Not To Say"] },
    ].filter((g) => g.count > 0);
  }, [filteredRows]);

  const totalParticipants = useMemo(
    () => genderBreakdown.reduce((sum, g) => sum + g.count, 0),
    [genderBreakdown],
  );

  // biome-ignore lint/correctness/useExhaustiveDependencies: <needed>
  useEffect(() => {
    setCurrentPage(1);
  }, [
    search,
    trackIdFilter,
    stateNameFilter,
    collegeNameFilter,
    progressFilter,
  ]);

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / pageSize));
  const paginatedRows = filteredRows.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );

  const handleRowClick = (row: SelectedTeamRow) => {
    setDetailTeamId(row.teamId);
    setDetailTeamName(row.teamName);
    setDetailOpen(true);
  };

  const handleDownload = async () => {
    const teamIds = rows.map((r) => r.teamId);
    if (teamIds.length === 0) return;
    setIsExporting(true);
    try {
      const res = await fetch("/api/dashboard/submissions/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          teamIds,
          exportType,
        }),
      });
      if (!res.ok) throw new Error("Export failed");

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const extension = exportType === "csv" ? "xlsx" : "txt";
      const formatName =
        exportType === "csv" ? "selected_teams_export" : exportType;
      a.download = `${formatName}.${extension}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      setDownloadDialogOpen(false);
      toast.success("Download generated successfully");
    } catch (_error) {
      toast.error("Failed to generate export");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Selections</h2>
          <p className="text-muted-foreground">Manage Selected Teams</p>
        </div>
        <Button
          onClick={() => setDownloadDialogOpen(true)}
          disabled={rows.length === 0}
        >
          <Download className="mr-2 h-4 w-4" />
          Download All ({rows.length})
        </Button>
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Selected
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{rows.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Filtered Teams
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{filteredRows.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Unique Colleges
              </CardTitle>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setStatsModalType("colleges");
                  setStatsModalOpen(true);
                }}
              >
                <Eye className="h-4 w-4 text-muted-foreground pointer-events-none" />
              </Button>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {collegesBreakdown.length}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Based on filtered teams
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Unique States
              </CardTitle>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setStatsModalType("states");
                  setStatsModalOpen(true);
                }}
              >
                <Eye className="h-4 w-4 text-muted-foreground pointer-events-none" />
              </Button>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statesBreakdown.length}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Based on filtered teams
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Gender Distribution
              </CardTitle>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setStatsModalType("gender");
                  setStatsModalOpen(true);
                }}
              >
                <Eye className="h-4 w-4 text-muted-foreground pointer-events-none" />
              </Button>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalParticipants}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {genderBreakdown
                  .map((g) => `${g.name}: ${g.count}`)
                  .join(" · ")}
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-col gap-3 md:flex-row md:items-center md:flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filter by team name"
              className="pl-9"
            />
          </div>

          <Select value={trackIdFilter} onValueChange={setTrackIdFilter}>
            <SelectTrigger className="h-9 w-[180px] text-sm font-normal">
              <SelectValue placeholder="Track" />
            </SelectTrigger>
            <SelectContent className="text-sm">
              <SelectItem value="all">All Tracks</SelectItem>
              {uniqueTracks.map((track) => (
                <SelectItem key={track.id} value={track.id}>
                  {track.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={stateNameFilter} onValueChange={setStateNameFilter}>
            <SelectTrigger className="h-9 w-[180px] text-sm font-normal">
              <SelectValue placeholder="State" />
            </SelectTrigger>
            <SelectContent className="text-sm">
              <SelectItem value="all">All States</SelectItem>
              {uniqueStates.map((state) => (
                <SelectItem key={state} value={state}>
                  {state}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={collegeNameFilter}
            onValueChange={setCollegeNameFilter}
          >
            <SelectTrigger className="h-9 w-[180px] text-sm font-normal">
              <SelectValue placeholder="College" />
            </SelectTrigger>
            <SelectContent className="text-sm">
              <SelectItem value="all">All Colleges</SelectItem>
              {uniqueColleges.map((college) => (
                <SelectItem key={college} value={college}>
                  {college}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={progressFilter} onValueChange={setProgressFilter}>
            <SelectTrigger className="h-9 w-[160px] text-sm font-normal">
              <SelectValue placeholder="Progress" />
            </SelectTrigger>
            <SelectContent className="text-sm">
              <SelectItem value="all">All Progress</SelectItem>
              <SelectItem value="none">Pending</SelectItem>
              <SelectItem value="PARTICIPATION">Participation</SelectItem>
              <SelectItem value="TRACK">Track Winner</SelectItem>
              <SelectItem value="SECOND_RUNNER">Second Runner</SelectItem>
              <SelectItem value="RUNNER">Runner</SelectItem>
              <SelectItem value="WINNER">Winner</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Dialog open={downloadDialogOpen} onOpenChange={setDownloadDialogOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Download Data</DialogTitle>
              <DialogDescription>
                Export data for all {rows.length} selected teams.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label>Export Format</Label>
                <Select
                  value={exportType}
                  onValueChange={(val: string) =>
                    setExportType(val as "leader_emails" | "all_emails" | "csv")
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select format" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="leader_emails">
                      Leader Emails (.txt)
                    </SelectItem>
                    <SelectItem value="all_emails">
                      All Member Emails (.txt)
                    </SelectItem>
                    <SelectItem value="csv">
                      Detailed Spreadsheet (.xlsx)
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {exportType === "csv" && (
                <p className="text-sm text-muted-foreground mt-2">
                  Exports an Excel file with team names grouped (merged cells)
                  and individual member details including Name, Alias, and
                  contact info.
                </p>
              )}
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setDownloadDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button onClick={handleDownload} disabled={isExporting}>
                {isExporting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Download className="mr-2 h-4 w-4" />
                )}
                {isExporting ? "Exporting..." : "Download"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={statsModalOpen} onOpenChange={setStatsModalOpen}>
          <DialogContent className="max-w-md max-h-[80vh] overflow-hidden flex flex-col">
            <DialogHeader>
              <DialogTitle>
                {statsModalType === "colleges"
                  ? "Colleges Breakdown"
                  : statsModalType === "states"
                    ? "States Breakdown"
                    : "Gender Distribution"}
              </DialogTitle>
              <DialogDescription>
                {statsModalType === "gender"
                  ? "Participant count by gender."
                  : `Count of selected teams per ${statsModalType === "colleges" ? "college" : "state"}.`}
              </DialogDescription>
            </DialogHeader>
            <div className="flex-1 overflow-y-auto mt-4 px-1 rounded-md border bg-card">
              <Table>
                <TableHeader className="sticky top-0 bg-background shadow-sm border-b z-10">
                  <TableRow>
                    <TableHead>
                      {statsModalType === "colleges"
                        ? "College/University"
                        : statsModalType === "states"
                          ? "State/City"
                          : "Gender"}
                    </TableHead>
                    <TableHead className="text-right">
                      {statsModalType === "gender" ? "Participants" : "Teams"}
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(statsModalType === "colleges"
                    ? collegesBreakdown
                    : statsModalType === "states"
                      ? statesBreakdown
                      : genderBreakdown
                  ).map((item) => (
                    <TableRow key={item.name}>
                      <TableCell className="font-medium text-sm">
                        {item.name}
                      </TableCell>
                      <TableCell className="text-right">{item.count}</TableCell>
                    </TableRow>
                  ))}
                  {(statsModalType === "colleges"
                    ? collegesBreakdown
                    : statsModalType === "states"
                      ? statesBreakdown
                      : genderBreakdown
                  ).length === 0 && (
                    <TableRow>
                      <TableCell
                        colSpan={2}
                        className="text-center text-muted-foreground py-4 text-sm"
                      >
                        No data available based on current selection.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </DialogContent>
        </Dialog>

        <div className="rounded-lg border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16">Team #</TableHead>
                <TableHead>Team Name</TableHead>
                <TableHead className="text-center w-12">PPT</TableHead>
                <TableHead>Track</TableHead>
                <TableHead>Progress</TableHead>
                <TableHead>College / State</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="h-32 text-center text-muted-foreground"
                  >
                    <div className="flex items-center justify-center">
                      <Loader2 className="h-6 w-6 animate-spin mr-2" />
                      Loading selected teams...
                    </div>
                  </TableCell>
                </TableRow>
              ) : paginatedRows.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="h-32 text-center text-muted-foreground"
                  >
                    No selected teams found matching criteria.
                  </TableCell>
                </TableRow>
              ) : (
                paginatedRows.map((row) => (
                  <TableRow
                    key={row.teamId}
                    className="hover:bg-muted/50 cursor-pointer"
                    onClick={() => handleRowClick(row)}
                  >
                    <TableCell className="font-mono font-semibold">
                      {row.teamNo ?? "—"}
                    </TableCell>
                    <TableCell className="font-medium">
                      {row.teamName}
                    </TableCell>
                    <TableCell className="text-center">
                      {row.pptUrl ? (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-100 dark:text-blue-400 dark:hover:bg-blue-900/50"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (row.pptUrl) {
                              window.open(row.pptUrl, "_blank");
                            }
                          }}
                          title="View PPT"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {row.trackName ? (
                        <Badge
                          variant="secondary"
                          className="font-normal text-xs"
                        >
                          {row.trackName}
                        </Badge>
                      ) : (
                        "—"
                      )}
                    </TableCell>
                    <TableCell>
                      {row.teamProgress ? (
                        <Badge
                          variant="outline"
                          className="font-medium text-xs whitespace-nowrap bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-900/40 dark:text-indigo-300 dark:border-indigo-800"
                        >
                          {row.teamProgress.replace("_", " ")}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground text-xs italic">
                          Pending
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-0.5">
                        <span
                          className="text-sm truncate max-w-[200px]"
                          title={row.collegeName || ""}
                        >
                          {row.collegeName || "No College"}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {row.stateName || "No State"}
                        </span>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {!isLoading && filteredRows.length > 0 && (
          <div className="flex flex-col sm:flex-row items-center sm:justify-between gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <span>Rows per page</span>
              <Select
                value={pageSize.toString()}
                onValueChange={(v) => {
                  setPageSize(Number(v));
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger className="h-8 w-[70px] text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="25">25</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <span>
                Page {currentPage} of {totalPages} ({filteredRows.length} total)
              </span>
              <div className="flex gap-1 ml-2">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() =>
                    setCurrentPage((p) => Math.min(totalPages, p + 1))
                  }
                  disabled={currentPage === totalPages}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      <TeamDetailDialog
        teamId={detailTeamId}
        teamName={detailTeamName}
        teamAttended={true}
        open={detailOpen}
        onOpenChange={setDetailOpen}
        onUpdate={() => setRefreshKey((k) => k + 1)}
      />
    </div>
  );
}

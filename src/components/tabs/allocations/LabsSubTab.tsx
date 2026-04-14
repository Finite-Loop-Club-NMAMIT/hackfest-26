"use client";

import {
  FlaskConical,
  Loader2,
  Plus,
  RefreshCw,
  Trash2,
  Users,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";

type Lab = {
  id: string;
  name: string;
  capacity: number;
};

type AllocationTeam = {
  teamId: string;
  teamName: string;
  teamNo: number | null;
  collegeName: string | null;
  memberCount: number;
  teamGender: string;
};

export function LabsSubTab() {
  const [labs, setLabs] = useState<Lab[]>([]);
  const [teams, setTeams] = useState<AllocationTeam[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  const [createOpen, setCreateOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newCapacity, setNewCapacity] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // biome-ignore lint/correctness/useExhaustiveDependencies: needed
  useEffect(() => {
    setIsLoading(true);
    Promise.all([
      fetch("/api/dashboard/allocations/labs").then((r) => r.json()),
      fetch("/api/dashboard/allocations/teams").then((r) => r.json()),
    ])
      .then(([labsData, teamsData]) => {
        setLabs(labsData.labs ?? []);
        setTeams(teamsData.teams ?? []);
      })
      .catch(() => toast.error("Failed to load labs data"))
      .finally(() => setIsLoading(false));
  }, [refreshKey]);

  const handleCreate = async () => {
    const cap = Number.parseInt(newCapacity, 10);
    if (!newName.trim() || Number.isNaN(cap) || cap <= 0) return;
    setIsCreating(true);
    try {
      const res = await fetch("/api/dashboard/allocations/labs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName.trim(), capacity: cap }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to create lab");
      }
      toast.success(`Lab "${newName}" created`);
      setCreateOpen(false);
      setNewName("");
      setNewCapacity("");
      setRefreshKey((k) => k + 1);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create lab");
    } finally {
      setIsCreating(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTargetId) return;
    setIsDeleting(true);
    try {
      const res = await fetch(
        `/api/dashboard/allocations/labs/${deleteTargetId}`,
        { method: "DELETE" },
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to delete");
      toast.success("Lab deleted");
      setDeleteTargetId(null);
      setRefreshKey((k) => k + 1);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete lab");
    } finally {
      setIsDeleting(false);
    }
  };

  // Distribute teams across labs based on capacity (teams per lab = capacity / avg team size)
  const planAssignment = () => {
    if (labs.length === 0 || teams.length === 0) return [];
    const totalCapacity = labs.reduce((s, l) => s + l.capacity, 0);
    const avgMemberCount =
      teams.reduce((s, t) => s + t.memberCount, 0) / teams.length || 1;
    const teamsPerLab = labs.map((l) =>
      Math.floor(l.capacity / avgMemberCount),
    );

    let teamIdx = 0;
    return labs.map((lab, i) => {
      const count = teamsPerLab[i];
      const assigned = teams.slice(teamIdx, teamIdx + count);
      teamIdx += count;
      return { lab, teams: assigned };
    });
  };

  const plan = planAssignment();
  const plannedCount = plan.reduce((s, p) => s + p.teams.length, 0);
  const totalCapacity = labs.reduce((s, l) => s + l.capacity, 0);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-40">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <p className="text-muted-foreground text-sm">
          Manage labs and plan team seating based on capacity
        </p>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setRefreshKey((k) => k + 1)}
          >
            <RefreshCw className="h-4 w-4 mr-1" />
            Refresh
          </Button>
          <Button size="sm" onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4 mr-1" />
            Add Lab
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Labs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{labs.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Capacity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCapacity}</div>
            <p className="text-xs text-muted-foreground mt-1">participants</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Selected Teams</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{teams.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {plannedCount} fit in plan
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Labs Management + Plan */}
      {labs.length === 0 ? (
        <div className="rounded-lg border border-dashed p-12 text-center text-muted-foreground">
          <FlaskConical className="h-8 w-8 mx-auto mb-3 opacity-40" />
          <p className="text-sm">No labs created yet.</p>
          <p className="text-xs mt-1">Click "Add Lab" to get started.</p>
        </div>
      ) : (
        <div className="space-y-4">
          <h3 className="font-semibold text-sm">Labs & Seating Plan</h3>
          {plan.map(({ lab, teams: labTeams }) => (
            <div key={lab.id} className="rounded-lg border">
              <div className="flex items-center justify-between p-4 bg-muted/30">
                <div className="flex items-center gap-3">
                  <FlaskConical className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="font-medium text-sm">{lab.name}</p>
                    <p className="text-xs text-muted-foreground">
                      Capacity: {lab.capacity} participants
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-xs">
                    <Users className="h-3 w-3 mr-1" />
                    {labTeams.length} teams planned
                  </Badge>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-destructive hover:text-destructive"
                    onClick={() => setDeleteTargetId(lab.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
              {labTeams.length > 0 && (
                <div className="p-3 border-t">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12 h-8 text-xs">#</TableHead>
                        <TableHead className="h-8 text-xs">Team</TableHead>
                        <TableHead className="h-8 text-xs">College</TableHead>
                        <TableHead className="h-8 text-xs text-right">Members</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {labTeams.map((t) => (
                        <TableRow key={t.teamId}>
                          <TableCell className="font-mono text-xs py-2">
                            {t.teamNo ?? "—"}
                          </TableCell>
                          <TableCell className="text-sm font-medium py-2">
                            {t.teamName}
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground py-2 max-w-[160px] truncate">
                            {t.collegeName ?? "—"}
                          </TableCell>
                          <TableCell className="text-right text-sm py-2">
                            {t.memberCount}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Create Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-[380px]">
          <DialogHeader>
            <DialogTitle>Create Lab</DialogTitle>
            <DialogDescription>
              Add a new lab with a participant capacity.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Lab Name</Label>
              <Input
                placeholder="e.g. CS Lab 101"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Capacity (participants)</Label>
              <Input
                type="number"
                placeholder="e.g. 40"
                min={1}
                value={newCapacity}
                onChange={(e) => setNewCapacity(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleCreate()}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCreate}
              disabled={
                isCreating ||
                !newName.trim() ||
                !newCapacity ||
                Number.parseInt(newCapacity, 10) <= 0
              }
            >
              {isCreating && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <Dialog
        open={!!deleteTargetId}
        onOpenChange={(o) => !o && setDeleteTargetId(null)}
      >
        <DialogContent className="sm:max-w-[380px]">
          <DialogHeader>
            <DialogTitle>Delete Lab</DialogTitle>
            <DialogDescription>
              This will permanently delete the lab.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTargetId(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

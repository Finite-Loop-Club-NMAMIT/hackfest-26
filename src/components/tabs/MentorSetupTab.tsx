"use client";

import { Loader2, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardTitle,
} from "~/components/ui/card";
import { Checkbox } from "~/components/ui/checkbox";
import { Input } from "~/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { Switch } from "~/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";

type MentorRound = {
  id: string;
  name: string;
  status: "Draft" | "Active" | "Completed";
};

type MentorUser = {
  id: string;
  name: string;
  username: string;
};

type TeamOption = {
  id: string;
  name: string;
};

type MentorHistoryRow = {
  assignmentId: string;
  teamId: string;
  teamName: string;
  mentorRoundId: string;
  mentorRoundName: string;
  mentorRoundStatus: "Draft" | "Active" | "Completed";
  mentorId: string;
  mentorUserId: string;
  mentorName: string;
  mentorUsername: string;
  feedbackId: string | null;
  feedback: string | null;
};

export function MentorSetupTab() {
  const [isLoading, setIsLoading] = useState(true);
  const [isCreatingRound, setIsCreatingRound] = useState(false);
  const [isUpdatingRoundStatus, setIsUpdatingRoundStatus] = useState(false);
  const [isDeletingRound, setIsDeletingRound] = useState(false);
  const [isLoadingAssignments, setIsLoadingAssignments] = useState(false);
  const [isSavingAssignments, setIsSavingAssignments] = useState(false);
  const [isCopyingAssignments, setIsCopyingAssignments] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  const [rounds, setRounds] = useState<MentorRound[]>([]);
  const [mentorUsers, setMentorUsers] = useState<MentorUser[]>([]);
  const [allTeams, setAllTeams] = useState<TeamOption[]>([]);
  const [selectedRoundId, setSelectedRoundId] = useState("");
  const [sourceRoundId, setSourceRoundId] = useState("");
  const [overwriteCopiedAssignments, setOverwriteCopiedAssignments] =
    useState(false);
  const [selectedMentorUserId, setSelectedMentorUserId] = useState("");
  const [selectedTeamIds, setSelectedTeamIds] = useState<string[]>([]);
  const [feedbackHistory, setFeedbackHistory] = useState<MentorHistoryRow[]>(
    [],
  );

  const [teamSearch, setTeamSearch] = useState("");

  const selectedRound = useMemo(
    () => rounds.find((round) => round.id === selectedRoundId),
    [rounds, selectedRoundId],
  );

  const selectedMentorUser = useMemo(
    () => mentorUsers.find((user) => user.id === selectedMentorUserId),
    [mentorUsers, selectedMentorUserId],
  );

  const canManageAssignments = selectedRound?.status !== "Completed";

  const filteredTeams = useMemo(() => {
    const term = teamSearch.trim().toLowerCase();
    if (!term) return allTeams;
    return allTeams.filter(
      (team) =>
        team.name.toLowerCase().includes(term) ||
        team.id.toLowerCase().includes(term),
    );
  }, [allTeams, teamSearch]);

  const fetchRounds = async () => {
    const res = await fetch("/api/dashboard/mentor/rounds");
    if (!res.ok) throw new Error("Failed to load mentor rounds");
    const data = (await res.json()) as MentorRound[];
    setRounds(data);
    if (data.length > 0 && !selectedRoundId) {
      setSelectedRoundId(data[0].id);
    }
  };

  const fetchAssignments = async (roundId: string, mentorUserId?: string) => {
    if (!roundId) {
      setMentorUsers([]);
      setAllTeams([]);
      setSelectedTeamIds([]);
      return;
    }

    const params = new URLSearchParams({ mentorRoundId: roundId });
    if (mentorUserId) {
      params.set("mentorUserId", mentorUserId);
    }

    setIsLoadingAssignments(true);
    const res = await fetch(
      `/api/dashboard/mentor/assignments?${params.toString()}`,
    );
    setIsLoadingAssignments(false);

    if (!res.ok) throw new Error("Failed to load mentor assignments");

    const data = (await res.json()) as {
      mentorUsers: MentorUser[];
      teams: TeamOption[];
      assignedTeamIds: string[];
    };

    setMentorUsers(data.mentorUsers);
    setAllTeams(data.teams);
    setSelectedTeamIds(data.assignedTeamIds || []);

    if (!selectedMentorUserId && data.mentorUsers.length > 0) {
      setSelectedMentorUserId(data.mentorUsers[0].id);
    }
  };

  const fetchHistory = async (roundId?: string) => {
    setIsLoadingHistory(true);
    const params = new URLSearchParams();
    if (roundId) {
      params.set("mentorRoundId", roundId);
    }

    const query = params.toString();
    const res = await fetch(
      `/api/dashboard/mentor/history${query ? `?${query}` : ""}`,
    );
    setIsLoadingHistory(false);

    if (!res.ok) throw new Error("Failed to load mentor feedback history");
    const data = (await res.json()) as MentorHistoryRow[];
    setFeedbackHistory(data);
  };

  // biome-ignore lint/correctness/useExhaustiveDependencies: initial setup fetch
  useEffect(() => {
    const run = async () => {
      try {
        setIsLoading(true);
        await fetchRounds();
      } catch (error) {
        toast.error(
          error instanceof Error
            ? error.message
            : "Failed to load mentor setup",
        );
      } finally {
        setIsLoading(false);
      }
    };
    run();
  }, []);

  // biome-ignore lint/correctness/useExhaustiveDependencies: selection-driven refresh
  useEffect(() => {
    const run = async () => {
      try {
        await fetchAssignments(
          selectedRoundId,
          selectedMentorUserId || undefined,
        );
      } catch (error) {
        toast.error(
          error instanceof Error
            ? error.message
            : "Failed to load mentor assignments",
        );
      }
    };
    run();
  }, [selectedRoundId, selectedMentorUserId]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: history follows round filter
  useEffect(() => {
    const run = async () => {
      try {
        await fetchHistory(selectedRoundId || undefined);
      } catch (error) {
        toast.error(
          error instanceof Error
            ? error.message
            : "Failed to load mentor history",
        );
      }
    };
    run();
  }, [selectedRoundId]);

  const handleCreateRound = async () => {
    const usedNumbers = new Set<number>();
    for (const round of rounds) {
      const match = /^round\s+(\d+)$/i.exec(round.name.trim());
      if (match?.[1]) {
        usedNumbers.add(Number(match[1]));
      }
    }

    let next = 1;
    while (usedNumbers.has(next)) {
      next += 1;
    }

    const finalName = `Round ${next}`;

    try {
      setIsCreatingRound(true);
      const res = await fetch("/api/dashboard/mentor/rounds", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: finalName }),
      });

      if (!res.ok) {
        const data = (await res.json()) as { message?: string };
        throw new Error(data.message || "Failed to create round");
      }

      const created = (await res.json()) as MentorRound;
      setRounds((prev) =>
        [...prev, created].sort((a, b) => a.name.localeCompare(b.name)),
      );
      setSelectedRoundId(created.id);
      toast.success("Mentor round created");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to create round",
      );
    } finally {
      setIsCreatingRound(false);
    }
  };

  const handleDeleteRound = async (roundId: string) => {
    if (!roundId) {
      return;
    }

    try {
      setIsDeletingRound(true);
      const res = await fetch(
        `/api/dashboard/mentor/rounds?id=${encodeURIComponent(roundId)}`,
        { method: "DELETE" },
      );

      if (!res.ok) {
        const data = (await res.json()) as { message?: string };
        throw new Error(data.message || "Failed to delete round");
      }

      const nextRounds = rounds.filter((round) => round.id !== roundId);
      setRounds(nextRounds);
      if (selectedRoundId === roundId) {
        setSelectedRoundId(nextRounds[0]?.id ?? "");
      }
      setSourceRoundId("");
      setSelectedMentorUserId("");
      setSelectedTeamIds([]);
      setFeedbackHistory([]);
      toast.success("Mentor round deleted");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to delete round",
      );
    } finally {
      setIsDeletingRound(false);
    }
  };

  const handleSetRoundStatus = async (
    status: "Draft" | "Active" | "Completed",
  ) => {
    if (!selectedRound) {
      toast.error("Select a mentor round first");
      return;
    }

    try {
      setIsUpdatingRoundStatus(true);
      const res = await fetch("/api/dashboard/mentor/rounds", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: selectedRound.id, status }),
      });

      if (!res.ok) {
        const data = (await res.json()) as { message?: string };
        throw new Error(data.message || "Failed to update round status");
      }

      const updated = (await res.json()) as MentorRound;
      setRounds((prev) =>
        prev.map((round) => (round.id === updated.id ? updated : round)),
      );
      toast.success(`Round status changed to ${updated.status}`);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to update round status",
      );
    } finally {
      setIsUpdatingRoundStatus(false);
    }
  };

  const toggleTeamSelection = (teamId: string, checked: boolean) => {
    setSelectedTeamIds((prev) => {
      if (checked) {
        if (prev.includes(teamId)) return prev;
        return [...prev, teamId];
      }

      return prev.filter((id) => id !== teamId);
    });
  };

  const handleSelectVisibleTeams = () => {
    setSelectedTeamIds((prev) => {
      const combined = new Set(prev);
      for (const team of filteredTeams) {
        combined.add(team.id);
      }
      return Array.from(combined);
    });
  };

  const handleCopyFromPreviousRound = async () => {
    if (!selectedRoundId || !sourceRoundId) {
      toast.error("Select source and target rounds");
      return;
    }

    if (selectedRoundId === sourceRoundId) {
      toast.error("Source and target rounds must be different");
      return;
    }

    try {
      setIsCopyingAssignments(true);
      const res = await fetch("/api/dashboard/mentor/assignments", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sourceMentorRoundId: sourceRoundId,
          targetMentorRoundId: selectedRoundId,
          overwriteExisting: overwriteCopiedAssignments,
        }),
      });

      if (!res.ok) {
        const data = (await res.json()) as { message?: string };
        throw new Error(data.message || "Failed to copy assignments");
      }

      const data = (await res.json()) as { copiedCount: number };
      toast.success(`Copied ${data.copiedCount} mentor-team allocations`);
      await fetchAssignments(
        selectedRoundId,
        selectedMentorUserId || undefined,
      );
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to copy assignments",
      );
    } finally {
      setIsCopyingAssignments(false);
    }
  };

  const handleSaveAssignments = async () => {
    if (!selectedRoundId || !selectedMentorUserId) {
      toast.error("Select both round and mentor user");
      return;
    }

    try {
      setIsSavingAssignments(true);
      const res = await fetch("/api/dashboard/mentor/assignments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mentorRoundId: selectedRoundId,
          mentorUserId: selectedMentorUserId,
          teamIds: selectedTeamIds,
        }),
      });

      if (!res.ok) {
        const data = (await res.json()) as { message?: string };
        throw new Error(data.message || "Failed to save assignments");
      }

      toast.success("Mentor assignments saved");
      await fetchAssignments(selectedRoundId, selectedMentorUserId);
      await fetchHistory(selectedRoundId);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to save assignments",
      );
    } finally {
      setIsSavingAssignments(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center text-sm text-muted-foreground">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        Loading mentor setup...
      </div>
    );
  }

  return (
    <div className="max-w-full space-y-6 overflow-x-hidden">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Mentor Setup</h2>
        <p className="text-muted-foreground">
          Create mentor rounds, allocate mentors to teams, and review feedback
          history.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-5">
        <Card className="min-w-0 border-primary/20 bg-linear-to-b from-background to-primary/5 xl:col-span-2">
          <CardContent className="space-y-4">
            <div>
              <CardTitle className="mb-2">Create Mentor Round</CardTitle>
              <CardDescription>
                Add rounds used for mentor feedback cycles.
              </CardDescription>
            </div>

            <Button
              className="w-full"
              onClick={handleCreateRound}
              disabled={isCreatingRound}
            >
              {isCreatingRound ? "Creating..." : "Add Round"}
            </Button>

            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Available rounds</p>
              <div className="flex flex-wrap gap-2">
                {rounds.length === 0 ? (
                  <span className="text-sm text-muted-foreground">
                    No rounds yet
                  </span>
                ) : (
                  rounds.map((round) => (
                    <div
                      key={round.id}
                      className="flex items-center gap-1 rounded-md border bg-background pr-1"
                    >
                      <Button
                        variant={
                          selectedRoundId === round.id ? "default" : "ghost"
                        }
                        size="sm"
                        onClick={() => setSelectedRoundId(round.id)}
                      >
                        {round.name}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground"
                        onClick={() => handleDeleteRound(round.id)}
                        disabled={isDeletingRound}
                      >
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </div>

            {selectedRound ? (
              <div className="space-y-2 rounded-md border p-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Status</span>
                  <Badge variant="secondary">{selectedRound.status}</Badge>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleSetRoundStatus("Draft")}
                    disabled={
                      isUpdatingRoundStatus || selectedRound.status === "Draft"
                    }
                  >
                    Draft
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleSetRoundStatus("Active")}
                    disabled={
                      isUpdatingRoundStatus || selectedRound.status === "Active"
                    }
                  >
                    Active
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleSetRoundStatus("Completed")}
                    disabled={
                      isUpdatingRoundStatus ||
                      selectedRound.status === "Completed"
                    }
                  >
                    Completed
                  </Button>
                </div>
              </div>
            ) : null}

            <div className="space-y-2 rounded-md border p-3">
              <p className="text-sm font-medium">Copy From Previous Round</p>
              <Select value={sourceRoundId} onValueChange={setSourceRoundId}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select source round" />
                </SelectTrigger>
                <SelectContent>
                  {rounds
                    .filter((round) => round.id !== selectedRoundId)
                    .map((round) => (
                      <SelectItem key={round.id} value={round.id}>
                        {round.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              <div className="flex items-center justify-between rounded-md border p-2">
                <span className="text-xs text-muted-foreground">
                  Overwrite current target assignments
                </span>
                <Switch
                  checked={overwriteCopiedAssignments}
                  onCheckedChange={setOverwriteCopiedAssignments}
                />
              </div>
              <Button
                className="w-full"
                variant="outline"
                onClick={handleCopyFromPreviousRound}
                disabled={
                  isCopyingAssignments || !selectedRoundId || !sourceRoundId
                }
              >
                {isCopyingAssignments ? "Copying..." : "Use Same Mentors"}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="min-w-0 border-primary/20 bg-linear-to-b from-background to-primary/5 xl:col-span-3">
          <CardContent className="space-y-4">
            <div>
              <CardTitle className="mb-2">Mentor Team Allocation</CardTitle>
              <CardDescription>
                Assign teams to mentors for the selected round.
              </CardDescription>
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Mentor round</p>
                <Select
                  value={selectedRoundId}
                  onValueChange={setSelectedRoundId}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a round" />
                  </SelectTrigger>
                  <SelectContent>
                    {rounds.map((round) => (
                      <SelectItem key={round.id} value={round.id}>
                        {round.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Mentor user</p>
                <Select
                  value={selectedMentorUserId}
                  onValueChange={setSelectedMentorUserId}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select mentor user" />
                  </SelectTrigger>
                  <SelectContent>
                    {mentorUsers.map((mentorUser) => (
                      <SelectItem key={mentorUser.id} value={mentorUser.id}>
                        {mentorUser.name} ({mentorUser.username})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {isLoadingAssignments ? (
              <div className="flex items-center text-sm text-muted-foreground">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Loading teams...
              </div>
            ) : (
              <div className="space-y-3 rounded-md border p-3">
                <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
                  <Input
                    placeholder="Search teams by name or ID"
                    value={teamSearch}
                    onChange={(event) => setTeamSearch(event.target.value)}
                    className="md:col-span-2"
                  />
                  <div className="grid min-w-0 grid-cols-2 gap-2 overflow-hidden">
                    <Button
                      variant="outline"
                      className="w-full min-w-0"
                      onClick={() => setSelectedTeamIds([])}
                      disabled={!canManageAssignments}
                    >
                      Clear
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full min-w-0"
                      onClick={handleSelectVisibleTeams}
                      disabled={
                        filteredTeams.length === 0 || !canManageAssignments
                      }
                    >
                      Select Visible
                    </Button>
                  </div>
                </div>

                <div className="h-72 overflow-x-hidden overflow-y-scroll rounded-md border p-3 pr-2">
                  {allTeams.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      No teams available.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {filteredTeams.map((team) => {
                        const checked = selectedTeamIds.includes(team.id);
                        return (
                          <div
                            key={team.id}
                            className="flex items-center gap-2 text-sm"
                          >
                            <Checkbox
                              checked={checked}
                              onCheckedChange={(value) =>
                                toggleTeamSelection(team.id, value === true)
                              }
                              disabled={!canManageAssignments}
                            />
                            <span className="truncate">{team.name}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                {selectedMentorUser
                  ? `${selectedTeamIds.length} teams selected for ${selectedMentorUser.name}`
                  : "Select a mentor user"}
              </p>
              <Button
                onClick={handleSaveAssignments}
                disabled={
                  !selectedRoundId ||
                  !selectedMentorUserId ||
                  isSavingAssignments ||
                  !canManageAssignments
                }
              >
                {isSavingAssignments ? "Saving..." : "Save Allocation"}
              </Button>
            </div>

            {!canManageAssignments && selectedRound ? (
              <p className="text-xs text-amber-600">
                Round is completed. Team allocation is locked.
              </p>
            ) : null}
          </CardContent>
        </Card>
      </div>

      <Card className="min-w-0 border-primary/20 bg-linear-to-b from-background to-primary/5">
        <CardContent className="space-y-3">
          <div>
            <CardTitle className="mb-2">Mentor Feedback History</CardTitle>
            <CardDescription>
              Review mentor feedback records for the selected round.
            </CardDescription>
          </div>

          {isLoadingHistory ? (
            <div className="flex items-center text-sm text-muted-foreground">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Loading feedback history...
            </div>
          ) : feedbackHistory.length === 0 ? (
            <div className="rounded-md border p-4 text-sm text-muted-foreground">
              No mentor feedback recorded for this round yet.
            </div>
          ) : (
            <div className="overflow-x-auto rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Round</TableHead>
                    <TableHead>Mentor</TableHead>
                    <TableHead>Team</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Feedback</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {feedbackHistory.map((row, index) => (
                    <TableRow key={`${row.assignmentId}-${index}`}>
                      <TableCell className="font-medium">
                        {row.mentorRoundName}
                      </TableCell>
                      <TableCell>
                        {row.mentorName} @{row.mentorUsername}
                      </TableCell>
                      <TableCell>{row.teamName}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {row.mentorRoundStatus}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-105 truncate">
                        {row.feedback?.trim() || "No feedback submitted"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

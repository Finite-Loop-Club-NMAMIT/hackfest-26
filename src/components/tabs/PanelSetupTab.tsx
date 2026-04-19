"use client";

import { Eye, Loader2, MessageSquare } from "lucide-react";

import { useEffect, useMemo, useRef, useState } from "react";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
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
import { apiFetch } from "~/lib/fetcher";

type PanelRound = {
  id: string;
  name: string;
  status: "Draft" | "Active" | "Completed";
};

type PanelCriteria = {
  id: string;
  panelRoundId: string;
  criteriaName: string;
  maxScore: number;
};

type PanelistUser = {
  id: string;
  name: string;
  username: string;
};

type TeamOption = {
  id: string;
  name: string;
  trackId: string;
  labId: string;
};

type LeaderboardRow = {
  rank: number;
  teamId: string;
  teamName: string;
  trackId: string | null;
  trackName: string | null;
  rawTotalScore: number;
  normalizedTotalScore: number;
  maxPossibleScore: number;
  percentage: number;
  panelistCount: number;
  judgeNormalizedTotal: number;
};

type PanelistScoreDetail = {
  panelistId: string;
  panelistUserId: string;
  panelistName: string;
  panelistUsername: string;
  assignmentId: string;
  totalRawScore: number;
  totalMaxScore: number;
  normalizedTotalScore: number;
  criteriaScores: Array<{
    criteriaId: string;
    criteriaName: string;
    maxScore: number;
    rawScore: number;
  }>;
};

export function PanelSetupTab() {
  const scoreDetailsTeamRef = useRef<string | null>(null);
  const feedbackTeamRef = useRef<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreatingRound, setIsCreatingRound] = useState(false);
  const [isCreatingCriteria, setIsCreatingCriteria] = useState(false);
  const [isUpdatingRoundStatus, setIsUpdatingRoundStatus] = useState(false);
  const [isLoadingAssignments, setIsLoadingAssignments] = useState(false);
  const [isSavingAssignments, setIsSavingAssignments] = useState(false);
  const [isLoadingLeaderboard, setIsLoadingLeaderboard] = useState(false);
  const [isNormalizing, setIsNormalizing] = useState(false);
  const [isLoadingScoreDetails, setIsLoadingScoreDetails] = useState(false);
  const [isScoreDetailsOpen, setIsScoreDetailsOpen] = useState(false);
  const [isFeedbacksOpen, setIsFeedbacksOpen] = useState(false);
  const [isLoadingFeedbacks, setIsLoadingFeedbacks] = useState(false);
  const [feedbackTeam, setFeedbackTeam] = useState<LeaderboardRow | null>(null);
  const [mentorFeedbacks, setMentorFeedbacks] = useState<
    Array<{
      assignmentId: string;
      mentorName: string;
      mentorUsername: string;
      mentorRoundName: string;
      mentorRoundStatus: string;
      feedback: string | null;
    }>
  >([]);

  const [rounds, setRounds] = useState<PanelRound[]>([]);
  const [criteria, setCriteria] = useState<PanelCriteria[]>([]);
  const [panelistUsers, setPanelistUsers] = useState<PanelistUser[]>([]);
  const [allTeams, setAllTeams] = useState<TeamOption[]>([]);
  const [selectedPanelistUserId, setSelectedPanelistUserId] = useState("");
  const [selectedTeamIds, setSelectedTeamIds] = useState<string[]>([]);
  const [leaderboardRows, setLeaderboardRows] = useState<LeaderboardRow[]>([]);
  const [selectedLeaderboardTeam, setSelectedLeaderboardTeam] =
    useState<LeaderboardRow | null>(null);
  const [panelistScoreDetails, setPanelistScoreDetails] = useState<
    PanelistScoreDetail[]
  >([]);
  const [maxPerPanelist, setMaxPerPanelist] = useState(0);
  const [selectedRoundId, setSelectedRoundId] = useState("");
  const [showCumulativeLeaderboard, setShowCumulativeLeaderboard] =
    useState(false);
  const [leaderboardTrackFilter, setLeaderboardTrackFilter] = useState("all");

  const [newRoundName, setNewRoundName] = useState("");
  const [newCriteriaName, setNewCriteriaName] = useState("");
  const [newCriteriaMaxScore, setNewCriteriaMaxScore] = useState("10");

  const [tracks, setTracks] = useState<Array<{ id: string; name: string }>>([]);
  const [labs, setLabs] = useState<Array<{ id: string; name: string }>>([]);
  const [selectedTrackId, setSelectedTrackId] = useState("");
  const [selectedLabId, setSelectedLabId] = useState("");
  const [panelScoreHistory, setPanelScoreHistory] = useState<
    Array<{
      teamId: string | null;
      id: string;
      criteriaId: string;
      rawScore: number;
      roundAssignmentId: string;
    }>
  >([]);

  const filteredTeams = useMemo(() => {
    return allTeams.filter((team) => {
      if (selectedTrackId && team.trackId !== selectedTrackId) {
        return false;
      }
      if (selectedLabId && team.labId !== selectedLabId) {
        return false;
      }
      return true;
    });
  }, [allTeams, selectedTrackId, selectedLabId]);

  const selectedRound = useMemo(
    () => rounds.find((round) => round.id === selectedRoundId),
    [rounds, selectedRoundId],
  );
  const selectedPanelistUser = useMemo(
    () =>
      panelistUsers.find(
        (panelistUser) => panelistUser.id === selectedPanelistUserId,
      ),
    [panelistUsers, selectedPanelistUserId],
  );
  const canEditSelectedRound = selectedRound?.status === "Draft";
  const canManageAssignments = selectedRound?.status !== "Completed";

  const fetchRounds = async () => {
    const res = await fetch("/api/dashboard/panel/rounds");
    if (!res.ok) throw new Error("Failed to load panel rounds");
    const data = (await res.json()) as PanelRound[];
    setRounds(data);
    if (data.length > 0 && !selectedRoundId) {
      setSelectedRoundId(data[0].id);
    }
  };

  const fetchCriteria = async (roundId: string) => {
    if (!roundId) {
      setCriteria([]);
      return;
    }
    const res = await fetch(
      `/api/dashboard/panel/criteria?panelRoundId=${encodeURIComponent(roundId)}`,
    );
    if (!res.ok) throw new Error("Failed to load criteria");
    const data = (await res.json()) as PanelCriteria[];
    setCriteria(data);
  };

  const fetchAssignments = async (roundId: string, panelistUserId?: string) => {
    if (!roundId) {
      setPanelistUsers([]);
      setAllTeams([]);
      setSelectedTeamIds([]);
      return;
    }

    const params = new URLSearchParams({ panelRoundId: roundId });
    if (panelistUserId) {
      params.set("panelistUserId", panelistUserId);
    }

    setIsLoadingAssignments(true);
    const res = await fetch(
      `/api/dashboard/panel/assignments?${params.toString()}`,
    );
    setIsLoadingAssignments(false);

    if (!res.ok) throw new Error("Failed to load panel assignments");

    const data = (await res.json()) as {
      panelistUsers: PanelistUser[];
      teams: TeamOption[];
      assignedTeamIds: string[];
      history: Array<{
        teamId: string | null;
        id: string;
        criteriaId: string;
        rawScore: number;
        roundAssignmentId: string;
      }>;
    };

    setPanelistUsers(data.panelistUsers);
    setAllTeams(data.teams);
    setSelectedTeamIds(data.assignedTeamIds || []);
    setPanelScoreHistory(data.history || []);

    if (!selectedPanelistUserId && data.panelistUsers.length > 0) {
      setSelectedPanelistUserId(data.panelistUsers[0].id);
    }
  };

  const fetchLeaderboard = async (roundId: string) => {
    if (!roundId) {
      setLeaderboardRows([]);
      setMaxPerPanelist(0);
      return;
    }

    setIsLoadingLeaderboard(true);
    const params = new URLSearchParams({
      panelRoundId: roundId,
    });
    const res = await fetch(
      `/api/dashboard/panel/leaderboard?${params.toString()}`,
    );
    setIsLoadingLeaderboard(false);

    if (!res.ok) {
      throw new Error("Failed to load leaderboard");
    }

    const data = (await res.json()) as {
      maxPerPanelist: number;
      rows: LeaderboardRow[];
    };

    setMaxPerPanelist(data.maxPerPanelist || 0);
    setLeaderboardRows(data.rows || []);
  };

  const fetchLabs = async () => {
    const result = await apiFetch<Array<{ id: string; name: string }>>(
      "/api/dashboard/allocations?get=labs",
    );

    setLabs(result);
  };

  const fetchTracks = async () => {
    const response = await fetch("/api/tracks");
    if (!response.ok) {
      toast.error("Failed to load tracks");
      return;
    }

    const data = await response.json();
    setTracks(data as Array<{ id: string; name: string }>);
  };

  // biome-ignore lint/correctness/useExhaustiveDependencies: initial dashboard setup fetch
  useEffect(() => {
    const run = async () => {
      try {
        setIsLoading(true);
        await Promise.all([fetchRounds(), fetchTracks(), fetchLabs()]);
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Failed to load panel setup",
        );
      } finally {
        setIsLoading(false);
      }
    };
    run();
  }, []);

  // biome-ignore lint/correctness/useExhaustiveDependencies: round selection changes should reload criteria only
  useEffect(() => {
    setSelectedPanelistUserId("");
    const run = async () => {
      try {
        await fetchCriteria(selectedRoundId);
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Failed to load criteria",
        );
      }
    };
    run();
  }, [selectedRoundId]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: leaderboard should refresh when round changes
  useEffect(() => {
    setLeaderboardTrackFilter("all");
    const run = async () => {
      try {
        await fetchLeaderboard(selectedRoundId);
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Failed to load leaderboard",
        );
      }
    };
    run();
  }, [selectedRoundId]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: dedicated assignment loader for round/panelist selection
  useEffect(() => {
    const run = async () => {
      try {
        await fetchAssignments(
          selectedRoundId,
          selectedPanelistUserId || undefined,
        );
      } catch (error) {
        toast.error(
          error instanceof Error
            ? error.message
            : "Failed to load panel allocations",
        );
      }
    };
    run();
  }, [selectedRoundId, selectedPanelistUserId]);

  const handleCreateRound = async () => {
    if (!newRoundName.trim()) {
      toast.error("Round name is required");
      return;
    }

    try {
      setIsCreatingRound(true);
      const res = await fetch("/api/dashboard/panel/rounds", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newRoundName.trim() }),
      });

      if (!res.ok) {
        const data = (await res.json()) as { message?: string };
        throw new Error(data.message || "Failed to create round");
      }

      const created = (await res.json()) as PanelRound;
      setRounds((prev) =>
        [...prev, created].sort((a, b) => a.name.localeCompare(b.name)),
      );
      setSelectedRoundId(created.id);
      setNewRoundName("");
      toast.success("Panel round created");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to create round",
      );
    } finally {
      setIsCreatingRound(false);
    }
  };

  const handleCreateCriteria = async () => {
    if (!selectedRoundId) {
      toast.error("Select a panel round first");
      return;
    }
    if (!newCriteriaName.trim()) {
      toast.error("Criteria name is required");
      return;
    }

    const maxScore = Number(newCriteriaMaxScore);
    if (!Number.isInteger(maxScore) || maxScore < 1 || maxScore > 100) {
      toast.error("Max score must be an integer between 1 and 100");
      return;
    }

    try {
      setIsCreatingCriteria(true);
      const res = await fetch("/api/dashboard/panel/criteria", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          panelRoundId: selectedRoundId,
          criteriaName: newCriteriaName.trim(),
          maxScore,
        }),
      });

      if (!res.ok) {
        const data = (await res.json()) as { message?: string };
        throw new Error(data.message || "Failed to create criteria");
      }

      const created = (await res.json()) as PanelCriteria;
      setCriteria((prev) =>
        [...prev, created].sort((a, b) =>
          a.criteriaName.localeCompare(b.criteriaName),
        ),
      );
      setNewCriteriaName("");
      setNewCriteriaMaxScore("10");
      toast.success("Criteria created");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to create criteria",
      );
    } finally {
      setIsCreatingCriteria(false);
    }
  };

  const handleSetRoundStatus = async (
    status: "Draft" | "Active" | "Completed",
  ) => {
    if (!selectedRound) {
      toast.error("Select a panel round first");
      return;
    }

    try {
      setIsUpdatingRoundStatus(true);
      const res = await fetch("/api/dashboard/panel/rounds", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: selectedRound.id, status }),
      });

      if (!res.ok) {
        const data = (await res.json()) as { message?: string };
        throw new Error(data.message || "Failed to update round status");
      }

      const updated = (await res.json()) as PanelRound;
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

  const handleSaveAssignments = async () => {
    if (!selectedRoundId) {
      toast.error("Select a panel round first");
      return;
    }

    if (!selectedPanelistUserId) {
      toast.error("Select a panelist user first");
      return;
    }

    try {
      setIsSavingAssignments(true);
      const res = await fetch("/api/dashboard/panel/assignments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          panelRoundId: selectedRoundId,
          panelistUserId: selectedPanelistUserId,
          teamIds: selectedTeamIds,
        }),
      });

      if (!res.ok) {
        const data = (await res.json()) as { message?: string };
        throw new Error(data.message || "Failed to save team allocations");
      }

      toast.success("Team allocations updated");
      await fetchAssignments(selectedRoundId, selectedPanelistUserId);
      await fetchLeaderboard(selectedRoundId);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to save team allocations",
      );
    } finally {
      setIsSavingAssignments(false);
    }
  };

  const handleNormalizeRound = async () => {
    if (!selectedRoundId) {
      toast.error("Select a panel round first");
      return;
    }

    try {
      setIsNormalizing(true);
      const res = await fetch("/api/dashboard/panel/normalize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roundId: selectedRoundId }),
      });

      if (!res.ok) {
        const data = (await res.json()) as { message?: string };
        throw new Error(data.message || "Failed to normalize scores");
      }

      toast.success("Scores normalized and aggregated successfully");
      await fetchLeaderboard(selectedRoundId);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to normalize scores",
      );
    } finally {
      setIsNormalizing(false);
    }
  };

  const handleOpenScoreDetails = async (teamRow: LeaderboardRow) => {
    if (!selectedRoundId) return;

    scoreDetailsTeamRef.current = teamRow.teamId;

    try {
      setIsLoadingScoreDetails(true);
      setSelectedLeaderboardTeam(teamRow);
      setPanelistScoreDetails([]);
      setIsScoreDetailsOpen(true);

      const res = await fetch(
        `/api/dashboard/panel/leaderboard/details?panelRoundId=${encodeURIComponent(selectedRoundId)}&teamId=${encodeURIComponent(teamRow.teamId)}`,
      );

      if (scoreDetailsTeamRef.current !== teamRow.teamId) return;

      if (!res.ok) {
        const data = (await res.json()) as { message?: string };
        throw new Error(
          data.message || "Failed to load panelist score details",
        );
      }

      const data = (await res.json()) as {
        panelists: PanelistScoreDetail[];
      };
      setPanelistScoreDetails(data.panelists || []);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to load panelist score details",
      );
      setIsScoreDetailsOpen(false);
    } finally {
      if (scoreDetailsTeamRef.current === teamRow.teamId) {
        setIsLoadingScoreDetails(false);
      }
    }
  };

  const handleOpenFeedbacks = async (teamRow: LeaderboardRow) => {
    feedbackTeamRef.current = teamRow.teamId;

    try {
      setIsLoadingFeedbacks(true);
      setFeedbackTeam(teamRow);
      setMentorFeedbacks([]);
      setIsFeedbacksOpen(true);

      const res = await fetch(
        `/api/dashboard/mentor/history?teamId=${encodeURIComponent(teamRow.teamId)}`,
      );

      if (feedbackTeamRef.current !== teamRow.teamId) return;

      if (!res.ok) {
        const data = (await res.json()) as { message?: string };
        throw new Error(data.message || "Failed to load mentor feedbacks");
      }

      const data = (await res.json()) as Array<{
        assignmentId: string;
        mentorName: string;
        mentorUsername: string;
        mentorRoundName: string;
        mentorRoundStatus: string;
        feedback: string | null;
      }>;
      setMentorFeedbacks(data.filter((f) => f.feedback?.trim()));
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to load mentor feedbacks",
      );
      setIsFeedbacksOpen(false);
    } finally {
      if (feedbackTeamRef.current === teamRow.teamId) {
        setIsLoadingFeedbacks(false);
      }
    }
  };

  const handleSelectVisible = () => {
    if (filteredTeams.length === 0) return;
    const allVisibleSelected = filteredTeams.every((t) =>
      selectedTeamIds.includes(t.id),
    );
    if (allVisibleSelected) {
      setSelectedTeamIds((prev) =>
        prev.filter((id) => !filteredTeams.some((t) => t.id === id)),
      );
    } else {
      setSelectedTeamIds((prev) => [
        ...prev,
        ...filteredTeams.map((t) => t.id).filter((id) => !prev.includes(id)),
      ]);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Panel Setup</h2>
        <p className="text-muted-foreground">
          Create panel rounds and configure criteria with max point allocation.
        </p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center rounded-md border p-8">
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Loading panel setup...
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2 2xl:grid-cols-3">
          <Card>
            <CardContent className="space-y-4">
              <div>
                <CardTitle className="mb-2">Create Panel Round</CardTitle>
                <CardDescription>
                  Create a round first, then add scoring criteria to it.
                </CardDescription>
              </div>

              <div className="flex gap-2">
                <Input
                  value={newRoundName}
                  onChange={(e) => setNewRoundName(e.target.value)}
                  placeholder="Round name"
                />
                <Button onClick={handleCreateRound} disabled={isCreatingRound}>
                  {isCreatingRound ? "Creating..." : "Create Round"}
                </Button>
              </div>

              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  Available rounds
                </p>
                <div className="flex flex-wrap gap-2">
                  {rounds.length === 0 ? (
                    <span className="text-sm text-muted-foreground">
                      No rounds yet.
                    </span>
                  ) : (
                    rounds.map((round) => (
                      <Badge key={round.id} variant="secondary">
                        {round.name} ({round.status})
                      </Badge>
                    ))
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="space-y-4">
              <div>
                <CardTitle className="mb-2">Create Criteria</CardTitle>
                <CardDescription>
                  Add criteria and max score for the selected panel round.
                </CardDescription>
              </div>

              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Panel round</p>
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

              {selectedRound ? (
                <div className="space-y-3 rounded-md border p-3">
                  <div>
                    <p className="text-sm font-medium">Round status</p>
                    <p className="text-xs text-muted-foreground">
                      {selectedRound.status === "Draft"
                        ? "Draft rounds can be edited. Lock by moving to Active."
                        : "This round is locked for criteria edits."}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="secondary">{selectedRound.status}</Badge>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleSetRoundStatus("Draft")}
                      disabled={
                        isUpdatingRoundStatus ||
                        selectedRound.status === "Draft"
                      }
                    >
                      Draft
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleSetRoundStatus("Active")}
                      disabled={
                        isUpdatingRoundStatus ||
                        selectedRound.status === "Active"
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

              <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                <div className="sm:col-span-2">
                  <Input
                    value={newCriteriaName}
                    onChange={(e) => setNewCriteriaName(e.target.value)}
                    placeholder="Criteria name"
                  />
                </div>
                <div>
                  <Input
                    type="number"
                    min={1}
                    max={100}
                    value={newCriteriaMaxScore}
                    onChange={(e) => setNewCriteriaMaxScore(e.target.value)}
                    placeholder="Max score"
                  />
                </div>
              </div>

              <Button
                onClick={handleCreateCriteria}
                disabled={
                  isCreatingCriteria ||
                  !selectedRoundId ||
                  !canEditSelectedRound
                }
              >
                {isCreatingCriteria ? "Saving..." : "Add Criteria"}
              </Button>

              {!canEditSelectedRound && selectedRound ? (
                <p className="text-xs text-amber-600">
                  Round is locked. Switch it back to Draft to add or edit
                  criteria.
                </p>
              ) : null}

              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  Criteria for {selectedRound?.name || "selected round"}
                </p>
                {criteria.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No criteria added yet for this round.
                  </p>
                ) : (
                  <div className="rounded-md border">
                    {criteria.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between border-b px-3 py-2 last:border-b-0"
                      >
                        <span className="text-sm font-medium">
                          {item.criteriaName}
                        </span>
                        <Badge variant="outline">Max: {item.maxScore}</Badge>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="space-y-4">
              <div>
                <CardTitle className="mb-2">Panelist Team Allocation</CardTitle>
                <CardDescription>
                  Select teams allocated to each panelist user for this round.
                </CardDescription>
              </div>

              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Panelist user</p>
                <Select
                  value={selectedPanelistUserId}
                  onValueChange={setSelectedPanelistUserId}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select panelist user" />
                  </SelectTrigger>
                  <SelectContent>
                    {panelistUsers.map((panelistUser) => (
                      <SelectItem key={panelistUser.id} value={panelistUser.id}>
                        {panelistUser.name} ({panelistUser.username})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 space-x-1">
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Lab</p>
                  <Select
                    value={selectedLabId}
                    onValueChange={setSelectedLabId}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select lab" />
                    </SelectTrigger>
                    <SelectContent>
                      {labs.map((lab) => (
                        <SelectItem key={lab.id} value={lab.id}>
                          {lab.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Track</p>
                  <Select
                    value={selectedTrackId}
                    onValueChange={setSelectedTrackId}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select track" />
                    </SelectTrigger>
                    <SelectContent>
                      {tracks.map((track) => (
                        <SelectItem key={track.id} value={track.id}>
                          {track.name}
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
                <div className="max-h-56 overflow-y-auto rounded-md border p-3">
                  {filteredTeams.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      No teams available.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {filteredTeams.map((team) => {
                        const checked = selectedTeamIds.includes(team.id);
                        return (
                          <label
                            key={team.id}
                            htmlFor={`panel-team-${team.id}`}
                            className="flex cursor-pointer items-center gap-2 text-sm"
                          >
                            <Checkbox
                              id={`panel-team-${team.id}`}
                              checked={checked}
                              onCheckedChange={(value) =>
                                toggleTeamSelection(team.id, value === true)
                              }
                              disabled={!canManageAssignments}
                            />
                            <div className="w-full flex justify-between items-center">
                              <span>{team.name}</span>
                              <span>
                                {
                                  panelScoreHistory.filter(
                                    (h) => h.teamId === team.id,
                                  ).length
                                }
                              </span>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              <div className="flex justify-start flex-col items-start gap-2">
                <p className="text-xs text-muted-foreground">
                  {selectedPanelistUser
                    ? `${selectedTeamIds.length} teams selected for ${selectedPanelistUser.name}`
                    : "Select a panelist user"}
                </p>
                <div className="grid grid-cols-2 gap-2 w-full">
                  <Button variant={"outline"} onClick={handleSelectVisible}>
                    {selectedTeamIds.length === filteredTeams.length
                      ? "Deselect All"
                      : "Select Visible"}
                  </Button>
                  <Button
                    onClick={handleSaveAssignments}
                    disabled={
                      !selectedRoundId ||
                      !selectedPanelistUserId ||
                      isSavingAssignments ||
                      !canManageAssignments
                    }
                  >
                    {isSavingAssignments ? "Saving..." : "Save Allocation"}
                  </Button>
                </div>
              </div>

              {!canManageAssignments && selectedRound ? (
                <p className="text-xs text-amber-600">
                  Round is completed. Team allocation is locked.
                </p>
              ) : null}
            </CardContent>
          </Card>

          <Card className="xl:col-span-3">
            <CardContent className="space-y-4">
              <div>
                <CardTitle className="mb-2">Leaderboard</CardTitle>
                <div className="flex justify-between items-start gap-4">
                  <CardDescription>
                    Ranking for the selected round based on panel scores. Judge
                    Z-Score column shows cumulative normalized score from all
                    judge rounds.
                  </CardDescription>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleNormalizeRound}
                      disabled={!selectedRoundId || isNormalizing}
                    >
                      {isNormalizing && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      {isNormalizing
                        ? "Processing..."
                        : "Normalize & Aggregate"}
                    </Button>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between gap-4">
                <div className="text-xs text-muted-foreground">
                  Max score per panelist for this round: {maxPerPanelist}
                </div>
                {tracks.length > 0 && (
                  <Select
                    value={leaderboardTrackFilter}
                    onValueChange={setLeaderboardTrackFilter}
                  >
                    <SelectTrigger className="h-8 w-48 text-xs">
                      <SelectValue placeholder="All Tracks" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Tracks</SelectItem>
                      {tracks.map((track) => (
                        <SelectItem key={track.id} value={track.id}>
                          {track.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>

              {leaderboardRows.length === 0 && isLoadingLeaderboard ? (
                <div className="flex items-center text-sm text-muted-foreground">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Loading leaderboard...
                </div>
              ) : leaderboardRows.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No leaderboard data available for this round yet.
                </p>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Rank</TableHead>
                        <TableHead>Team</TableHead>
                        <TableHead>Raw Total</TableHead>
                        <TableHead>Max Possible</TableHead>
                        <TableHead>Panelists</TableHead>
                        <TableHead>Panel Z-Score</TableHead>
                        <TableHead>Judge Z-Score</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {leaderboardRows.filter((row) =>
                        leaderboardTrackFilter !== "all"
                          ? row.trackId === leaderboardTrackFilter
                          : true,
                      ).map((row) => (
                        <TableRow key={row.teamId}>
                          <TableCell>{row.rank}</TableCell>
                          <TableCell className="font-medium">
                            {row.teamName}
                          </TableCell>
                          <TableCell>{row.rawTotalScore}</TableCell>
                          <TableCell>{row.maxPossibleScore}</TableCell>
                          <TableCell>{row.panelistCount}</TableCell>
                          <TableCell className="font-medium">
                            {((row.normalizedTotalScore || 0) >= 0 ? "+" : "") +
                              (row.normalizedTotalScore || 0).toFixed(3)}
                          </TableCell>
                          <TableCell className="font-medium">
                            {((row.judgeNormalizedTotal || 0) >= 0 ? "+" : "") +
                              (row.judgeNormalizedTotal || 0).toFixed(3)}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                size="icon-sm"
                                variant="ghost"
                                onClick={() => handleOpenScoreDetails(row)}
                                aria-label={`View panelist scores for ${row.teamName}`}
                                title="View Scores"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                size="icon-sm"
                                variant="ghost"
                                onClick={() => handleOpenFeedbacks(row)}
                                aria-label={`View mentor feedbacks for ${row.teamName}`}
                                title="View Feedbacks"
                              >
                                <MessageSquare className="h-4 w-4" />
                              </Button>
                            </div>
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
      )}

      <Dialog open={isScoreDetailsOpen} onOpenChange={setIsScoreDetailsOpen}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Panelist Score Breakdown
              {selectedLeaderboardTeam
                ? ` - ${selectedLeaderboardTeam.teamName}`
                : ""}
            </DialogTitle>
            <DialogDescription>
              Detailed criteria-wise score given by each panelist for the
              selected team.
            </DialogDescription>
          </DialogHeader>

          {isLoadingScoreDetails ? (
            <div className="flex items-center text-sm text-muted-foreground">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Loading score details...
            </div>
          ) : panelistScoreDetails.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No panelist score details found for this team.
            </p>
          ) : (
            <div className="space-y-4">
              {panelistScoreDetails.map((panelistDetail) => (
                <div
                  key={panelistDetail.assignmentId}
                  className="rounded-md border"
                >
                  <div className="flex items-center justify-between border-b px-4 py-3">
                    <div>
                      <p className="text-sm font-semibold">
                        {panelistDetail.panelistName}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        @{panelistDetail.panelistUsername}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">
                        {panelistDetail.totalRawScore} /{" "}
                        {panelistDetail.totalMaxScore}
                      </Badge>
                      <Badge variant="outline">
                        {panelistDetail.normalizedTotalScore != null
                          ? panelistDetail.normalizedTotalScore.toFixed(3)
                          : "—"}
                      </Badge>
                    </div>
                  </div>

                  <div className="p-3">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Criteria</TableHead>
                          <TableHead className="text-right">Score</TableHead>
                          <TableHead className="text-right">Max</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {panelistDetail.criteriaScores.map((criterion) => (
                          <TableRow
                            key={`${panelistDetail.assignmentId}-${criterion.criteriaId}`}
                          >
                            <TableCell>{criterion.criteriaName}</TableCell>
                            <TableCell className="text-right">
                              {criterion.rawScore}
                            </TableCell>
                            <TableCell className="text-right">
                              {criterion.maxScore}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={isFeedbacksOpen} onOpenChange={setIsFeedbacksOpen}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Mentor Feedbacks
              {feedbackTeam ? ` - ${feedbackTeam.teamName}` : ""}
            </DialogTitle>
            <DialogDescription>
              All mentor feedback across rounds for this team.
            </DialogDescription>
          </DialogHeader>

          {isLoadingFeedbacks ? (
            <div className="flex items-center text-sm text-muted-foreground">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Loading feedbacks...
            </div>
          ) : mentorFeedbacks.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No mentor feedbacks found for this team.
            </p>
          ) : (
            <div className="space-y-3">
              {mentorFeedbacks.map((fb, idx) => (
                <div
                  key={`${fb.assignmentId}-${idx}`}
                  className="rounded-md border"
                >
                  <div className="flex items-center justify-between border-b px-4 py-2">
                    <div>
                      <p className="text-sm font-semibold">{fb.mentorName}</p>
                      <p className="text-xs text-muted-foreground">
                        @{fb.mentorUsername}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{fb.mentorRoundName}</Badge>
                      <Badge variant="secondary">{fb.mentorRoundStatus}</Badge>
                    </div>
                  </div>
                  <div className="px-4 py-3">
                    <p className="text-sm whitespace-pre-wrap">{fb.feedback}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

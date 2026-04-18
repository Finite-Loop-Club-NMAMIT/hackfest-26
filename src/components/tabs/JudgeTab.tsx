"use client";

import { Loader2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { cn } from "~/lib/utils";

type Allocation = {
  assignmentId: string;
  teamId: string;
  teamNo: number | null;
  teamName: string;
  teamStage: string;
  paymentStatus: string | null;
  roundId: string;
  roundName: string;
  roundStatus: "Draft" | "Active" | "Completed";
  pptUrl: string | null;
  trackName: string | null;
  scoredCriteria: number;
  totalCriteria: number;
  totalRawScore: number;
  totalMaxScore: number;
};

type ScoreCriterion = {
  id: string;
  criteriaName: string;
  maxScore: number;
  rawScore: number | null;
};

type ScorePayload = {
  assignmentId: string;
  roundStatus: "Draft" | "Active" | "Completed";
  criteria: ScoreCriterion[];
};

export function JudgeTab() {
  const [isLoading, setIsLoading] = useState(true);
  const [allocations, setAllocations] = useState<Allocation[]>([]);
  const [isLoadingScores, setIsLoadingScores] = useState(false);
  const [isSavingScores, setIsSavingScores] = useState(false);
  const [selectedRoundId, setSelectedRoundId] = useState("");
  const [selectedTeamNumber, setSelectedTeamNumber] = useState(1);
  const [scorePayload, setScorePayload] = useState<ScorePayload | null>(null);

  const roundOptions = useMemo(() => {
    const uniqueRounds = new Map<
      string,
      { id: string; name: string; status: Allocation["roundStatus"] }
    >();

    for (const allocation of allocations) {
      if (!uniqueRounds.has(allocation.roundId)) {
        uniqueRounds.set(allocation.roundId, {
          id: allocation.roundId,
          name: allocation.roundName,
          status: allocation.roundStatus,
        });
      }
    }

    return Array.from(uniqueRounds.values());
  }, [allocations]);

  const teamsInSelectedRound = useMemo(() => {
    const roundAllocations = allocations.filter(
      (allocation) => allocation.roundId === selectedRoundId,
    );

    return roundAllocations.map((allocation, index) => ({
      ...allocation,
      teamNumber: allocation.teamNo ?? index + 1,
    }));
  }, [allocations, selectedRoundId]);

  const selectedAllocation = useMemo(() => {
    return (
      teamsInSelectedRound.find(
        (allocation) => allocation.teamNumber === selectedTeamNumber,
      ) ?? null
    );
  }, [teamsInSelectedRound, selectedTeamNumber]);

  const fetchAllocations = async () => {
    const res = await fetch("/api/dashboard/judge/my-allocations");
    if (!res.ok) {
      setAllocations([]);
      return;
    }

    const data = (await res.json()) as Allocation[];
    setAllocations(data);
  };

  const loadTeamScores = useCallback(
    async (allocation: typeof selectedAllocation) => {
      if (!allocation) return;

      setIsLoadingScores(true);

      try {
        const res = await fetch(
          `/api/dashboard/judge/scores?assignmentId=${encodeURIComponent(allocation.assignmentId)}`,
        );

        if (!res.ok) {
          const data = (await res.json()) as { message?: string };
          throw new Error(data.message || "Failed to load score criteria");
        }

        const payload = (await res.json()) as ScorePayload;
        setScorePayload(payload);
      } catch (error) {
        toast.error(
          error instanceof Error
            ? error.message
            : "Failed to load score criteria",
        );
        setScorePayload(null);
      } finally {
        setIsLoadingScores(false);
      }
    },
    [],
  );

  // biome-ignore lint/correctness/useExhaustiveDependencies: initial fetch
  useEffect(() => {
    const run = async () => {
      try {
        setIsLoading(true);
        await fetchAllocations();
      } finally {
        setIsLoading(false);
      }
    };
    run();
  }, []);

  useEffect(() => {
    if (roundOptions.length === 0) {
      setSelectedRoundId("");
      return;
    }

    if (!roundOptions.some((round) => round.id === selectedRoundId)) {
      setSelectedRoundId(roundOptions[0]?.id ?? "");
    }
  }, [roundOptions, selectedRoundId]);

  useEffect(() => {
    if (teamsInSelectedRound.length === 0) {
      return;
    }

    const isValidTeam = teamsInSelectedRound.some(
      (t) => t.teamNumber === selectedTeamNumber,
    );

    if (!isValidTeam) {
      setSelectedTeamNumber(teamsInSelectedRound[0].teamNumber);
    }
  }, [teamsInSelectedRound, selectedTeamNumber]);

  useEffect(() => {
    const run = async () => {
      if (!selectedAllocation) {
        setScorePayload(null);
        return;
      }

      try {
        await loadTeamScores(selectedAllocation);
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Failed to load scores",
        );
        setScorePayload(null);
      }
    };

    run();
  }, [loadTeamScores, selectedAllocation]);

  const updateCriterionScore = (criteriaId: string, value: string) => {
    if (!scorePayload) return;

    const parsed = value === "" ? 0 : Number(value);
    setScorePayload({
      ...scorePayload,
      criteria: scorePayload.criteria.map((criterion) =>
        criterion.id === criteriaId
          ? {
              ...criterion,
              rawScore: Number.isFinite(parsed) ? parsed : criterion.rawScore,
            }
          : criterion,
      ),
    });
  };

  const handleSaveScores = async () => {
    if (!scorePayload) return;

    for (const criterion of scorePayload.criteria) {
      const score = criterion.rawScore ?? 0;
      if (!Number.isInteger(score) || score < 0) {
        toast.error("Scores must be non-negative integers");
        return;
      }
      if (score > criterion.maxScore) {
        toast.error(
          `${criterion.criteriaName} score cannot exceed ${criterion.maxScore}`,
        );
        return;
      }
    }

    try {
      setIsSavingScores(true);
      const res = await fetch("/api/dashboard/judge/scores", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assignmentId: scorePayload.assignmentId,
          scores: scorePayload.criteria.map((criterion) => ({
            criteriaId: criterion.id,
            rawScore: criterion.rawScore ?? 0,
          })),
        }),
      });

      if (!res.ok) {
        const data = (await res.json()) as { message?: string };
        throw new Error(data.message || "Failed to save scores");
      }

      toast.success("Scores saved successfully");
      await fetchAllocations();

      // Reload current team to get updated criteria count reflection
      if (selectedAllocation) {
        await loadTeamScores(selectedAllocation);
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to save scores",
      );
    } finally {
      setIsSavingScores(false);
    }
  };

  const currentTeamIndex = teamsInSelectedRound.findIndex(
    (t) => t.teamNumber === selectedTeamNumber,
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Judging Interface</h2>
        <p className="text-muted-foreground">
          Review allocated teams by round, switch using team number, and submit
          scores in a single workspace.
        </p>
      </div>

      {isLoading ? (
        <div className="flex items-center text-sm text-muted-foreground">
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Loading assigned teams...
        </div>
      ) : roundOptions.length === 0 ? (
        <div className="rounded-md border p-4 text-sm text-muted-foreground">
          No teams are allocated to your judge account yet.
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-3 xl:grid-cols-[minmax(240px,340px)_minmax(0,1fr)]">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Round</CardTitle>
                <CardDescription>Select which round to judge.</CardDescription>
              </CardHeader>
              <CardContent>
                <Select
                  value={selectedRoundId}
                  onValueChange={setSelectedRoundId}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select round" />
                  </SelectTrigger>
                  <SelectContent>
                    {roundOptions.map((round) => (
                      <SelectItem key={round.id} value={round.id}>
                        {round.name} ({round.status})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">
                  Team IDs ({selectedTeamNumber})
                </CardTitle>
                <CardDescription>Pick a team number directly.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setSelectedTeamNumber(
                        teamsInSelectedRound[currentTeamIndex - 1].teamNumber,
                      )
                    }
                    disabled={currentTeamIndex <= 0}
                  >
                    Prev
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setSelectedTeamNumber(
                        teamsInSelectedRound[currentTeamIndex + 1].teamNumber,
                      )
                    }
                    disabled={
                      currentTeamIndex === -1 ||
                      currentTeamIndex >= teamsInSelectedRound.length - 1
                    }
                  >
                    Next
                  </Button>
                </div>

                <div className="rounded-md border p-2">
                  <div className="flex max-w-full flex-wrap gap-1">
                    {teamsInSelectedRound.length === 0 ? (
                      <span className="text-xs text-muted-foreground">
                        No teams in this round
                      </span>
                    ) : (
                      teamsInSelectedRound.map((team) => (
                        <Button
                          key={team.assignmentId}
                          type="button"
                          size="sm"
                          variant={
                            team.teamNumber === selectedTeamNumber
                              ? "default"
                              : "outline"
                          }
                          className={cn(
                            "h-7 min-w-8 px-2",
                            team.scoredCriteria > 0 &&
                              "rounded-none border-green-600 bg-green-600 font-bold text-white hover:bg-green-700 dark:bg-green-600 dark:hover:bg-green-700",
                          )}
                          onClick={() => setSelectedTeamNumber(team.teamNumber)}
                        >
                          {team.teamNumber}
                        </Button>
                      ))
                    )}
                  </div>
                </div>

                {selectedAllocation ? (
                  <div className="text-sm">
                    <span className="text-muted-foreground mr-1">
                      Team {selectedAllocation.teamNumber}:
                    </span>
                    <span className="font-semibold text-primary">
                      {selectedAllocation.teamName}
                    </span>
                    {selectedAllocation.trackName && (
                      <span className="ml-2 inline-flex items-center rounded-md bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                        {selectedAllocation.trackName}
                      </span>
                    )}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    No team available for selected round
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          {!selectedAllocation ? (
            <div className="rounded-md border p-4 text-sm text-muted-foreground">
              No team available for the selected round.
            </div>
          ) : (
            <div className="grid min-h-[50vh] grid-cols-1 gap-6 xl:grid-cols-2">
              <Card className="h-full">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-xl text-primary">
                        {selectedAllocation.teamName}
                      </CardTitle>
                      <CardDescription>
                        Team {selectedAllocation.teamNumber}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary">
                      {selectedAllocation.roundStatus}
                    </Badge>
                    <Badge variant="outline">
                      {selectedAllocation.scoredCriteria > 0
                        ? `Scored ${selectedAllocation.scoredCriteria}/${selectedAllocation.totalCriteria} Criteria`
                        : "No Scores Entered"}
                    </Badge>
                    {selectedAllocation.trackName && (
                      <Badge
                        variant="default"
                        className="bg-primary/20 text-primary hover:bg-primary/30"
                      >
                        {selectedAllocation.trackName}
                      </Badge>
                    )}
                  </div>

                  <div className="space-y-2 mt-6">
                    <p className="text-sm font-medium">Resources</p>
                    <div className="rounded-md border p-4 text-center">
                      {selectedAllocation.pptUrl ? (
                        <a
                          href={selectedAllocation.pptUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90"
                        >
                          View Pitch Deck / PPT
                        </a>
                      ) : (
                        <span className="text-sm text-muted-foreground">
                          No PPT submitted by team.
                        </span>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="h-full w-full">
                <CardHeader>
                  <div className="flex flex-col w-full items-center justify-center">
                    <div>Team No</div>
                    <div className="text-6xl">
                      {selectedAllocation.teamNumber}
                    </div>
                  </div>
                  <CardTitle>Score Entry</CardTitle>
                  <CardDescription>
                    Enter criteria-wise scores for {selectedAllocation.teamName}
                    .
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-4">
                  {isLoadingScores ? (
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Loading criteria...
                    </div>
                  ) : !scorePayload ? (
                    <div className="rounded-md border p-3 text-sm text-muted-foreground">
                      No score data available.
                    </div>
                  ) : (
                    <>
                      {scorePayload.roundStatus === "Completed" ? (
                        <div className="rounded-md border border-amber-500/40 bg-amber-500/10 p-3 text-sm text-amber-700">
                          This round is completed. Scores are locked.
                        </div>
                      ) : null}

                      {scorePayload.criteria.length === 0 ? (
                        <p className="text-sm text-muted-foreground">
                          No criteria configured for this round.
                        </p>
                      ) : (
                        <div className="space-y-3">
                          {scorePayload.criteria.map((criterion) => (
                            <div
                              key={criterion.id}
                              className="grid grid-cols-1 gap-2 rounded-md border p-3 sm:grid-cols-5"
                            >
                              <div className="sm:col-span-3">
                                <p className="text-sm font-medium">
                                  {criterion.criteriaName}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  Max score: {criterion.maxScore}
                                </p>
                              </div>
                              <div className="sm:col-span-2">
                                <Input
                                  type="number"
                                  min={0}
                                  max={criterion.maxScore}
                                  step={1}
                                  value={criterion.rawScore ?? ""}
                                  onChange={(e) =>
                                    updateCriterionScore(
                                      criterion.id,
                                      e.target.value,
                                    )
                                  }
                                  disabled={
                                    scorePayload.roundStatus === "Completed"
                                  }
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {scorePayload.roundStatus !== "Completed" &&
                        scorePayload.criteria.length > 0 && (
                          <div className="flex justify-end pt-4">
                            <Button
                              onClick={handleSaveScores}
                              disabled={isSavingScores}
                              className="w-full sm:w-auto"
                            >
                              {isSavingScores ? "Saving..." : "Save Scores"}
                            </Button>
                          </div>
                        )}
                    </>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

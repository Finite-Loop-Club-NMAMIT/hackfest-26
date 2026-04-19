"use client";

import { 
  CheckCircle2, 
  ChevronLeft, 
  ChevronRight, 
  Loader2, 
  Presentation,
  Save,
  Trophy
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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

export function PanelTab() {
  const scoreAbortRef = useRef<AbortController | null>(null);
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
    const res = await fetch("/api/dashboard/panel/my-allocations");
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

      scoreAbortRef.current?.abort();
      scoreAbortRef.current = new AbortController();
      const { signal } = scoreAbortRef.current;

      setIsLoadingScores(true);

      try {
        const res = await fetch(
          `/api/dashboard/panel/scores?assignmentId=${encodeURIComponent(allocation.assignmentId)}`,
          { signal },
        );

        if (!res.ok) {
          const data = (await res.json()) as { message?: string };
          throw new Error(data.message || "Failed to load score criteria");
        }

        const payload = (await res.json()) as ScorePayload;
        setScorePayload(payload);
      } catch (error) {
        if (error instanceof Error && error.name === "AbortError") return;
        toast.error(
          error instanceof Error
            ? error.message
            : "Failed to load score criteria",
        );
        setScorePayload(null);
      } finally {
        if (!signal.aborted) setIsLoadingScores(false);
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

  const updateCriterionScore = (
    criteriaId: string,
    value: string,
    maxScore: number,
  ) => {
    if (!scorePayload) return;

    if (value !== "" && !/^\d+$/.test(value)) return;

    const parsed = value === "" ? null : parseInt(value, 10);

    if (parsed !== null && parsed > maxScore) {
      toast.error(`Score cannot exceed ${maxScore}`);
      return;
    }

    setScorePayload({
      ...scorePayload,
      criteria: scorePayload.criteria.map((criterion) =>
        criterion.id === criteriaId
          ? { ...criterion, rawScore: parsed }
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
      const res = await fetch("/api/dashboard/panel/scores", {
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
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col gap-4 border-b pb-6 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">
            Panel Workspace
          </h2>
          <p className="text-muted-foreground mt-1">
            Review your allocated teams, check resources, and submit scores.
          </p>
        </div>
        {roundOptions.length > 0 && (
          <div className="w-full md:w-72">
            <Select
              value={selectedRoundId}
              onValueChange={setSelectedRoundId}
            >
              <SelectTrigger className="w-full bg-background">
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
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="flex h-40 items-center justify-center rounded-lg border border-dashed text-sm text-muted-foreground">
          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          Loading assigned teams...
        </div>
      ) : roundOptions.length === 0 ? (
        <div className="flex h-40 flex-col items-center justify-center rounded-lg border border-dashed text-center text-sm text-muted-foreground">
          <Trophy className="mb-2 h-8 w-8 text-muted-foreground/50" />
          <p>No teams are allocated to your panelist account yet.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Team Selector Navigation */}
          <div className="rounded-xl border bg-card p-4 sm:p-6 shadow-sm">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-4">
              <div className="space-y-1">
                <h3 className="text-lg font-semibold leading-none text-foreground">
                  Assigned Teams
                </h3>
                <p className="text-sm text-muted-foreground">
                  Select a team below or use next/prev to navigate.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setSelectedTeamNumber(
                      teamsInSelectedRound[currentTeamIndex - 1]?.teamNumber,
                    )
                  }
                  disabled={currentTeamIndex <= 0}
                  className="h-9 px-4"
                >
                  <ChevronLeft className="mr-1 h-4 w-4" /> Prev
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setSelectedTeamNumber(
                      teamsInSelectedRound[currentTeamIndex + 1]?.teamNumber,
                    )
                  }
                  disabled={
                    currentTeamIndex === -1 ||
                    currentTeamIndex >= teamsInSelectedRound.length - 1
                  }
                  className="h-9 px-4"
                >
                  Next <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {teamsInSelectedRound.length === 0 ? (
                <span className="text-sm text-muted-foreground italic">
                  No teams found for this round.
                </span>
              ) : (
                teamsInSelectedRound.map((team) => {
                  const isSelected = team.teamNumber === selectedTeamNumber;
                  const isScored = team.scoredCriteria > 0;
                  
                  return (
                    <Button
                      key={team.assignmentId}
                      type="button"
                      variant={isSelected ? "default" : "outline"}
                      className={cn(
                        "h-10 min-w-12 transition-all duration-200",
                        isSelected
                          ? "shadow-md ring-2 ring-primary ring-offset-2 ring-offset-background"
                          : isScored
                            ? "border-green-500/40 bg-green-500/10 text-green-700 hover:bg-green-500/20 dark:text-green-400 dark:bg-green-500/20 dark:hover:bg-green-500/30"
                            : "hover:bg-muted"
                      )}
                      onClick={() => setSelectedTeamNumber(team.teamNumber)}
                    >
                      {isScored && !isSelected && (
                        <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />
                      )}
                      {team.teamNumber}
                    </Button>
                  );
                })
              )}
            </div>
          </div>

          {!selectedAllocation ? (
            <div className="flex h-40 items-center justify-center rounded-lg border border-dashed text-sm text-muted-foreground">
              No team available for the selected round.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
              {/* Left Column: Team Details */}
              <div className="lg:col-span-4 space-y-6">
                <Card className="shadow-md border-border/60 overflow-hidden">
                  <CardHeader className="space-y-4 pb-4">
                    <div className="space-y-1.5">
                      <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                        Team {selectedAllocation.teamNumber}
                      </p>
                      <CardTitle className="text-2xl font-bold text-foreground">
                        {selectedAllocation.teamName}
                      </CardTitle>
                    </div>
                    
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="secondary" className="px-2.5 py-0.5 text-xs font-semibold">
                        {selectedAllocation.roundStatus}
                      </Badge>
                      <Badge 
                        variant="outline" 
                        className={cn(
                          "px-2.5 py-0.5 text-xs font-semibold",
                          selectedAllocation.scoredCriteria > 0 && "border-green-500 text-green-600 dark:text-green-500"
                        )}
                      >
                        {selectedAllocation.scoredCriteria > 0
                          ? `Scored ${selectedAllocation.scoredCriteria}/${selectedAllocation.totalCriteria} Criteria`
                          : "No Scores Entered"}
                      </Badge>
                      {selectedAllocation.trackName && (
                        <Badge
                          variant="default"
                          className="bg-primary/10 text-primary hover:bg-primary/20 border-transparent"
                        >
                          {selectedAllocation.trackName}
                        </Badge>
                      )}
                    </div>
                  </CardHeader>

                  <CardContent className="pt-0">
                    <div className="mt-4 space-y-3">
                      <p className="text-sm font-semibold text-foreground">Resources</p>
                      {selectedAllocation.pptUrl ? (
                        <a
                          href={selectedAllocation.pptUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="group flex w-full items-center justify-center gap-2 rounded-xl border border-primary/20 bg-primary/5 px-4 py-4 text-sm font-semibold text-primary transition-all hover:bg-primary hover:text-primary-foreground hover:shadow-md"
                        >
                          <Presentation className="h-5 w-5 transition-transform group-hover:scale-110" />
                          View Pitch Deck / PPT
                        </a>
                      ) : (
                        <div className="flex h-24 flex-col items-center justify-center rounded-xl border border-dashed bg-muted/40 text-center text-sm text-muted-foreground">
                          <Presentation className="mb-2 h-6 w-6 opacity-30" />
                          <p>No presentation submitted.</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Right Column: Scoring Entry */}
              <div className="lg:col-span-8">
                <Card className="h-full shadow-md border-border/60 flex flex-col">
                  <CardHeader className="border-b border-border/40 bg-muted/20 pb-5">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <CardTitle className="text-xl">Score Entry</CardTitle>
                        <CardDescription>
                          Evaluate <span className="font-semibold text-foreground">{selectedAllocation.teamName}</span> across the following criteria.
                        </CardDescription>
                      </div>
                      <div className="hidden sm:flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-xl font-bold text-primary">
                        {selectedAllocation.teamNumber}
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="flex-1 p-0">
                    {isLoadingScores ? (
                      <div className="flex h-64 flex-col items-center justify-center text-sm text-muted-foreground">
                        <Loader2 className="mb-4 h-8 w-8 animate-spin text-primary/50" />
                        <p>Loading score criteria...</p>
                      </div>
                    ) : !scorePayload ? (
                      <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">
                        No score data available.
                      </div>
                    ) : (
                      <div className="flex h-full flex-col">
                        <div className="flex-1 p-4 sm:p-6 space-y-6">
                          {scorePayload.roundStatus === "Completed" && (
                            <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-4 text-sm text-amber-800 dark:text-amber-400 flex items-center gap-2">
                              <CheckCircle2 className="h-4 w-4" />
                              This round is completed. Scores are currently locked.
                            </div>
                          )}

                          {scorePayload.criteria.length === 0 ? (
                            <div className="flex h-32 items-center justify-center rounded-lg border border-dashed text-sm text-muted-foreground">
                              No criteria configured for this round.
                            </div>
                          ) : (
                            <div className="space-y-4">
                              {scorePayload.criteria.map((criterion, idx) => (
                                <div
                                  key={criterion.id}
                                  className="group flex flex-col gap-4 rounded-xl border border-border/60 bg-card p-4 transition-all hover:border-primary/30 sm:flex-row sm:items-center sm:justify-between"
                                >
                                  <div className="space-y-1 flex-1">
                                    <div className="flex items-center gap-2">
                                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-xs font-medium text-muted-foreground">
                                        {idx + 1}
                                      </span>
                                      <p className="text-base font-semibold leading-none text-foreground">
                                        {criterion.criteriaName}
                                      </p>
                                    </div>
                                    <p className="pl-8 text-sm text-muted-foreground">
                                      Maximum score: {criterion.maxScore}
                                    </p>
                                  </div>
                                  <div className="w-full pl-8 sm:w-32 sm:pl-0">
                                    <Input
                                      type="text"
                                      inputMode="numeric"
                                      pattern="[0-9]*"
                                      value={
                                        criterion.rawScore === null
                                          ? ""
                                          : String(criterion.rawScore)
                                      }
                                      onChange={(e) =>
                                        updateCriterionScore(
                                          criterion.id,
                                          e.target.value,
                                          criterion.maxScore,
                                        )
                                      }
                                      disabled={
                                        scorePayload.roundStatus === "Completed"
                                      }
                                      className={cn(
                                        "h-14 bg-muted/40 text-center text-xl font-bold transition-all focus:bg-background",
                                        criterion.rawScore && criterion.rawScore > 0 && "border-green-500/50 text-green-700 dark:text-green-400"
                                      )}
                                      placeholder="-"
                                    />
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        {scorePayload.roundStatus !== "Completed" && scorePayload.criteria.length > 0 && (
                          <div className="border-t border-border/40 bg-muted/10 p-4 sm:p-6 mt-auto rounded-b-xl">
                            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                              <p className="text-sm text-muted-foreground text-center sm:text-left">
                                Ensure all criteria are scored correctly before saving.
                              </p>
                              <Button
                                size="lg"
                                onClick={handleSaveScores}
                                disabled={isSavingScores}
                                className="w-full sm:w-auto min-w-[150px] font-bold shadow-md transition-transform active:scale-95"
                              >
                                {isSavingScores ? (
                                  <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Saving...
                                  </>
                                ) : (
                                  <>
                                    <Save className="mr-2 h-4 w-4" />
                                    Save Scores
                                  </>
                                )}
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

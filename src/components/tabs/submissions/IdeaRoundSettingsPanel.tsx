"use client";

import { Loader2 } from "lucide-react";
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
import { Input } from "~/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import type { IdeaCriterion, IdeaRound } from "./types";

type RoleCandidate = {
  id: string;
  name: string;
  hasEvaluatorAccess: boolean;
};

export function IdeaRoundSettingsPanel() {
  const [isLoading, setIsLoading] = useState(true);
  const [isCreatingRound, setIsCreatingRound] = useState(false);
  const [isCreatingCriteria, setIsCreatingCriteria] = useState(false);
  const [isUpdatingRoundStatus, setIsUpdatingRoundStatus] = useState(false);
  const [isAssigningTeams, setIsAssigningTeams] = useState(false);

  const [rounds, setRounds] = useState<IdeaRound[]>([]);
  const [roles, setRoles] = useState<RoleCandidate[]>([]);
  const [criteria, setCriteria] = useState<IdeaCriterion[]>([]);

  const [selectedRoundId, setSelectedRoundId] = useState("");

  const [newRoundName, setNewRoundName] = useState("");
  const [newRoundRoleId, setNewRoundRoleId] = useState("");
  const [newRoundStage, setNewRoundStage] = useState("NOT_SELECTED");

  const [newCriteriaName, setNewCriteriaName] = useState("");
  const [newCriteriaMaxScore, setNewCriteriaMaxScore] = useState("10");

  const selectedRound = useMemo(
    () => rounds.find((round) => round.id === selectedRoundId),
    [rounds, selectedRoundId],
  );

  const canEditSelectedRound = selectedRound?.status === "Draft";

  const fetchData = async () => {
    try {
      const [roundsRes, rolesRes] = await Promise.all([
        fetch("/api/dashboard/idea-rounds"),
        fetch("/api/dashboard/submissions/settings"),
      ]);

      if (!roundsRes.ok || !rolesRes.ok)
        throw new Error("Failed to fetch data");

      const roundsData = await roundsRes.json();
      const rolesData = await rolesRes.json();

      setRounds(roundsData);
      setRoles(rolesData.roles);

      if (roundsData.length > 0 && !selectedRoundId) {
        setSelectedRoundId(roundsData[0].id);
      }
    } catch {
      toast.error("Failed to load settings");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCriteria = async (roundId: string) => {
    if (!roundId) {
      setCriteria([]);
      return;
    }
    try {
      const res = await fetch(
        `/api/dashboard/idea-rounds/criteria?roundId=${roundId}`,
      );
      if (!res.ok) throw new Error("Failed to fetch criteria");
      const data = await res.json();
      setCriteria(data);
    } catch {
      toast.error("Failed to load criteria");
    }
  };

  // biome-ignore lint/correctness/useExhaustiveDependencies: hmm
  useEffect(() => {
    void fetchData();
  }, []);

  // biome-ignore lint/correctness/useExhaustiveDependencies: hmm
  useEffect(() => {
    void fetchCriteria(selectedRoundId);
  }, [selectedRoundId]);

  const evaluatorRoles = roles.filter((r) => r.hasEvaluatorAccess);

  const handleCreateRound = async () => {
    if (!newRoundName.trim() || !newRoundRoleId || !newRoundStage) {
      toast.error("Please fill all round fields");
      return;
    }

    try {
      setIsCreatingRound(true);
      const res = await fetch("/api/dashboard/idea-rounds", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newRoundName.trim(),
          roleId: newRoundRoleId,
          targetStage: newRoundStage,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Failed to create round");
      }

      toast.success("Evaluation round created");
      setNewRoundName("");
      void fetchData();
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
      toast.error("Select a round first");
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
      const res = await fetch("/api/dashboard/idea-rounds/criteria", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roundId: selectedRoundId,
          name: newCriteriaName.trim(),
          maxScore,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Failed to create criteria");
      }

      toast.success("Criteria created");
      setNewCriteriaName("");
      setNewCriteriaMaxScore("10");
      void fetchCriteria(selectedRoundId);
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
    if (!selectedRound) return;

    try {
      setIsUpdatingRoundStatus(true);
      const res = await fetch("/api/dashboard/idea-rounds", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: selectedRound.id, status }),
      });

      if (!res.ok) {
        throw new Error("Failed to update round status");
      }

      toast.success(`Round status changed to ${status}`);
      void fetchData();
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

  const handleAssignTeams = async () => {
    if (!selectedRound) return;

    try {
      setIsAssigningTeams(true);
      toast.loading("Assigning teams...", { id: `assign-${selectedRound.id}` });
      const res = await fetch("/api/dashboard/idea-rounds/assign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roundId: selectedRound.id }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Failed to assign teams");
      }

      const data = await res.json();
      toast.success(`Assigned ${data.assignedCount} teams to round`, {
        id: `assign-${selectedRound.id}`,
      });
      void fetchData();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to assign teams",
        { id: `assign-${selectedRound.id}` },
      );
    } finally {
      setIsAssigningTeams(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">
          Evaluation Settings
        </h2>
        <p className="text-muted-foreground">
          Create evaluation rounds and configure criteria points.
        </p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center rounded-md border p-8">
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Loading settings...
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2 2xl:grid-cols-3">
          <Card>
            <CardContent className="space-y-4">
              <div>
                <CardTitle className="mb-2">Create Round</CardTitle>
                <CardDescription>
                  Create an evaluation round for a specific role and stage.
                </CardDescription>
              </div>

              <div className="space-y-2">
                <Input
                  value={newRoundName}
                  onChange={(e) => setNewRoundName(e.target.value)}
                  placeholder="Round name (e.g. Round 1)"
                />
                <Select
                  value={newRoundRoleId}
                  onValueChange={setNewRoundRoleId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Target Evaluator Role" />
                  </SelectTrigger>
                  <SelectContent>
                    {evaluatorRoles.map((r) => (
                      <SelectItem key={r.id} value={r.id}>
                        {r.name}
                      </SelectItem>
                    ))}
                    {evaluatorRoles.length === 0 && (
                      <SelectItem value="none" disabled>
                        No evaluator roles found
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
                <Select value={newRoundStage} onValueChange={setNewRoundStage}>
                  <SelectTrigger>
                    <SelectValue placeholder="Target Team Stage" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NOT_SELECTED">Not Selected</SelectItem>
                    <SelectItem value="SEMI_SELECTED">Semi Selected</SelectItem>
                    <SelectItem value="SELECTED">Selected</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  onClick={handleCreateRound}
                  disabled={
                    isCreatingRound ||
                    !newRoundName ||
                    !newRoundRoleId ||
                    !newRoundStage
                  }
                  className="w-full"
                >
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
                      <Badge
                        key={round.id}
                        variant="secondary"
                        className="cursor-pointer"
                        onClick={() => setSelectedRoundId(round.id)}
                      >
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
                  Add criteria and max score for the selected round.
                </CardDescription>
              </div>

              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  Evaluation round
                </p>
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
                  Round is locked. Switch it back to Draft to modify.
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
                        <span className="text-sm font-medium">{item.name}</span>
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
                <CardTitle className="mb-2">Bulk Assign Evaluators</CardTitle>
                <CardDescription>
                  Automatically distribute teams equally among evaluators.
                </CardDescription>
              </div>

              {selectedRound ? (
                <div className="space-y-4">
                  <div className="rounded-md border p-3 flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">
                      Teams Assigned:
                    </span>
                    <span className="font-semibold">
                      {selectedRound.assignmentCount}
                    </span>
                  </div>
                  <Button
                    onClick={handleAssignTeams}
                    disabled={
                      !selectedRoundId ||
                      isAssigningTeams ||
                      selectedRound.status === "Completed"
                    }
                    className="w-full"
                    variant="outline"
                  >
                    {isAssigningTeams
                      ? "Publishing Assignments..."
                      : "Run Bulk Assignment"}
                  </Button>
                  {selectedRound.status === "Completed" && (
                    <p className="text-xs text-amber-600">
                      Round is completed. Team allocation is locked.
                    </p>
                  )}
                </div>
              ) : (
                <div className="text-sm text-muted-foreground">
                  Select a round from the previous card.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

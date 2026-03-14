"use client";

import { Loader2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { Textarea } from "~/components/ui/textarea";

type MentorAllocation = {
  assignmentId: string;
  teamId: string;
  teamName: string;
  teamStage: string;
  paymentStatus: string | null;
  roundId: string;
  roundName: string;
  roundStatus: "Draft" | "Active" | "Completed";
  pptUrl: string | null;
  trackName: string | null;
  feedbackCount: number;
};

type MentorHistoryRow = {
  assignmentId: string;
  teamId: string;
  teamName: string;
  mentorRoundName: string;
  mentorRoundStatus: "Draft" | "Active" | "Completed";
  mentorName: string;
  mentorUsername: string;
  feedback: string | null;
};

type FeedbackPayload = {
  assignmentId: string;
  roundStatus: "Draft" | "Active" | "Completed";
  feedback: string;
};

function formatEnumLabel(value: string | null | undefined) {
  if (!value) return "-";
  return value
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export function MentorTab() {
  const [isLoading, setIsLoading] = useState(true);
  const [allocations, setAllocations] = useState<MentorAllocation[]>([]);
  const [isFeedbackDialogOpen, setIsFeedbackDialogOpen] = useState(false);
  const [isLoadingFeedback, setIsLoadingFeedback] = useState(false);
  const [isSavingFeedback, setIsSavingFeedback] = useState(false);
  const [selectedAllocation, setSelectedAllocation] =
    useState<MentorAllocation | null>(null);
  const [feedbackPayload, setFeedbackPayload] =
    useState<FeedbackPayload | null>(null);
  const [teamHistory, setTeamHistory] = useState<MentorHistoryRow[]>([]);

  const previousRoundHistory = useMemo(() => {
    if (!selectedAllocation) return [];

    return teamHistory.filter(
      (row) =>
        row.assignmentId !== selectedAllocation.assignmentId &&
        Boolean(row.feedback?.trim()),
    );
  }, [teamHistory, selectedAllocation]);

  const fetchAllocations = async () => {
    const res = await fetch("/api/dashboard/mentor/my-allocations");
    if (!res.ok) {
      setAllocations([]);
      return;
    }

    const data = (await res.json()) as MentorAllocation[];
    setAllocations(data);
  };

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

  const grouped = useMemo(() => {
    const statusPriority: Record<MentorAllocation["roundStatus"], number> = {
      Active: 0,
      Draft: 1,
      Completed: 2,
    };

    const map = new Map<string, MentorAllocation[]>();
    for (const item of allocations) {
      const key = `${item.roundId}|${item.roundName}|${item.roundStatus}`;
      const existing = map.get(key) ?? [];
      existing.push(item);
      map.set(key, existing);
    }

    return Array.from(map.entries())
      .map(([key, items]) => {
        const [roundId, roundName, roundStatus] = key.split("|");
        const typedStatus = roundStatus as MentorAllocation["roundStatus"];
        return {
          roundId,
          roundName,
          roundStatus: typedStatus,
          items: items.sort((a, b) => a.teamName.localeCompare(b.teamName)),
        };
      })
      .sort((a, b) => {
        const byStatus =
          statusPriority[a.roundStatus] - statusPriority[b.roundStatus];
        if (byStatus !== 0) return byStatus;
        return a.roundName.localeCompare(b.roundName);
      });
  }, [allocations]);

  const openFeedbackDialog = async (allocation: MentorAllocation) => {
    try {
      setSelectedAllocation(allocation);
      setIsFeedbackDialogOpen(true);
      setIsLoadingFeedback(true);

      const [feedbackRes, historyRes] = await Promise.all([
        fetch(
          `/api/dashboard/mentor/feedback?assignmentId=${encodeURIComponent(allocation.assignmentId)}`,
        ),
        fetch(
          `/api/dashboard/mentor/history?teamId=${encodeURIComponent(allocation.teamId)}`,
        ),
      ]);

      if (!feedbackRes.ok) {
        const data = (await feedbackRes.json()) as { message?: string };
        throw new Error(data.message || "Failed to load feedback");
      }

      if (!historyRes.ok) {
        const data = (await historyRes.json()) as { message?: string };
        throw new Error(data.message || "Failed to load feedback history");
      }

      const feedbackData = (await feedbackRes.json()) as FeedbackPayload;
      const historyData = (await historyRes.json()) as MentorHistoryRow[];

      setFeedbackPayload(feedbackData);
      setTeamHistory(historyData);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to load feedback",
      );
      setIsFeedbackDialogOpen(false);
      setSelectedAllocation(null);
      setFeedbackPayload(null);
      setTeamHistory([]);
    } finally {
      setIsLoadingFeedback(false);
    }
  };

  const handleSaveFeedback = async () => {
    if (!feedbackPayload) return;

    if (!feedbackPayload.feedback.trim()) {
      toast.error("Feedback cannot be empty");
      return;
    }

    try {
      setIsSavingFeedback(true);
      const res = await fetch("/api/dashboard/mentor/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assignmentId: feedbackPayload.assignmentId,
          feedback: feedbackPayload.feedback,
        }),
      });

      if (!res.ok) {
        const data = (await res.json()) as { message?: string };
        throw new Error(data.message || "Failed to save feedback");
      }

      toast.success("Feedback saved");
      await fetchAllocations();
      setIsFeedbackDialogOpen(false);
      setSelectedAllocation(null);
      setFeedbackPayload(null);
      setTeamHistory([]);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to save feedback",
      );
    } finally {
      setIsSavingFeedback(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Mentor Feedback</h2>
        <p className="text-muted-foreground">
          Submit and review feedback for allocated teams across rounds.
        </p>
      </div>

      {isLoading ? (
        <div className="flex items-center text-sm text-muted-foreground">
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Loading assigned teams...
        </div>
      ) : grouped.length === 0 ? (
        <div className="rounded-md border p-4 text-sm text-muted-foreground">
          No teams are allocated to your mentor account yet.
        </div>
      ) : (
        <div className="space-y-6">
          {grouped.map((group) => (
            <div key={group.roundId} className="space-y-3">
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-semibold">{group.roundName}</h3>
                <Badge variant="secondary">{group.roundStatus}</Badge>
              </div>

              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Team</TableHead>
                      <TableHead>Track</TableHead>
                      <TableHead>Stage</TableHead>
                      <TableHead>Submission</TableHead>
                      <TableHead>Feedback</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {group.items.map((item) => (
                      <TableRow key={item.assignmentId}>
                        <TableCell className="font-medium">
                          {item.teamName}
                        </TableCell>
                        <TableCell>{item.trackName ?? "-"}</TableCell>
                        <TableCell>{formatEnumLabel(item.teamStage)}</TableCell>
                        <TableCell>
                          {item.pptUrl ? (
                            <a
                              href={item.pptUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="underline underline-offset-4"
                            >
                              View PPT
                            </a>
                          ) : (
                            <span className="text-muted-foreground">
                              Not submitted
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          {item.feedbackCount > 0 ? "Saved" : "Not submitted"}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openFeedbackDialog(item)}
                          >
                            {item.roundStatus === "Completed"
                              ? "View"
                              : item.feedbackCount > 0
                                ? "View / Edit"
                                : "Add Feedback"}
                          </Button>
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

      <Dialog
        open={isFeedbackDialogOpen}
        onOpenChange={setIsFeedbackDialogOpen}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>
              Mentor Feedback
              {selectedAllocation ? ` - ${selectedAllocation.teamName}` : ""}
            </DialogTitle>
            <DialogDescription>
              Add or edit feedback for this assignment and review historical
              feedback for the same team.
            </DialogDescription>
          </DialogHeader>

          {isLoadingFeedback ? (
            <div className="flex items-center text-sm text-muted-foreground">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Loading feedback...
            </div>
          ) : !feedbackPayload ? (
            <p className="text-sm text-muted-foreground">
              No feedback data available.
            </p>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                <p className="text-sm font-medium">
                  Current Assignment Feedback
                </p>
                <Textarea
                  value={feedbackPayload.feedback}
                  onChange={(event) =>
                    setFeedbackPayload((prev) =>
                      prev ? { ...prev, feedback: event.target.value } : prev,
                    )
                  }
                  placeholder="Write actionable feedback for this team"
                  disabled={feedbackPayload.roundStatus === "Completed"}
                />
                {feedbackPayload.roundStatus === "Completed" ? (
                  <p className="text-xs text-amber-600">
                    Round is completed. Feedback is read-only.
                  </p>
                ) : null}
                {feedbackPayload.roundStatus !== "Completed" ? (
                  <div className="flex justify-end">
                    <Button
                      onClick={handleSaveFeedback}
                      disabled={isSavingFeedback}
                    >
                      {isSavingFeedback ? "Saving..." : "Save Feedback"}
                    </Button>
                  </div>
                ) : null}
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium">Team Feedback History</p>
                {previousRoundHistory.length === 0 ? (
                  <div className="rounded-md border p-3 text-sm text-muted-foreground">
                    No previous round feedback available.
                  </div>
                ) : (
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Round</TableHead>
                          <TableHead>Mentor</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Feedback</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {previousRoundHistory.map((row, index) => (
                          <TableRow key={`${row.assignmentId}-${index}`}>
                            <TableCell className="font-medium">
                              {row.mentorRoundName}
                            </TableCell>
                            <TableCell>
                              {row.mentorName} @{row.mentorUsername}
                            </TableCell>
                            <TableCell>
                              <Badge variant="secondary">
                                {row.mentorRoundStatus}
                              </Badge>
                            </TableCell>
                            <TableCell className="max-w-85 whitespace-pre-wrap text-sm">
                              {row.feedback}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

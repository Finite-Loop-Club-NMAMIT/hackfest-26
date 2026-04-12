"use client";

import {
  ChevronDown,
  ChevronUp,
  Loader2,
  Megaphone,
  Pause,
  Play,
  Plus,
  RotateCcw,
  Timer,
  Trash2,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { Input } from "~/components/ui/input";
import { Switch } from "~/components/ui/switch";

/* ─── Types ─── */
type Track = {
  id: string;
  name: string;
  createdAt: string;
};

type TimerState = {
  id: string;
  label: string;
  status: "IDLE" | "RUNNING" | "PAUSED" | "COMPLETED";
  durationSeconds: number;
  elapsedSeconds: number;
  remaining: number;
  startTime?: string | null;
} | null;

type AnnouncementItem = {
  id: string;
  message: string;
  active: boolean;
  createdAt: string;
};

async function fetchTracks(
  setTracks: React.Dispatch<React.SetStateAction<Track[]>>,
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>,
) {
  try {
    const res = await fetch("/api/tracks");
    if (!res.ok) throw new Error("Failed to fetch tracks");
    const data = await res.json();
    setTracks(data);
  } catch (_error) {
    toast.error("Error loading tracks");
  } finally {
    setIsLoading(false);
  }
}

const STATUS_COLORS: Record<string, string> = {
  IDLE: "bg-gray-500",
  RUNNING: "bg-green-500",
  PAUSED: "bg-amber-500",
  COMPLETED: "bg-red-500",
};

const STATUS_LABELS: Record<string, string> = {
  IDLE: "Idle",
  RUNNING: "Running",
  PAUSED: "Paused",
  COMPLETED: "Completed",
};

function formatDuration(seconds: number) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  const parts = [];
  if (h > 0) parts.push(`${h}h`);
  if (m > 0) parts.push(`${m}m`);
  if (s > 0 || parts.length === 0) parts.push(`${s}s`);
  return parts.join(" ");
}

export function SettingsTab() {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [newTrackName, setNewTrackName] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);

  const [trackToDelete, setTrackToDelete] = useState<Track | null>(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  const [timerState, setTimerState] = useState<TimerState>(null);
  const [timerLabel, setTimerLabel] = useState("");
  const [timerHours, setTimerHours] = useState("");
  const [timerMinutes, setTimerMinutes] = useState("");
  const [timerSeconds, setTimerSeconds] = useState("");
  const [timerStartTime, setTimerStartTime] = useState("");
  const [isSavingTimer, setIsSavingTimer] = useState(false);
  const [timerActionLoading, setTimerActionLoading] = useState<string | null>(
    null,
  );
  const [isTimerLoading, setIsTimerLoading] = useState(true);

  // Announcements state
  const [announcements, setAnnouncements] = useState<AnnouncementItem[]>([]);
  const [newAnnouncementMessage, setNewAnnouncementMessage] = useState("");
  const [newAnnouncementActive, setNewAnnouncementActive] = useState(false);
  const [isCreatingAnnouncement, setIsCreatingAnnouncement] = useState(false);
  const [isAnnouncementsLoading, setIsAnnouncementsLoading] = useState(true);
  const [announcementActionLoading, setAnnouncementActionLoading] = useState<
    string | null
  >(null);

  // Accordion state
  const [isTimerExpanded, setIsTimerExpanded] = useState(false);
  const [isAnnouncementsExpanded, setIsAnnouncementsExpanded] = useState(false);
  const [isTracksExpanded, setIsTracksExpanded] = useState(false);

  // biome-ignore lint/correctness/useExhaustiveDependencies: hmm
  useEffect(() => {
    fetchTracks(setTracks, setIsLoading);
    fetchTimerState();
    fetchAnnouncements();
  }, []);

  async function fetchTimerState() {
    try {
      const res = await fetch("/api/timer");
      if (!res.ok) throw new Error("Failed to fetch timer");
      const data = await res.json();
      setTimerState(data.timer);
      if (data.timer) {
        setTimerLabel(data.timer.label);
        const sec = data.timer.durationSeconds;
        setTimerHours(String(Math.floor(sec / 3600)));
        setTimerMinutes(String(Math.floor((sec % 3600) / 60)));
        setTimerSeconds(String(sec % 60));

        if (data.timer.startTime) {
          const d = new Date(data.timer.startTime);
          const pad = (n: number) => String(n).padStart(2, "0");
          const localISOTime = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
          setTimerStartTime(localISOTime);
        } else {
          setTimerStartTime("");
        }
      }
    } catch {
    } finally {
      setIsTimerLoading(false);
    }
  }

  async function handleSaveTimer(e: React.FormEvent) {
    e.preventDefault();
    const h = parseInt(timerHours || "0", 10);
    const m = parseInt(timerMinutes || "0", 10);
    const s = parseInt(timerSeconds || "0", 10);
    const durationSeconds = h * 3600 + m * 60 + s;

    if (!timerLabel.trim() || durationSeconds <= 0) return;

    setIsSavingTimer(true);
    try {
      const startTimeISO = timerStartTime || null;
      const res = await fetch("/api/timer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          label: timerLabel,
          durationSeconds,
          startTime: startTimeISO,
        }),
      });
      if (!res.ok) throw new Error("Failed to save timer");
      toast.success("Timer saved");
      await fetchTimerState();
    } catch (error: unknown) {
      const msg =
        error instanceof Error ? error.message : "Failed to save timer";
      toast.error(msg);
    } finally {
      setIsSavingTimer(false);
    }
  }

  async function handleTimerAction(action: "start" | "pause" | "reset") {
    setTimerActionLoading(action);
    try {
      const res = await fetch("/api/timer", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Action failed");
      }
      toast.success(
        `Timer ${action === "start" ? "started" : action === "pause" ? "paused" : "reset"}`,
      );
      await fetchTimerState();
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "Action failed";
      toast.error(msg);
    } finally {
      setTimerActionLoading(null);
    }
  }

  async function handleTimerAdjust(deltaSeconds: number) {
    setTimerActionLoading("adjust");
    try {
      const res = await fetch("/api/timer", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "adjust", deltaSeconds }),
      });
      if (!res.ok) throw new Error("Failed to adjust timer");
      toast.success(
        deltaSeconds > 0
          ? `Added ${deltaSeconds / 60}m`
          : `Removed ${Math.abs(deltaSeconds) / 60}m`,
      );
      await fetchTimerState();
    } catch (_error: unknown) {
      toast.error("Adjust failed");
    } finally {
      setTimerActionLoading(null);
    }
  }

  async function fetchAnnouncements() {
    try {
      const res = await fetch("/api/timer/announcement");
      if (!res.ok) throw new Error("Failed to fetch announcements");
      const data = await res.json();
      setAnnouncements(data);
    } catch {
    } finally {
      setIsAnnouncementsLoading(false);
    }
  }

  async function handleCreateAnnouncement(e: React.FormEvent) {
    e.preventDefault();
    if (!newAnnouncementMessage.trim()) return;

    setIsCreatingAnnouncement(true);
    try {
      const res = await fetch("/api/timer/announcement", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: newAnnouncementMessage,
          active: newAnnouncementActive,
        }),
      });
      if (!res.ok) throw new Error("Failed to create announcement");
      toast.success("Announcement created");
      setNewAnnouncementMessage("");
      setNewAnnouncementActive(false);
      await fetchAnnouncements();
    } catch (error: unknown) {
      const msg =
        error instanceof Error
          ? error.message
          : "Failed to create announcement";
      toast.error(msg);
    } finally {
      setIsCreatingAnnouncement(false);
    }
  }

  async function handleToggleAnnouncement(item: AnnouncementItem) {
    setAnnouncementActionLoading(item.id);
    try {
      const res = await fetch("/api/timer/announcement", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: item.id,
          message: item.message,
          active: !item.active,
        }),
      });
      if (!res.ok) throw new Error("Failed to update announcement");
      toast.success(
        item.active ? "Announcement deactivated" : "Announcement activated",
      );
      await fetchAnnouncements();
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "Update failed";
      toast.error(msg);
    } finally {
      setAnnouncementActionLoading(null);
    }
  }

  async function handleDeleteAnnouncement(id: string) {
    setAnnouncementActionLoading(id);
    try {
      const res = await fetch(`/api/timer/announcement?id=${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete announcement");
      toast.success("Announcement deleted");
      await fetchAnnouncements();
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "Delete failed";
      toast.error(msg);
    } finally {
      setAnnouncementActionLoading(null);
    }
  }

  /* ─── Track Handlers ─── */
  async function handleAddTrack(e: React.FormEvent) {
    e.preventDefault();
    if (!newTrackName.trim()) return;

    setIsAdding(true);
    try {
      const res = await fetch("/api/tracks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newTrackName }),
      });

      if (!res.ok) {
        const error = await res.text();
        throw new Error(error);
      }

      const newTrack = await res.json();
      setTracks([newTrack, ...tracks]);
      setNewTrackName("");
      toast.success("Track added successfully");
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Failed to add track";
      toast.error(message);
    } finally {
      setIsAdding(false);
    }
  }

  const _openDeleteModal = (track: Track) => {
    setTrackToDelete(track);
    setDeleteConfirmation("");
  };

  const _handleDeleteTrack = async () => {
    if (!trackToDelete || deleteConfirmation !== trackToDelete.id) return;

    setIsDeleting(true);
    try {
      const res = await fetch(`/api/tracks?id=${trackToDelete.id}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Failed to delete track");

      setTracks(tracks.filter((t) => t.id !== trackToDelete.id));
      toast.success("Track deleted successfully");
      setTrackToDelete(null);
    } catch (_error) {
      toast.error("Failed to delete track");
    } finally {
      setIsDeleting(false);
    }
  };

  const status = timerState?.status ?? "IDLE";

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Settings</h2>
        <p className="text-muted-foreground">System settings</p>
      </div>

      {/* ─── Timer Control Card ─── */}
      <Card>
        <CardHeader
          className="cursor-pointer hover:bg-muted/50 transition-colors"
          onClick={() => setIsTimerExpanded(!isTimerExpanded)}
        >
          <div className="flex items-center justify-between">
            <div className="space-y-1.5">
              <CardTitle className="flex items-center gap-2">
                <Timer className="h-5 w-5" />
                Timer Control
              </CardTitle>
              <CardDescription>
                Manage the hackathon countdown timer visible on /timer
              </CardDescription>
            </div>
            {isTimerExpanded ? (
              <ChevronUp className="h-5 w-5 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-5 w-5 text-muted-foreground" />
            )}
          </div>
        </CardHeader>

        {isTimerExpanded && (
          <CardContent className="space-y-5 border-t pt-6">
            {isTimerLoading ? (
              <div className="p-4 text-center text-muted-foreground">
                Loading timer...
              </div>
            ) : (
              <>
                {/* Current status */}
                {timerState && (
                  <div className="flex flex-col gap-3 px-4 py-3 rounded-lg bg-muted/50 border">
                    <div className="flex items-center gap-4 flex-wrap">
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-2.5 h-2.5 rounded-full ${STATUS_COLORS[status]} ${status === "RUNNING" ? "animate-pulse" : ""}`}
                        />
                        <span className="text-sm font-medium">
                          {STATUS_LABELS[status]}
                        </span>
                      </div>
                      <div className="h-4 w-px bg-border" />
                      <span className="text-sm text-muted-foreground">
                        Remaining: {formatDuration(timerState.remaining)}
                      </span>
                      <div className="h-4 w-px bg-border" />
                      <span className="text-sm text-muted-foreground">
                        Total: {formatDuration(timerState.durationSeconds)}
                      </span>
                    </div>
                    {timerState.startTime && status !== "RUNNING" && (
                      <div className="text-xs text-muted-foreground flex items-center gap-1 border-t pt-2">
                        <span>Auto-starts at:</span>
                        <span className="font-semibold text-foreground">
                          {new Date(timerState.startTime).toLocaleString()}
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {/* Timer config form */}
                <form
                  onSubmit={handleSaveTimer}
                  className="flex flex-col gap-4 border-b pb-5 border-border"
                >
                  <div className="flex flex-col sm:flex-row gap-3">
                    <Input
                      placeholder="Timer label (e.g. Round 1)"
                      value={timerLabel}
                      onChange={(e) => setTimerLabel(e.target.value)}
                      disabled={isSavingTimer}
                      className="flex-1"
                    />
                    <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                      <Input
                        type="number"
                        placeholder="H"
                        value={timerHours}
                        onChange={(e) => setTimerHours(e.target.value)}
                        disabled={isSavingTimer}
                        className="w-16"
                        min={0}
                      />
                      <span className="text-sm text-muted-foreground -ml-1">
                        h
                      </span>

                      <Input
                        type="number"
                        placeholder="M"
                        value={timerMinutes}
                        onChange={(e) => setTimerMinutes(e.target.value)}
                        disabled={isSavingTimer}
                        className="w-16"
                        min={0}
                      />
                      <span className="text-sm text-muted-foreground -ml-1">
                        m
                      </span>

                      <Input
                        type="number"
                        placeholder="S"
                        value={timerSeconds}
                        onChange={(e) => setTimerSeconds(e.target.value)}
                        disabled={isSavingTimer}
                        className="w-16"
                        min={0}
                      />
                      <span className="text-sm text-muted-foreground -ml-1">
                        s
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3 items-end">
                    <div className="flex-1 w-full space-y-1.5">
                      <label
                        htmlFor="timer-start-time"
                        className="text-xs font-medium text-muted-foreground"
                      >
                        Auto-start time (optional)
                      </label>
                      <Input
                        id="timer-start-time"
                        type="datetime-local"
                        value={timerStartTime}
                        onChange={(e) => setTimerStartTime(e.target.value)}
                        disabled={isSavingTimer}
                        className="w-full"
                      />
                    </div>
                    <Button
                      type="submit"
                      disabled={
                        isSavingTimer ||
                        !timerLabel.trim() ||
                        (parseInt(timerHours || "0", 10) === 0 &&
                          parseInt(timerMinutes || "0", 10) === 0 &&
                          parseInt(timerSeconds || "0", 10) === 0)
                      }
                      className="w-full sm:w-auto"
                    >
                      {isSavingTimer ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        "Save / Edit Timer"
                      )}
                    </Button>
                  </div>
                </form>

                {/* Action buttons */}
                {timerState && (
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center gap-3 flex-wrap">
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => handleTimerAction("start")}
                        disabled={
                          timerActionLoading !== null ||
                          status === "RUNNING" ||
                          status === "COMPLETED"
                        }
                      >
                        {timerActionLoading === "start" ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-1" />
                        ) : (
                          <Play className="h-4 w-4 mr-1" />
                        )}
                        Start
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleTimerAction("pause")}
                        disabled={
                          timerActionLoading !== null || status !== "RUNNING"
                        }
                      >
                        {timerActionLoading === "pause" ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-1" />
                        ) : (
                          <Pause className="h-4 w-4 mr-1" />
                        )}
                        Pause
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleTimerAction("reset")}
                        disabled={
                          timerActionLoading !== null || status === "IDLE"
                        }
                      >
                        {timerActionLoading === "reset" ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-1" />
                        ) : (
                          <RotateCcw className="h-4 w-4 mr-1" />
                        )}
                        Reset
                      </Button>
                    </div>

                    {/* Quick adjustments */}
                    <div className="flex items-center gap-2 pt-2">
                      <span className="text-xs text-muted-foreground mr-1">
                        Quick Add/Sub:
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 px-2 text-xs"
                        onClick={() => handleTimerAdjust(-60)}
                        disabled={timerActionLoading !== null}
                      >
                        -1m
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 px-2 text-xs"
                        onClick={() => handleTimerAdjust(-300)}
                        disabled={timerActionLoading !== null}
                      >
                        -5m
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 px-2 text-xs"
                        onClick={() => handleTimerAdjust(60)}
                        disabled={timerActionLoading !== null}
                      >
                        +1m
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 px-2 text-xs"
                        onClick={() => handleTimerAdjust(300)}
                        disabled={timerActionLoading !== null}
                      >
                        +5m
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        )}
      </Card>

      {/* ─── Announcements Card ─── */}
      <Card>
        <CardHeader
          className="cursor-pointer hover:bg-muted/50 transition-colors"
          onClick={() => setIsAnnouncementsExpanded(!isAnnouncementsExpanded)}
        >
          <div className="flex items-center justify-between">
            <div className="space-y-1.5">
              <CardTitle className="flex items-center gap-2">
                <Megaphone className="h-5 w-5" />
                Announcements
              </CardTitle>
              <CardDescription>
                Manage live announcements displayed on the timer page. Only one
                can be active at a time.
              </CardDescription>
            </div>
            {isAnnouncementsExpanded ? (
              <ChevronUp className="h-5 w-5 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-5 w-5 text-muted-foreground" />
            )}
          </div>
        </CardHeader>

        {isAnnouncementsExpanded && (
          <CardContent className="space-y-4 border-t pt-6">
            {/* New announcement form */}
            <form onSubmit={handleCreateAnnouncement} className="space-y-3">
              <div className="flex flex-col sm:flex-row gap-3">
                <Input
                  placeholder="Announcement message..."
                  value={newAnnouncementMessage}
                  onChange={(e) => setNewAnnouncementMessage(e.target.value)}
                  disabled={isCreatingAnnouncement}
                  className="flex-1"
                />
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={newAnnouncementActive}
                      onCheckedChange={setNewAnnouncementActive}
                      disabled={isCreatingAnnouncement}
                    />
                    <span className="text-sm text-muted-foreground whitespace-nowrap">
                      Active
                    </span>
                  </div>
                  <Button
                    type="submit"
                    disabled={
                      isCreatingAnnouncement || !newAnnouncementMessage.trim()
                    }
                  >
                    {isCreatingAnnouncement ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Plus className="h-4 w-4 mr-1" />
                    )}
                    Add
                  </Button>
                </div>
              </div>
            </form>

            {/* Announcements list */}
            <div className="border rounded-lg divide-y">
              {isAnnouncementsLoading ? (
                <div className="p-4 text-center text-muted-foreground">
                  Loading announcements...
                </div>
              ) : announcements.length === 0 ? (
                <div className="p-4 text-center text-muted-foreground">
                  No announcements yet.
                </div>
              ) : (
                announcements.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between gap-3 p-3 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{item.message}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {new Date(item.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={item.active}
                          onCheckedChange={() => handleToggleAnnouncement(item)}
                          disabled={announcementActionLoading === item.id}
                        />
                        <span
                          className={`text-xs font-medium ${
                            item.active
                              ? "text-green-500"
                              : "text-muted-foreground"
                          }`}
                        >
                          {item.active ? "Live" : "Off"}
                        </span>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => handleDeleteAnnouncement(item.id)}
                        disabled={announcementActionLoading === item.id}
                      >
                        {announcementActionLoading === item.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        )}
      </Card>

      {/* ─── Tracks Management Card (existing) ─── */}
      <Card>
        <CardHeader
          className="cursor-pointer hover:bg-muted/50 transition-colors"
          onClick={() => setIsTracksExpanded(!isTracksExpanded)}
        >
          <div className="flex items-center justify-between">
            <div className="space-y-1.5">
              <CardTitle>Tracks Management</CardTitle>
              <CardDescription>Add or remove hackfest tracks</CardDescription>
            </div>
            {isTracksExpanded ? (
              <ChevronUp className="h-5 w-5 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-5 w-5 text-muted-foreground" />
            )}
          </div>
        </CardHeader>

        {isTracksExpanded && (
          <CardContent className="space-y-4 border-t pt-6">
            <form onSubmit={handleAddTrack} className="flex gap-2">
              <Input
                placeholder="Enter track name (e.g. AI/ML, Web3)"
                value={newTrackName}
                onChange={(e) => setNewTrackName(e.target.value)}
                disabled={isAdding}
              />
              <Button type="submit" disabled={isAdding || !newTrackName.trim()}>
                {isAdding ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4 mr-2" />
                )}
                Add Track
              </Button>
            </form>

            <div className="border rounded-lg divide-y">
              {isLoading ? (
                <div className="p-4 text-center text-muted-foreground">
                  Loading tracks...
                </div>
              ) : tracks.length === 0 ? (
                <div className="p-4 text-center text-muted-foreground">
                  No tracks added yet.
                </div>
              ) : (
                tracks.map((track) => (
                  <div
                    key={track.id}
                    className="flex items-center justify-between p-3 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex flex-col">
                      <span className="font-medium">{track.name}</span>
                    </div>
                    {/* <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => openDeleteModal(track)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button> */}
                  </div>
                ))
              )}
            </div>
          </CardContent>
        )}
      </Card>

      <Dialog
        open={!!trackToDelete}
        onOpenChange={(open) => !open && setTrackToDelete(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Track</DialogTitle>
            <DialogDescription>
              This action cannot be undone. To confirm, please type the track ID
              below.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="text-sm font-medium">
              Track Name:{" "}
              <span className="font-normal">{trackToDelete?.name}</span>
            </div>
            <div className="bg-muted p-2 rounded text-sm font-crimson break-all">
              {trackToDelete?.id}{" "}
              {/* will remove as soon as the testing of this thing is done */}
            </div>
            <div className="space-y-2">
              <label
                htmlFor="delete-confirmation"
                className="text-sm font-medium"
              >
                Type Track ID to confirm:
              </label>
              <Input
                id="delete-confirmation"
                value={deleteConfirmation}
                onChange={(e) => setDeleteConfirmation(e.target.value)}
                placeholder={trackToDelete?.id}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setTrackToDelete(null)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            {/* <Button
              variant="destructive"
              onClick={handleDeleteTrack}
              disabled={deleteConfirmation !== trackToDelete?.id || isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete Track"
              )}
            </Button> */}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

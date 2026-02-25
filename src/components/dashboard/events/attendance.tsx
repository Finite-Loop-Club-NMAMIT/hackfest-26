"use client";
import {
  AlertCircle,
  CheckCircle2,
  Loader2,
  RefreshCw,
  Users,
  XCircle,
} from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Alert, AlertDescription } from "~/components/ui/alert";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { Switch } from "~/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import type { TeamDetails } from "~/db/services/manage-event";
import {
  type EventTeam,
  getEventTeams,
  getTeamDetails,
  toggleAttendance,
  toggleParticipantAttendance,
} from "./request";

async function fetchEventTeams(
  eventId: string,
  setTeams: (teams: EventTeam[]) => void,
  setLoading: (loading: boolean) => void,
) {
  setLoading(true);
  const teams = await getEventTeams(eventId);
  setTeams(teams ?? []);
  setLoading(false);
}

export default function MarkAttendanceTab({
  setTab,
}: {
  setTab: (tab: string) => void;
}) {
  const params = useSearchParams();
  const eventId = params.get("id");

  const [loading, setLoading] = useState(false);
  const [teams, setTeams] = useState<EventTeam[]>([]);
  const [updatingTeamId, setUpdatingTeamId] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<EventTeam | null>(null);

  useEffect(() => {
    if (eventId) {
      fetchEventTeams(eventId, setTeams, setLoading);
    }
  }, [eventId]);

  const handleToggleAttendance = async (team: EventTeam) => {
    setUpdatingTeamId(team.id);
    const newAttendedStatus = !team.attended;

    const success = await toggleAttendance(team.id, newAttendedStatus);

    if (success) {
      setTeams((prevTeams) =>
        prevTeams.map((t) =>
          t.id === team.id ? { ...t, attended: newAttendedStatus } : t,
        ),
      );
    }

    setUpdatingTeamId(null);
  };

  const handleRefresh = () => {
    if (eventId) {
      fetchEventTeams(eventId, setTeams, setLoading);
    }
  };

  if (!eventId) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12 gap-4">
          <Alert className="mx-auto w-fit">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Please select an event to mark attendance.
            </AlertDescription>
          </Alert>
          <div className="flex gap-2">
            <Button onClick={() => setTab("assigned")} variant="default">
              View Assigned Events
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <p className="text-muted-foreground">Loading teams...</p>
        </CardContent>
      </Card>
    );
  }

  const attendedCount = teams.filter((team) => team.attended).length;
  const totalTeams = teams.length;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Team Attendance
            </CardTitle>
            <div className="flex items-center gap-3">
              <Badge variant="outline" className="text-sm">
                {attendedCount} / {totalTeams} Present
              </Badge>
              <Button
                variant="outline"
                size="icon-sm"
                onClick={handleRefresh}
                disabled={loading}
                title="Refresh"
              >
                <RefreshCw
                  className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
                />
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {teams.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 gap-4">
            <Alert className="mx-auto w-fit">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                No teams registered for this event yet.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent>
            <div className="w-full overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="font-semibold"></TableHead>
                    <TableHead className="font-semibold">Name</TableHead>
                    <TableHead className="font-semibold">
                      Team Complete
                    </TableHead>
                    <TableHead className="font-semibold">Payment</TableHead>
                    <TableHead className="text-right font-semibold">
                      Attendance
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {teams.map((team) => (
                    <TableRow
                      key={team.id}
                      className="hover:bg-muted/30 transition-colors"
                    >
                      <TableCell>
                        <div
                          className={`flex h-8 w-8 items-center justify-center rounded-full ${
                            team.attended
                              ? "bg-green-200 text-green-700"
                              : "bg-red-200 text-red-700"
                          }`}
                        >
                          {team.attended ? (
                            <CheckCircle2 className="h-4 w-4" />
                          ) : (
                            <XCircle className="h-4 w-4 " />
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">
                        <Button
                          variant={"link"}
                          size={"sm"}
                          className="text-white"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setSelectedTeam(team);
                            setOpen(true);
                          }}
                        >
                          {team.name}
                        </Button>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={team.isComplete ? "success" : "secondary"}
                          className="text-xs"
                        >
                          {team.isComplete ? "Complete" : "Incomplete"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {team.paymentStatus ? (
                          <Badge
                            variant={
                              team.paymentStatus === "Paid"
                                ? "success"
                                : team.paymentStatus === "Pending"
                                  ? "warning"
                                  : "default"
                            }
                            className="text-xs"
                          >
                            {team.paymentStatus}
                          </Badge>
                        ) : (
                          <span className="text-sm text-muted-foreground">
                            -
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-3">
                          <span className="text-sm text-muted-foreground">
                            {team.attended ? "Present" : "Absent"}
                          </span>
                          <Switch
                            checked={team.attended}
                            onCheckedChange={() => handleToggleAttendance(team)}
                            disabled={updatingTeamId === team.id}
                          />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Team details Dialog */}
      <TeamDetailsDialog
        open={open}
        setOpen={setOpen}
        teamId={selectedTeam?.id || null}
      />
    </div>
  );
}

const formatDate = (date: Date) => {
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

function TeamDetailsDialog({
  open,
  setOpen,
  teamId,
}: {
  open: boolean;
  setOpen: (open: boolean) => void;
  teamId: string | null;
}) {
  const [loading, setLoading] = useState(false);
  const [teamDetails, setTeamDetails] = useState<TeamDetails | null>(null);
  const [updatingMemberId, setUpdatingMemberId] = useState<string | null>(null);

  useEffect(() => {
    if (teamId) {
      setLoading(true);
      (async () => {
        const result = await getTeamDetails(teamId);
        setTeamDetails(result);
        setLoading(false);
      })();
    }
  }, [teamId]);

  const handleToggleMemberAttendance = async (
    participantId: string,
    attended: boolean,
  ) => {
    setUpdatingMemberId(participantId);
    const success = await toggleParticipantAttendance(participantId, attended);

    if (success) {
      setTeamDetails((prevDetails) => {
        if (!prevDetails) return prevDetails;
        return {
          ...prevDetails,
          members: prevDetails.members.map((member) =>
            member.participantId === participantId
              ? { ...member, attended }
              : member,
          ),
        };
      });
    }
    setUpdatingMemberId(null);
  };

  if (teamId === null) {
    return null;
  }

  if (loading) {
    return (
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-sans">Team Details</DialogTitle>
            <CardContent className="flex items-center justify-center py-12 font-sans">
              <div className="flex items-center gap-2">
                <Loader2 className="h-5 w-5 animate-spin" />
                <p className="text-muted-foreground">Loading team details...</p>
              </div>
            </CardContent>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    );
  }

  if (teamDetails === null) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-sans text-xl">Team Details</DialogTitle>
          <DialogDescription className="font-sans">
            View detailed information about the team and its members.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-6">
          {/* Team Overview Card */}
          <Card>
            <CardHeader className="font-sans">
              <CardTitle className="text-lg flex items-center justify-between">
                <span>{teamDetails.name}</span>
                <Badge variant={teamDetails.attended ? "success" : "secondary"}>
                  {teamDetails.attended ? "Present" : "Absent"}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="font-sans">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Status</p>
                  <Badge
                    variant={teamDetails.isComplete ? "success" : "secondary"}
                  >
                    {teamDetails.isComplete ? "Complete" : "Incomplete"}
                  </Badge>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Payment</p>
                  <Badge
                    variant={
                      teamDetails.paymentStatus === "Paid"
                        ? "success"
                        : teamDetails.paymentStatus === "Pending"
                          ? "warning"
                          : "default"
                    }
                  >
                    {teamDetails.paymentStatus || "N/A"}
                  </Badge>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">College</p>
                  <p className="text-sm font-medium">{teamDetails.college}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">State</p>
                  <p className="text-sm font-medium">{teamDetails.state}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Created At</p>
                  <p className="text-sm">{formatDate(teamDetails.createdAt)}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Last Updated</p>
                  <p className="text-sm">{formatDate(teamDetails.updatedAt)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Team Members Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold font-sans">
                Team Members ({teamDetails.members.length})
              </h3>
            </div>

            <div className="space-y-3">
              {teamDetails.members.map((member) => (
                <Card key={member.participantId}>
                  <CardContent className="p-4 font-sans">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <h4 className="font-semibold text-base font-sans">
                              {member.name || "N/A"}
                            </h4>
                            {member.isLeader && (
                              <Badge
                                variant="default"
                                className="text-xs font-sans"
                              >
                                Team Leader
                              </Badge>
                            )}
                            <Badge
                              variant={
                                member.attended ? "success" : "secondary"
                              }
                              className="text-xs font-sans"
                            >
                              {member.attended ? "Present" : "Absent"}
                            </Badge>
                          </div>
                          <div className="flex items-end justify-end gap-3">
                            <span className="text-sm text-muted-foreground">
                              {member.attended ? "Present" : "Absent"}
                            </span>
                            <Switch
                              checked={member.attended}
                              onCheckedChange={() => {
                                handleToggleMemberAttendance(
                                  member.participantId,
                                  !member.attended,
                                );
                              }}
                              disabled={
                                updatingMemberId === member.participantId
                              }
                            />
                          </div>
                        </div>

                        <p className="text-sm text-muted-foreground">
                          {member.email || "N/A"}
                        </p>

                        <div className="flex flex-wrap gap-2 pt-2">
                          <div className="flex items-center gap-1.5 text-xs">
                            <span className="text-muted-foreground">
                              College:
                            </span>
                            <span className="font-medium">
                              {member.college}
                            </span>
                          </div>
                          <span className="text-muted-foreground">•</span>
                          <div className="flex items-center gap-1.5 text-xs">
                            <span className="text-muted-foreground">
                              State:
                            </span>
                            <span className="font-medium">{member.state}</span>
                          </div>
                          <span className="text-muted-foreground">•</span>
                          <div className="flex items-center gap-1.5 text-xs">
                            <span className="text-muted-foreground">
                              Gender:
                            </span>
                            <span className="font-medium">{member.gender}</span>
                          </div>
                        </div>

                        <div className="pt-2 border-t">
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span>User ID: {member.userId.slice(0, 8)}...</span>
                            <span>
                              Participant ID: {member.participantId.slice(0, 8)}
                              ...
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Empty state for no members */}
          {teamDetails.members.length === 0 && (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-8">
                <Alert className="max-w-md">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    No team members found for this team.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t font-sans">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

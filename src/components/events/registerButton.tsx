import { useState } from "react";
import { apiFetch } from "~/lib/fetcher";
import { Button } from "../ui/button";
import type { Event } from "./layout";
import { TeamDetailsDialog } from "./teamDetails";
import TeamRegistrationDialog from "./teamRegistrationDialog";

export default function RegisterButton({
  event,
  fetchEvents,
}: {
  event: Event;
  fetchEvents: () => Promise<void>;
}) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [teamDialogOpen, setTeamDialogOpen] = useState(false);
  const userStatus =
    event.type === "Solo"
      ? event.team?.id
        ? event.isComplete
          ? "registered"
          : "not_confirmed"
        : "not_registered"
      : event.team?.id
        ? event.isLeader
          ? "leader"
          : "member"
        : "not_registered";

  const baseClass =
    "w-full py-6 text-xl text-[#0b2545] cursor-pointer capitalize shrink-0 flex gap-2 items-center justify-center hover:brightness-110 transition-all duration-300 bg-linear-to-r from-[#cfb536] to-[#c2a341]";

  const onRegister = async () => {
    await apiFetch(`/api/events/${event.id}/register`, { method: "POST" });
    await fetchEvents();
  };

  const onCancel = async () => {
    try {
      await apiFetch(`/api/events/${event.id}/cancel`, { method: "POST" });
      await fetchEvents();
    } catch (error) {
      console.error("Cancel error:", error);
    }
  };

  // SOLO EVENT
  if (event.type === "Solo") {
    return userStatus === "registered" ? (
      <Button onClick={onCancel} className={baseClass}>
        Cancel Registration
      </Button>
    ) : (
      <Button onClick={onRegister} className={baseClass}>
        Register Now
      </Button>
    );
  }

  // TEAM EVENT
  return (
    <>
      {userStatus === "not_registered" ? (
        <Button onClick={() => setDialogOpen(true)} className={baseClass}>
          Register Now
        </Button>
      ) : (
        <Button onClick={() => setTeamDialogOpen(true)} className={baseClass}>
          Team Details
        </Button>
      )}

      <TeamRegistrationDialog
        eventId={event.id}
        fetchEvents={fetchEvents}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        setTeamDialogOpen={setTeamDialogOpen}
      />
      {event.team && (
        <TeamDetailsDialog
          team={event.team} // pass the team object from your event data
          members={event.teamMembers ?? []} // pass the team members from your event data
          isLeader={event.isLeader ?? false} // pass from event.isLeader
          open={teamDialogOpen}
          onOpenChange={setTeamDialogOpen}
          fetchEvents={fetchEvents}
        />
      )}
    </>
  );
}

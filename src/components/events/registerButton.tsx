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

  const baseClass =
    "w-full py-6 text-xl text-[#0b2545] cursor-pointer capitalize shrink-0 flex gap-2 items-center justify-center hover:brightness-110 transition-all duration-300";

  const onRegister = async () => {
    try {
      await apiFetch(`/api/events/${event.id}/solo/register`, {
        method: "POST",
      });
      await fetchEvents();
    } catch (error) {
      console.error("Registration error:", error);
    }
  };

  const onCancel = async () => {
    try {
      await apiFetch(`/api/events/${event.id}/solo/cancel`, { method: "POST" });
      await fetchEvents();
    } catch (error) {
      console.error("Cancel error:", error);
    }
  };

  const onConfirm = async () => {
    try {
      await apiFetch(`/api/events/${event.id}/solo/confirm`, {
        method: "POST",
      });
      await fetchEvents();
    } catch (error) {
      console.error("Confirmation error:", error);
    }
  };

  // SOLO EVENT
  if (event.type === "Solo") {
    return event.userStatus === "registered" ? (
      <Button disabled className={baseClass}>
        Registered
      </Button>
    ) : event.userStatus === "not_confirmed" ? (
      <div className="flex gap-2 w-full">
        <Button onClick={onCancel} className={baseClass}>
          Cancel Registration
        </Button>
        <Button onClick={onConfirm} className={baseClass}>
          Pay to Confirm
        </Button>
      </div>
    ) : (
      <Button onClick={onRegister} className={baseClass}>
        Register Now
      </Button>
    );
  }

  // TEAM EVENT
  return (
    <>
      {event.userStatus === "not_registered" ? (
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
          team={event.team}
          members={event.teamMembers ?? []}
          isLeader={event.isLeader ?? false}
          open={teamDialogOpen}
          onOpenChange={setTeamDialogOpen}
          fetchEvents={fetchEvents}
        />
      )}
    </>
  );
}

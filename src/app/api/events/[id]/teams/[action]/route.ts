import type { NextRequest } from "next/server";
import { protectedEventRoute } from "~/auth/route-handlers";
import { eventRegistrationOpen, findByEventId } from "~/db/data/event";
import { findByEvent } from "~/db/data/event-users";
import {
  confirmEventTeam,
  createEventTeam,
  deleteEventTeam,
  joinEventTeam,
  leaveEventTeam,
} from "~/db/services/event-services";
import { AppError } from "~/lib/errors/app-error";
import { errorResponse } from "~/lib/response/error";

export const POST = protectedEventRoute(
  async (req: NextRequest, context, user) => {
    const registrationsOpen = await eventRegistrationOpen();
    if (!registrationsOpen) {
      return errorResponse(
        new AppError("Registrations closed", 403, {
          title: "Registrations Closed",
          description: "Event registrations are currently closed.",
        }),
      );
    }

    const { id: eventId, action } = await context.params;
    const event = await findByEventId(eventId);
    if (event?.status === "Draft") {
      return errorResponse(
        new AppError("Event not found", 404, {
          title: "Event Not Found",
          description: "The specified event does not exist.",
        }),
      );
    }

    const eventUser = await findByEvent(eventId, user.id);

    if (!eventUser && action !== "create") {
      return errorResponse(
        new AppError("Unauthorized", 401, {
          title: "Unauthorized",
          description: "You are not registered for this event.",
        }),
      );
    } else if (eventUser) {
      if (action === "create") {
        return errorResponse(
          new AppError("Already Registered", 400, {
            title: "Already Registered",
            description: "You are already registered for this event.",
          }),
        );
      }

      if (["confirm", "delete"].includes(action) && !eventUser.isLeader) {
        return errorResponse(
          new AppError("Forbidden", 403, {
            title: "Forbidden",
            description: "Only team leaders can perform this action.",
          }),
        );
      }
    }

    const notRegisteredError = errorResponse(
      new AppError("Unauthorized", 401, {
        title: "Unauthorized",
        description: "You are not registered for this event.",
      }),
    );

    try {
      switch (action) {
        case "create": {
          const { teamName } = await req.json();
          return await createEventTeam(eventId, user.id, teamName);
        }
        case "leave": {
          if (!eventUser) return notRegisteredError;
          return await leaveEventTeam(eventId, user.id, eventUser.teamId);
        }
        case "join": {
          const { teamId } = await req.json();
          return await joinEventTeam(
            eventId,
            user.id,
            user.collegeId ?? "",
            teamId,
          );
        }
        case "confirm": {
          if (!eventUser) return notRegisteredError;
          return await confirmEventTeam(eventId, eventUser.teamId);
        }
        case "delete": {
          if (!eventUser) return notRegisteredError;
          return await deleteEventTeam(eventUser.teamId);
        }
        default:
          return errorResponse(
            new AppError("Unknown action", 400, {
              title: "Unknown Action",
              description: "The specified action is not recognized.",
            }),
          );
      }
    } catch (err) {
      return errorResponse(
        new AppError("Action failed", 500, {
          title: "Action Failed",
          description:
            err instanceof Error ? err.message : "An unknown error occurred.",
        }),
      );
    }
  },
);

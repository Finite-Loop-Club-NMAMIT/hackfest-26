import type { NextRequest } from "next/server";
import { protectedEventRoute } from "~/auth/route-handlers";
import { eventRegistrationOpen, findByEventId } from "~/db/data/event";
import { findByEvent } from "~/db/data/event-users";
import { createEventTeam, deleteEventTeam } from "~/db/services/event-services";
import { AppError } from "~/lib/errors/app-error";
import { errorResponse } from "~/lib/response/error";

export const POST = protectedEventRoute(
  async (_req: NextRequest, context, user) => {
    const registrationsOpen = await eventRegistrationOpen();

    if (!registrationsOpen) {
      return errorResponse(
        new AppError("Registration closed", 403, {
          title: "Registration Closed",
          description: "Event registration is currently closed.",
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

    try {
      switch (action) {
        case "register": {
          if (eventUser) {
            return errorResponse(
              new AppError("Already registered", 400, {
                title: "Registration Failed",
                description: "You are already registered for this event.",
              }),
            );
          }

          return await createEventTeam(eventId, user.id, user.name ?? "", true);
        }
        case "unregister": {
          if (!eventUser) {
            return errorResponse(
              new AppError("Not registered", 400, {
                title: "Unregistration Failed",
                description: "You are not registered for this event.",
              }),
            );
          }

          return await deleteEventTeam(eventUser.teamId);
        }
        default:
          return errorResponse(
            new AppError("Invalid action", 400, {
              title: "Invalid Action",
              description: "The specified action is not valid.",
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

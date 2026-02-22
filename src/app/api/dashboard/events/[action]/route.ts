import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { permissionProtected } from "~/auth/routes-wrapper";
import db from "~/db";
import { query } from "~/db/data";
import { getAllEventsForAdmin } from "~/db/data/events";
import { events } from "~/db/schema";
import { AppError } from "~/lib/errors/app-error";
import { errorResponse } from "~/lib/response/error";
import { successResponse } from "~/lib/response/success";
import { eventSchema } from "~/lib/validation/event";

export const GET = permissionProtected(
  ["events:manage"],
  async (req: Request) => {
    const url = new URL(req.url);
    const action = url.pathname.split("/").pop() || "";
    const searchParams = new URLSearchParams(url.searchParams);

    try {
      switch (action) {
        case "getAllForAdmin":
          return NextResponse.json(await getAllEventsForAdmin());

        case "getAllById": {
          const id = searchParams.get("id");
          console.log(id);
          if (!id) {
            return errorResponse(
              new AppError("Missing required field", 400, {
                toast: true,
                title: "Fetch Failed",
                description: "Event ID is required.",
              }),
            );
          }

          const event = await query.events.findOne({
            where: eq(events.id, id),
          });

          if (!event) {
            return errorResponse(
              new AppError("Event not found", 404, {
                toast: true,
                title: "Fetch Failed",
                description: "The specified event does not exist.",
              }),
            );
          }

          return successResponse(event);
        }

        default:
          return NextResponse.json(
            { success: false, error: "Unknown action" },
            { status: 400 },
          );
      }
    } catch (error) {
      console.error("Events route error:", error);
      return NextResponse.json(
        { success: false, error: (error as Error).message },
        {
          statusText:
            ((error as Error).cause as string) || "Internal Server Error",
        },
      );
    }
  },
);

export const POST = permissionProtected(
  ["events:manage"],
  async (req: Request) => {
    const url = new URL(req.url);
    const action = url.pathname.split("/").pop() || "";

    switch (action) {
      case "updateStatus": {
        const { eventId, newStatus } = await req.json();
        if (!eventId || !newStatus) {
          return errorResponse(
            new AppError("Missing required fields", 400, {
              toast: true,
              title: "Update Failed",
              description: "Event ID and new status are required.",
            }),
          );
        }
        const dbResult = await db
          .update(events)
          .set({ status: newStatus })
          .where(eq(events.id, eventId))
          .returning();

        if (dbResult.length === 0) {
          return errorResponse(
            new AppError("Event not found", 404, {
              toast: true,
              title: "Update Failed",
              description: "The specified event does not exist.",
            }),
          );
        }

        return successResponse(dbResult[0], {
          toast: true,
          title: "Status Updated",
          description: `Event status has been updated to ${newStatus}.`,
        });
      }

      case "update": {
        const { id, data } = await req.json();
        const parsedData = eventSchema.safeParse({
          ...data,
          date: data.date ? new Date(data.date) : new Date(),
          deadline: data.deadline ? new Date(data.deadline) : new Date(),
        });

        if (!id) {
          return errorResponse(
            new AppError("Missing required field", 400, {
              toast: true,
              title: "Update Failed",
              description: "Event ID is required.",
            }),
          );
        }
        if (!parsedData.success) {
          return errorResponse(
            new AppError("Validation failed", 400, {
              toast: true,
              title: "Update Failed",
              description: parsedData.error.issues
                .map((err) => `${err.path.join(".")}: ${err.message}`)
                .join("; "),
            }),
          );
        }

        const existingEvent = await query.events.findOne({
          where: eq(events.id, id),
        });

        if (!existingEvent) {
          return errorResponse(
            new AppError("Event not found or cannot be updated", 404, {
              toast: true,
              title: "Update Failed",
              description: "The specified event does not exist",
            }),
          );
        }
        if (existingEvent.status !== "Draft") {
          return errorResponse(
            new AppError("Event is not in Draft status", 400, {
              toast: true,
              title: "Update Failed",
              description:
                "The event is not in Draft status and cannot be updated.",
            }),
          );
        }

        const updateResult = await query.events.update(id, parsedData.data);

        return successResponse(updateResult, {
          toast: true,
          title: "Event Updated",
          description: "The event has been updated successfully.",
        });
      }

      default:
        return NextResponse.json(
          { success: false, error: "Unknown action" },
          { status: 404 },
        );
    }
  },
);

export const DELETE = permissionProtected(
  ["events:manage"],
  async (req: Request) => {
    const url = new URL(req.url);
    const action = url.pathname.split("/").pop() || "";

    switch (action) {
      case "delete": {
        const { eventId } = await req.json();
        if (!eventId) {
          return errorResponse(
            new AppError("Missing required field", 400, {
              toast: true,
              title: "Delete Failed",
              description: "Event ID is required.",
            }),
          );
        }
        const deleteResult = await db
          .delete(events)
          .where(eq(events.id, eventId))
          .returning();
        if (deleteResult.length === 0) {
          return errorResponse(
            new AppError("Event not found", 404, {
              toast: true,
              title: "Delete Failed",
              description: "The specified event does not exist.",
            }),
          );
        }
        return successResponse(deleteResult[0], {
          toast: true,
          title: "Event Deleted",
          description: "The event has been deleted successfully.",
        });
      }

      default:
        return NextResponse.json(
          { success: false, error: "Unknown action" },
          { status: 404 },
        );
    }
  },
);

export const PUT = permissionProtected(
  ["events:manage"],
  async (req: Request) => {
    const url = new URL(req.url);
    const action = url.pathname.split("/").pop() || "";

    switch (action) {
      case "create": {
        const data = await req.json();
        const parsedData = eventSchema.safeParse({
          ...data,
          date: data.date ? new Date(data.date) : new Date(),
          deadline: data.deadline ? new Date(data.deadline) : new Date(),
        });
        console.log(parsedData);

        if (!parsedData.success) {
          return errorResponse(
            new AppError("Validation failed", 400, {
              toast: true,
              title: "Creation Failed",
              description: parsedData.error.issues
                .map((err) => `${err.path.join(".")}: ${err.message}`)
                .join("; "),
            }),
          );
        }

        const newEvent = await db
          .insert(events)
          .values(parsedData.data)
          .returning();

        if (newEvent.length === 0) {
          return errorResponse(
            new AppError("Failed to create event", 500, {
              toast: true,
              title: "Creation Failed",
              description:
                "An unknown error occurred while creating the event.",
            }),
          );
        }

        return successResponse(newEvent[0], {
          toast: true,
          title: "Event Created",
          description: "The event has been created successfully.",
        });
      }

      default:
        return NextResponse.json(
          { success: false, error: "Unknown action" },
          { status: 404 },
        );
    }
  },
);

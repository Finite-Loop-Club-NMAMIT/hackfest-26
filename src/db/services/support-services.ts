import { eq } from "drizzle-orm";
import db from "~/db";
import { participants, support, teams } from "~/db/schema";
import { AppError } from "~/lib/errors/app-error";
import { errorResponse } from "~/lib/response/error";
import { sendSupportIssueEmail } from "~/lib/mail";
import { successResponse } from "~/lib/response/success";

export async function createSupportTicket(userId: string, description: string) {
  const user = await db.query.participants.findFirst({
    where: eq(participants.id, userId),
  });

  if (!user || !user.teamId) {
    return errorResponse(
      new AppError("NOT_IN_TEAM", 403, {
        title: "Access Denied",
        description: "You must be in a team to report an issue.",
      }),
    );
  }

  const team = await db.query.teams.findFirst({
    where: eq(teams.id, user.teamId),
    with: {
      selected: true,
      labTeam: {
        with: {
          lab: true,
        },
      },
    },
  });

  if (!team || !team.attended || !team.selected) {
    return errorResponse(
      new AppError("ACCESS_DENIED", 403, {
        title: "Access Denied",
        description: "Only selected and attending teams can report issues.",
      }),
    );
  }

  const ticket = await db
    .insert(support)
    .values({
      description,
      teamId: team.id,
      submittedBy: userId,
    })
    .returning();

  // Fire-and-forget: don't block the response on email delivery
  void sendSupportIssueEmail({
    teamName: team.name,
    teamNo: team.selected?.teamNo ?? null,
    submitterName: user.name ?? "Unknown",
    description,
    labName: team.labTeam?.lab?.name ?? null,
  });

  return successResponse(ticket[0], {
    title: "Issue Reported",
    description: "Technical support will get back to you soon.",
  });
}

export async function fetchSupportTickets() {
  const result = await db.query.support.findMany({
    with: {
      submitter: true,
      team: {
        with: {
          selected: true,
          labTeam: {
            with: {
              lab: true,
            },
          },
        },
      },
    },
    orderBy: support.createdAt,
  });

  const tickets = result.map((ticket) => ({
    id: ticket.id,
    description: ticket.description,
    isResolved: ticket.isResolved,
    createdAt: ticket.createdAt,
    teamName: ticket.team?.name ?? "",
    teamNo: ticket.team?.selected?.teamNo ?? null,
    labName: ticket.team?.labTeam?.lab?.name ?? null,
    submitterName: ticket.submitter?.name ?? null,
  }));

  return successResponse(tickets, {
    title: "Support Tickets",
    description: "List of all submitted support tickets.",
  });
}

export async function resolveSupportTicket(
  ticketId: string,
  isResolved: boolean,
) {
  const ticket = await db.query.support.findFirst({
    where: eq(support.id, ticketId),
  });

  if (!ticket) {
    return errorResponse(
      new AppError("NOT_FOUND", 404, {
        title: "Ticket Not Found",
        description: "The specified support ticket does not exist.",
      }),
    );
  }

  if (ticket?.isResolved === isResolved) {
    return errorResponse(
      new AppError("NO_CHANGE", 400, {
        title: "No Change",
        description: `Ticket is already marked as ${isResolved ? "resolved" : "unresolved"}.`,
      }),
    );
  }

  const resolved = await db
    .update(support)
    .set({ isResolved })
    .where(eq(support.id, ticketId))
    .returning();

  return successResponse(resolved[0], {
    title: "Ticket Updated",
    description: `Support ticket marked as ${isResolved ? "resolved" : "unresolved"}.`,
  });
}

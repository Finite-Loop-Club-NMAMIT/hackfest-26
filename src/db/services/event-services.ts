import db from "~/db";
import { query } from "~/db/data";
import {
  addParticipant,
  deleteParticipant,
  findByEvent,
  findById,
  findMembersByTeam,
  updateById,
} from "~/db/data/event-users";
import { eventParticipants, eventTeams } from "~/db/schema";
import { AppError } from "~/lib/errors/app-error";
import { errorResponse } from "~/lib/response/error";
import { successResponse } from "~/lib/response/success";
import type { UpdateEventUserInput } from "~/lib/validation/event";
import { eventRegistrationOpen, findByEventId } from "../data/event";
import { findByIdandEvent, memberCount, teamCount } from "../data/event-teams";

export async function getAllEvents(userId?: string) {
  const registrationsOpen = await eventRegistrationOpen();
  const events = await query.events.findMany({
    where: (events, { eq, not }) => not(eq(events.status, "Draft")),
    orderBy: (events, { desc }) => desc(events.date),
  });

  if (!userId)
    return successResponse({ events, registrationsOpen }, { toast: false });

  const participants = await query.eventParticipants.findMany({});
  const teams = await query.eventTeams.findMany({});
  const users = await query.eventUsers.findMany({});
  const usersMap = new Map(
    users.map((u) => [u.id, { name: u.name, email: u.email }]),
  );

  const res = events.map(async (e) => {
    const participant = participants.find(
      (p) => p.eventId === e.id && p.userId === userId,
    );

    if (!participant)
      return {
        ...e,
        team: null,
        isComplete: false,
        isLeader: false,
        teamMembers: [],
      };
    const team = teams.find((t) => t.id === participant.teamId);
    const members = participants.filter((p) => p.teamId === team?.id);

    return {
      ...e,
      team: team,
      isComplete: team?.isComplete,
      isLeader: participant.isLeader,
      teamMembers: members.map((em) => ({
        ...em,
        name: usersMap.get(em.userId)?.name ?? "Unknown User",
        email: usersMap.get(em.userId)?.email ?? "Unknown Email",
      })),
    };
  });

  return successResponse(
    { events: await Promise.all(res), registrationsOpen },
    { toast: false },
  );
}

export async function updateUserDetails(
  userId: string,
  data: UpdateEventUserInput,
) {
  const user = await findById(userId);

  if (user?.gender || user?.state || user?.collegeId) {
    return errorResponse(
      new AppError("USER_DETAILS_ALREADY_SET", 400, {
        title: "User details already set",
        description:
          "You have already set your user details. You cannot update them again.",
      }),
    );
  }

  const updatedUser = await updateById(userId, data);

  if (!updatedUser) {
    return errorResponse(
      new AppError("USER_UPDATE_FAILED", 500, {
        title: "User update failed",
        description:
          "An error occurred while updating your your details. Please try again.",
      }),
    );
  }

  return successResponse(
    { user: updatedUser },
    {
      title: "User details updated",
      description: "Your user details have been updated successfully.",
    },
  );
}

export async function createEventTeam(
  eventId: string,
  userId: string,
  teamName: string,
  confirm = false,
) {
  const event = await findByEventId(eventId);

  const teams = await teamCount(eventId);

  if (event && teams >= event.maxTeams)
    return errorResponse(
      new AppError("MAX_TEAMS_REACHED", 400, {
        title: "Max teams reached",
        description:
          "The maximum number of teams for this event has been reached.",
      }),
    );

  const eventTeam = await db.transaction(async (tx) => {
    const [team] = await tx
      .insert(eventTeams)
      .values({
        eventId: eventId,
        name: teamName,
        isComplete: confirm,
      })
      .returning();

    await tx.insert(eventParticipants).values({
      eventId: eventId,
      teamId: team.id,
      userId: userId,
      isLeader: true,
    });

    return team;
  });

  if (!eventTeam) {
    return errorResponse(
      new AppError("TEAM_CREATION_FAILED", 500, {
        title: "Team creation failed",
        description:
          "An error occurred while creating the team. Please try again.",
      }),
    );
  }
  console.log("Created team:", eventTeam);

  return successResponse(
    { team: eventTeam },
    {
      title: "Team Created",
      description: "Your team has been created successfully.",
    },
  );
}

export async function leaveEventTeam(
  eventId: string,
  teamId: string,
  userId: string,
) {
  const participant = await findByEvent(eventId, userId);

  if (!participant)
    return errorResponse(
      new AppError("NOT_IN_TEAM", 400, {
        title: "Not in team",
        description: "You are not a member of this team.",
      }),
    );

  const team = await findByIdandEvent(eventId, teamId);

  if (team?.isComplete)
    return errorResponse(
      new AppError("TEAM_ALREADY_CONFIRMED", 400, {
        title: "Team already confirmed",
        description: "You cannot leave a team that has already been confirmed.",
      }),
    );

  return successResponse(
    { team: await deleteParticipant(participant.id) },
    {
      title: "Left Team",
      description: "You have left the team successfully.",
    },
  );
}

export async function joinEventTeam(
  eventId: string,
  userId: string,
  collegeId: string,
  teamId: string,
) {
  if (!collegeId)
    return errorResponse(
      new AppError("COLLEGE_ID_REQUIRED", 400, {
        title: "College ID required",
        description: "You must have a college ID to join a team.",
      }),
    );

  const team = await findByIdandEvent(eventId, teamId);

  if (!team)
    return errorResponse(
      new AppError("TEAM_NOT_FOUND", 404, {
        title: "Team not found",
        description: "The team you are trying to join does not exist.",
      }),
    );

  const members = await findMembersByTeam(teamId);
  const leader = members.find((m) => m.isLeader);
  const leaderCollegeId = (await findById(leader?.userId ?? ""))?.collegeId;

  if (leaderCollegeId !== collegeId)
    return errorResponse(
      new AppError("COLLEGE_MISMATCH", 400, {
        title: "College mismatch",
        description: "You can only join teams from your own college.",
      }),
    );

  const participant = await addParticipant(eventId, teamId, userId, false);

  if (!participant)
    return errorResponse(
      new AppError("JOIN_TEAM_FAILED", 500, {
        title: "Join team failed",
        description:
          "An error occurred while joining the team. Please try again.",
      }),
    );

  return successResponse(
    { team: participant },
    {
      title: "Joined Team",
      description: "You have joined the team successfully.",
    },
  );
}

export async function confirmEventTeam(eventId: string, teamId: string) {
  const event = await findByEventId(eventId);
  const members = await memberCount(eventId, teamId);

  if (event && members < event.minTeamSize)
    return errorResponse(
      new AppError("MIN_TEAM_SIZE_NOT_MET", 400, {
        title: "Minimum team size not met",
        description: `Your team must have at least ${event.minTeamSize} members to be confirmed.`,
      }),
    );

  const teams = await teamCount(eventId);

  if (event && teams > event.maxTeams)
    return errorResponse(
      new AppError("MAX_TEAMS_REACHED", 400, {
        title: "Max teams reached",
        description:
          "The maximum number of teams for this event has been reached.",
      }),
    );

  return successResponse(
    { team: await query.eventTeams.update(teamId, { isComplete: true }) },
    {
      title: "Team Confirmed",
      description: "Your team has been confirmed successfully.",
    },
  );
}

export async function deleteEventTeam(teamId: string) {
  return successResponse(
    { team: await query.eventTeams.delete(teamId) },
    {
      title: "Team Deleted",
      description: "Your team has been deleted successfully.",
    },
  );
}

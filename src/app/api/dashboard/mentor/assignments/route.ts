import { and, asc, eq, inArray } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { adminProtected } from "~/auth/routes-wrapper";
import db from "~/db";
import {
  dashboardUserRoles,
  dashboardUsers,
  mentorRoundAssignments,
  mentors,
  roles,
  teams,
} from "~/db/schema";

const updateAssignmentsSchema = z.object({
  mentorRoundId: z.string().min(1, "Mentor round is required"),
  mentorUserId: z.string().min(1, "Mentor user is required"),
  teamIds: z.array(z.string()).default([]),
});

const copyAssignmentsSchema = z.object({
  targetMentorRoundId: z.string().min(1, "Target mentor round is required"),
  sourceMentorRoundId: z.string().min(1, "Source mentor round is required"),
  overwriteExisting: z.boolean().default(false),
});

export const GET = adminProtected(async (req: NextRequest) => {
  try {
    const { searchParams } = new URL(req.url);
    const mentorRoundId = searchParams.get("mentorRoundId");
    const mentorUserId = searchParams.get("mentorUserId");

    const mentorUsers = await db
      .select({
        id: dashboardUsers.id,
        name: dashboardUsers.name,
        username: dashboardUsers.username,
      })
      .from(dashboardUsers)
      .innerJoin(
        dashboardUserRoles,
        and(
          eq(dashboardUserRoles.dashboardUserId, dashboardUsers.id),
          eq(dashboardUserRoles.isActive, true),
        ),
      )
      .innerJoin(roles, eq(roles.id, dashboardUserRoles.roleId))
      .where(eq(roles.name, "MENTOR"))
      .orderBy(asc(dashboardUsers.name));

    const uniqueMentorUsers = Array.from(
      new Map(mentorUsers.map((user) => [user.id, user])).values(),
    );

    const allTeams = await db
      .select({ id: teams.id, name: teams.name })
      .from(teams)
      .orderBy(asc(teams.name));

    let assignedTeamIds: string[] = [];

    if (mentorRoundId && mentorUserId) {
      const mentor = await db.query.mentors.findFirst({
        where: (m, { eq }) => eq(m.dashboardUserId, mentorUserId),
      });

      if (mentor) {
        const assignments = await db
          .select({ teamId: mentorRoundAssignments.teamId })
          .from(mentorRoundAssignments)
          .where(
            and(
              eq(mentorRoundAssignments.mentorRoundId, mentorRoundId),
              eq(mentorRoundAssignments.mentorId, mentor.id),
            ),
          );

        assignedTeamIds = assignments.map((assignment) => assignment.teamId);
      }
    }

    return NextResponse.json(
      {
        mentorUsers: uniqueMentorUsers,
        teams: allTeams,
        assignedTeamIds,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error fetching mentor assignments:", error);
    return NextResponse.json(
      { message: "Failed to fetch mentor assignments" },
      { status: 500 },
    );
  }
});

export const POST = adminProtected(async (req: NextRequest) => {
  try {
    const body = await req.json();
    const result = updateAssignmentsSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { message: "Invalid input", errors: result.error.format() },
        { status: 400 },
      );
    }

    const { mentorRoundId, mentorUserId, teamIds } = result.data;

    const existingRound = await db.query.mentorRounds.findFirst({
      where: (round, { eq }) => eq(round.id, mentorRoundId),
    });

    if (!existingRound) {
      return NextResponse.json(
        { message: "Mentor round not found" },
        { status: 404 },
      );
    }

    if (existingRound.status === "Completed") {
      return NextResponse.json(
        { message: "Round is completed and cannot be modified" },
        { status: 409 },
      );
    }

    const mentorUser = await db.query.dashboardUsers.findFirst({
      where: (u, { eq }) => eq(u.id, mentorUserId),
    });

    if (!mentorUser) {
      return NextResponse.json(
        { message: "Mentor user not found" },
        { status: 404 },
      );
    }

    const hasMentorRole = await db
      .select({ id: roles.id })
      .from(dashboardUserRoles)
      .innerJoin(roles, eq(roles.id, dashboardUserRoles.roleId))
      .where(
        and(
          eq(dashboardUserRoles.dashboardUserId, mentorUserId),
          eq(dashboardUserRoles.isActive, true),
          eq(roles.name, "MENTOR"),
        ),
      )
      .limit(1);

    if (hasMentorRole.length === 0) {
      return NextResponse.json(
        { message: "Selected user does not have MENTOR role" },
        { status: 400 },
      );
    }

    let mentor = await db.query.mentors.findFirst({
      where: (m, { eq }) => eq(m.dashboardUserId, mentorUserId),
    });

    if (!mentor) {
      const [createdMentor] = await db
        .insert(mentors)
        .values({ dashboardUserId: mentorUserId })
        .returning();
      mentor = createdMentor;
    }

    const existingAssignments = await db
      .select({
        id: mentorRoundAssignments.id,
        teamId: mentorRoundAssignments.teamId,
      })
      .from(mentorRoundAssignments)
      .where(
        and(
          eq(mentorRoundAssignments.mentorRoundId, mentorRoundId),
          eq(mentorRoundAssignments.mentorId, mentor.id),
        ),
      );

    const existingTeamIds = new Set(existingAssignments.map((a) => a.teamId));
    const requestedTeamIds = new Set(teamIds);

    const toRemove = existingAssignments
      .filter((assignment) => !requestedTeamIds.has(assignment.teamId))
      .map((assignment) => assignment.id);

    const toAdd = teamIds.filter((teamId) => !existingTeamIds.has(teamId));

    if (toRemove.length > 0) {
      await db
        .delete(mentorRoundAssignments)
        .where(inArray(mentorRoundAssignments.id, toRemove));
    }

    if (toAdd.length > 0) {
      await db.insert(mentorRoundAssignments).values(
        toAdd.map((teamId) => ({
          mentorId: mentor.id,
          teamId,
          mentorRoundId,
        })),
      );
    }

    return NextResponse.json(
      {
        message: "Mentor assignments updated successfully",
        assignedTeamIds: teamIds,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error updating mentor assignments:", error);
    return NextResponse.json(
      { message: "Failed to update mentor assignments" },
      { status: 500 },
    );
  }
});

export const PATCH = adminProtected(async (req: NextRequest) => {
  try {
    const body = await req.json();
    const result = copyAssignmentsSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { message: "Invalid input", errors: result.error.format() },
        { status: 400 },
      );
    }

    const { sourceMentorRoundId, targetMentorRoundId, overwriteExisting } =
      result.data;

    if (sourceMentorRoundId === targetMentorRoundId) {
      return NextResponse.json(
        { message: "Source and target rounds must be different" },
        { status: 400 },
      );
    }

    const targetRound = await db.query.mentorRounds.findFirst({
      where: (round, { eq }) => eq(round.id, targetMentorRoundId),
    });

    if (!targetRound) {
      return NextResponse.json(
        { message: "Target mentor round not found" },
        { status: 404 },
      );
    }

    if (targetRound.status === "Completed") {
      return NextResponse.json(
        { message: "Target round is completed and cannot be modified" },
        { status: 409 },
      );
    }

    const sourceRound = await db.query.mentorRounds.findFirst({
      where: (round, { eq }) => eq(round.id, sourceMentorRoundId),
    });

    if (!sourceRound) {
      return NextResponse.json(
        { message: "Source mentor round not found" },
        { status: 404 },
      );
    }

    const sourceAssignments = await db
      .select({
        mentorId: mentorRoundAssignments.mentorId,
        teamId: mentorRoundAssignments.teamId,
      })
      .from(mentorRoundAssignments)
      .where(eq(mentorRoundAssignments.mentorRoundId, sourceMentorRoundId));

    if (sourceAssignments.length === 0) {
      return NextResponse.json(
        { message: "Source round has no mentor assignments" },
        { status: 400 },
      );
    }

    if (overwriteExisting) {
      await db
        .delete(mentorRoundAssignments)
        .where(eq(mentorRoundAssignments.mentorRoundId, targetMentorRoundId));
    }

    const existingAssignments = await db
      .select({
        mentorId: mentorRoundAssignments.mentorId,
        teamId: mentorRoundAssignments.teamId,
      })
      .from(mentorRoundAssignments)
      .where(eq(mentorRoundAssignments.mentorRoundId, targetMentorRoundId));

    const existingSet = new Set(
      existingAssignments.map(
        (assignment) => `${assignment.mentorId}:${assignment.teamId}`,
      ),
    );

    const toInsert = sourceAssignments
      .filter(
        (assignment) =>
          !existingSet.has(`${assignment.mentorId}:${assignment.teamId}`),
      )
      .map((assignment) => ({
        mentorId: assignment.mentorId,
        teamId: assignment.teamId,
        mentorRoundId: targetMentorRoundId,
      }));

    if (toInsert.length > 0) {
      await db.insert(mentorRoundAssignments).values(toInsert);
    }

    return NextResponse.json(
      {
        message: "Mentor assignments copied successfully",
        copiedCount: toInsert.length,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error copying mentor assignments:", error);
    return NextResponse.json(
      { message: "Failed to copy mentor assignments" },
      { status: 500 },
    );
  }
});

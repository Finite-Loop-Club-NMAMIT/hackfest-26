import { and, asc, eq, inArray } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { adminProtected } from "~/auth/routes-wrapper";
import db from "~/db";
import {
  dashboardUserRoles,
  dashboardUsers,
  ideaSubmission,
  labTeams,
  panelists,
  panelRoundAssignments,
  roles,
  selected,
  teams,
  tracks,
} from "~/db/schema";

const updateAssignmentsSchema = z.object({
  panelRoundId: z.string().min(1, "Panel round is required"),
  panelistUserId: z.string().min(1, "Panelist user is required"),
  teamIds: z.array(z.string()).default([]),
});

export const GET = adminProtected(async (req: NextRequest) => {
  try {
    const { searchParams } = new URL(req.url);
    const panelRoundId = searchParams.get("panelRoundId");
    const panelistUserId = searchParams.get("panelistUserId");

    const panelistUsers = await db
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
      .where(inArray(roles.name, ["PANELIST"]))
      .orderBy(asc(dashboardUsers.name));

    const uniquePanelistUsers = Array.from(
      new Map(panelistUsers.map((user) => [user.id, user])).values(),
    );

    const allTeams = await db
      .select({
        id: teams.id,
        name: teams.name,
        trackId: tracks.id,
        labId: labTeams.labId,
      })
      .from(teams)
      .innerJoin(selected, eq(selected.teamId, teams.id))
      .leftJoin(ideaSubmission, eq(ideaSubmission.teamId, teams.id))
      .leftJoin(tracks, eq(tracks.id, ideaSubmission.trackId))
      .leftJoin(labTeams, eq(labTeams.teamId, teams.id));

    let assignedTeamIds: string[] = [];

    if (panelRoundId && panelistUserId) {
      const panelist = await db.query.panelists.findFirst({
        where: (p, { eq }) => eq(p.dashboardUserId, panelistUserId),
      });

      if (panelist) {
        const assignments = await db
          .select({ teamId: panelRoundAssignments.teamId })
          .from(panelRoundAssignments)
          .where(
            and(
              eq(panelRoundAssignments.panelRoundId, panelRoundId),
              eq(panelRoundAssignments.panelistId, panelist.id),
            ),
          );

        assignedTeamIds = assignments.map((assignment) => assignment.teamId);
      }
    }

    const panelAssignments = await db.query.panelRoundAssignments.findMany();
    const panelScore = await db.query.panelScores.findMany();

    return NextResponse.json(
      {
        panelistUsers: uniquePanelistUsers,
        teams: allTeams.map((team) => ({
          id: team.id,
          name: team.name,
          trackId: team.trackId || "",
          labId: team.labId || "",
        })),
        assignedTeamIds,
        history: panelScore.map((score) => ({
          ...score,
          teamId:
            panelAssignments.find(
              (assignment) => assignment.id === score.roundAssignmentId,
            )?.teamId ?? null,
        })),
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error fetching panel assignments:", error);
    return NextResponse.json(
      { message: "Failed to fetch panel assignments" },
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

    const { panelRoundId, panelistUserId, teamIds } = result.data;

    const existingRound = await db.query.panelRounds.findFirst({
      where: (round, { eq }) => eq(round.id, panelRoundId),
    });

    if (!existingRound) {
      return NextResponse.json(
        { message: "Panel round not found" },
        { status: 404 },
      );
    }

    if (existingRound.status === "Completed") {
      return NextResponse.json(
        { message: "Round is completed and cannot be modified" },
        { status: 409 },
      );
    }

    const panelistUser = await db.query.dashboardUsers.findFirst({
      where: (u, { eq }) => eq(u.id, panelistUserId),
    });

    if (!panelistUser) {
      return NextResponse.json(
        { message: "Panelist user not found" },
        { status: 404 },
      );
    }

    let panelist = await db.query.panelists.findFirst({
      where: (p, { eq }) => eq(p.dashboardUserId, panelistUserId),
    });

    if (!panelist) {
      const [createdPanelist] = await db
        .insert(panelists)
        .values({ dashboardUserId: panelistUserId })
        .returning();
      panelist = createdPanelist;
    }

    const existingAssignments = await db
      .select({
        id: panelRoundAssignments.id,
        teamId: panelRoundAssignments.teamId,
      })
      .from(panelRoundAssignments)
      .where(
        and(
          eq(panelRoundAssignments.panelRoundId, panelRoundId),
          eq(panelRoundAssignments.panelistId, panelist.id),
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
        .delete(panelRoundAssignments)
        .where(inArray(panelRoundAssignments.id, toRemove));
    }

    if (toAdd.length > 0) {
      await db.insert(panelRoundAssignments).values(
        toAdd.map((teamId) => ({
          panelistId: panelist.id,
          teamId,
          panelRoundId,
        })),
      );
    }

    return NextResponse.json(
      {
        message: "Assignments updated successfully",
        assignedTeamIds: teamIds,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error updating panel assignments:", error);
    return NextResponse.json(
      { message: "Failed to update panel assignments" },
      { status: 500 },
    );
  }
});

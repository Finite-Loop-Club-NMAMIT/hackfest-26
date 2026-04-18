import { eq, inArray, sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { permissionProtected } from "~/auth/routes-wrapper";
import db from "~/db";
import {
  ideaSubmission,
  panelCriterias,
  panelRoundAssignments,
  panelRounds,
  panelScores,
  selected,
  teams,
  tracks,
} from "~/db/schema";

export const GET = permissionProtected(
  ["panel:score"],
  async (_request, _context, user) => {
    try {
      const panelist = await db.query.panelists.findFirst({
        where: (p, { eq }) => eq(p.dashboardUserId, user.id),
      });

      if (!panelist) {
        return NextResponse.json([], { status: 200 });
      }

      const assignments = await db
        .select({
          assignmentId: panelRoundAssignments.id,
          teamId: teams.id,
          teamName: teams.name,
          teamNo: selected.teamNo,
          teamStage: teams.teamStage,
          paymentStatus: teams.paymentStatus,
          roundId: panelRounds.id,
          roundName: panelRounds.name,
          roundStatus: panelRounds.status,
          pptUrl: ideaSubmission.pptUrl,
          trackName: tracks.name,
        })
        .from(panelRoundAssignments)
        .innerJoin(teams, eq(teams.id, panelRoundAssignments.teamId))
        .innerJoin(selected, eq(selected.teamId, teams.id))
        .innerJoin(
          panelRounds,
          eq(panelRounds.id, panelRoundAssignments.panelRoundId),
        )
        .leftJoin(ideaSubmission, eq(ideaSubmission.teamId, teams.id))
        .leftJoin(tracks, eq(tracks.id, ideaSubmission.trackId))
        .where(eq(panelRoundAssignments.panelistId, panelist.id));

      if (assignments.length === 0) {
        return NextResponse.json([], { status: 200 });
      }

      const roundIds = Array.from(new Set(assignments.map((a) => a.roundId)));
      const assignmentIds = assignments.map((a) => a.assignmentId);

      const criteriaStats = await db
        .select({
          roundId: panelCriterias.panelRoundId,
          totalCriteria: sql<number>`count(*)`.mapWith(Number),
          totalMaxScore:
            sql<number>`coalesce(sum(${panelCriterias.maxScore}), 0)`.mapWith(
              Number,
            ),
        })
        .from(panelCriterias)
        .where(inArray(panelCriterias.panelRoundId, roundIds))
        .groupBy(panelCriterias.panelRoundId);

      const scoreStats = await db
        .select({
          assignmentId: panelScores.roundAssignmentId,
          scoredCriteria: sql<number>`count(*)`.mapWith(Number),
          totalRawScore:
            sql<number>`coalesce(sum(${panelScores.rawScore}), 0)`.mapWith(
              Number,
            ),
        })
        .from(panelScores)
        .where(inArray(panelScores.roundAssignmentId, assignmentIds))
        .groupBy(panelScores.roundAssignmentId);

      const criteriaMap = new Map(
        criteriaStats.map((item) => [item.roundId, item]),
      );
      const scoreMap = new Map(
        scoreStats.map((item) => [item.assignmentId, item]),
      );

      const response = assignments.map((assignment) => {
        const criteria =
          criteriaMap.get(assignment.roundId) ??
          ({ totalCriteria: 0, totalMaxScore: 0 } as const);
        const score =
          scoreMap.get(assignment.assignmentId) ??
          ({ scoredCriteria: 0, totalRawScore: 0 } as const);

        return {
          ...assignment,
          scoredCriteria: score.scoredCriteria,
          totalCriteria: criteria.totalCriteria,
          totalRawScore: score.totalRawScore,
          totalMaxScore: criteria.totalMaxScore,
        };
      });

      return NextResponse.json(response, { status: 200 });
    } catch (error) {
      console.error("Error fetching panel allocations:", error);
      return NextResponse.json(
        { message: "Failed to fetch panel allocations" },
        { status: 500 },
      );
    }
  },
);

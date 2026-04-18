import { and, eq, inArray } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { adminProtected } from "~/auth/routes-wrapper";
import db from "~/db";
import {
  dashboardUsers,
  panelCriterias,
  panelists,
  panelRoundAssignments,
  panelScores,
} from "~/db/schema";

export const GET = adminProtected(async (req: NextRequest) => {
  try {
    const { searchParams } = new URL(req.url);
    const panelRoundId = searchParams.get("panelRoundId");
    const teamId = searchParams.get("teamId");

    if (!panelRoundId || !teamId) {
      return NextResponse.json(
        { message: "panelRoundId and teamId are required" },
        { status: 400 },
      );
    }

    const round = await db.query.panelRounds.findFirst({
      where: (r, { eq }) => eq(r.id, panelRoundId),
    });

    if (!round) {
      return NextResponse.json(
        { message: "Panel round not found" },
        { status: 404 },
      );
    }

    const assignments = await db
      .select({
        assignmentId: panelRoundAssignments.id,
        panelistId: panelists.id,
        panelistUserId: dashboardUsers.id,
        panelistName: dashboardUsers.name,
        panelistUsername: dashboardUsers.username,
        rawTotalScore: panelRoundAssignments.rawTotalScore,
        normalizedTotalScore: panelRoundAssignments.normalizedTotalScore,
      })
      .from(panelRoundAssignments)
      .innerJoin(panelists, eq(panelists.id, panelRoundAssignments.panelistId))
      .innerJoin(
        dashboardUsers,
        eq(dashboardUsers.id, panelists.dashboardUserId),
      )
      .where(
        and(
          eq(panelRoundAssignments.panelRoundId, panelRoundId),
          eq(panelRoundAssignments.teamId, teamId),
        ),
      );

    if (assignments.length === 0) {
      return NextResponse.json(
        {
          round: {
            id: round.id,
            name: round.name,
            status: round.status,
          },
          panelists: [],
        },
        { status: 200 },
      );
    }

    const criteria = await db
      .select({
        id: panelCriterias.id,
        criteriaName: panelCriterias.criteriaName,
        maxScore: panelCriterias.maxScore,
      })
      .from(panelCriterias)
      .where(eq(panelCriterias.panelRoundId, panelRoundId));

    const assignmentIds = assignments.map(
      (assignment) => assignment.assignmentId,
    );

    const scoreRows = await db
      .select({
        assignmentId: panelScores.roundAssignmentId,
        criteriaId: panelScores.criteriaId,
        rawScore: panelScores.rawScore,
      })
      .from(panelScores)
      .where(inArray(panelScores.roundAssignmentId, assignmentIds));

    const scoreMap = new Map<string, number>();
    for (const score of scoreRows) {
      if (score.rawScore !== null) {
        scoreMap.set(
          `${score.assignmentId}:${score.criteriaId}`,
          score.rawScore,
        );
      }
    }

    const panelistsWithScores = assignments.map((assignment) => {
      const criteriaScores = criteria.map((criterion) => {
        const rawScore =
          scoreMap.get(`${assignment.assignmentId}:${criterion.id}`) ?? 0;
        return {
          criteriaId: criterion.id,
          criteriaName: criterion.criteriaName,
          maxScore: criterion.maxScore,
          rawScore,
        };
      });

      const totalRawScore = assignment.rawTotalScore ?? 0;
      const totalMaxScore = criteriaScores.reduce(
        (sum, item) => sum + item.maxScore,
        0,
      );

      return {
        panelistId: assignment.panelistId,
        panelistUserId: assignment.panelistUserId,
        panelistName: assignment.panelistName,
        panelistUsername: assignment.panelistUsername,
        assignmentId: assignment.assignmentId,
        totalRawScore,
        totalMaxScore,
        normalizedTotalScore: assignment.normalizedTotalScore ?? 0,
        criteriaScores,
      };
    });

    return NextResponse.json(
      {
        round: {
          id: round.id,
          name: round.name,
          status: round.status,
        },
        panelists: panelistsWithScores,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error fetching panel score details:", error);
    return NextResponse.json(
      { message: "Failed to fetch panel score details" },
      { status: 500 },
    );
  }
});

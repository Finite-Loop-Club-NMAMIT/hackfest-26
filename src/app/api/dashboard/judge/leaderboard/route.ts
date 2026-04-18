import { eq, sql } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { adminProtected } from "~/auth/routes-wrapper";
import db from "~/db";
import { judgeCriterias, teamRoundScores, teams } from "~/db/schema";

export const GET = adminProtected(async (req: NextRequest) => {
  try {
    const { searchParams } = new URL(req.url);
    const judgeRoundId = searchParams.get("judgeRoundId");
    const cumulative = searchParams.get("cumulative") === "true";

    if (!judgeRoundId) {
      return NextResponse.json([], { status: 200 });
    }

    const round = await db.query.judgeRounds.findFirst({
      where: (r, { eq }) => eq(r.id, judgeRoundId),
    });

    if (!round) {
      return NextResponse.json(
        { message: "Judge round not found" },
        { status: 404 },
      );
    }

    // Use normalized scores from teamRoundScores for proper z-score aggregation
    const aggregatedScores = await db
      .select({
        teamId: teamRoundScores.teamId,
        teamName: teams.name,
        rawTotalScore: teamRoundScores.rawTotalScore,
        normalizedTotalScore: teamRoundScores.normalizedTotalScore,
        judgeCount: teamRoundScores.judgeCount,
      })
      .from(teamRoundScores)
      .innerJoin(teams, eq(teams.id, teamRoundScores.teamId))
      .where(eq(teamRoundScores.roundId, judgeRoundId));

    const criteriaTotals = await db
      .select({
        judgeRoundId: judgeCriterias.judgeRoundId,
        totalMaxScore:
          sql<number>`coalesce(sum(${judgeCriterias.maxScore}), 0)`.mapWith(
            Number,
          ),
      })
      .from(judgeCriterias)
      .groupBy(judgeCriterias.judgeRoundId);

    const maxScoreByRoundId = new Map(
      criteriaTotals.map((item) => [item.judgeRoundId, item.totalMaxScore]),
    );
    const maxPerJudge = maxScoreByRoundId.get(judgeRoundId) ?? 0;

    const leaderboard = aggregatedScores
      .filter((row) => row.normalizedTotalScore !== null)
      .map((row) => {
        const maxPossibleScore = maxPerJudge * (row.judgeCount || 1);
        const percentage =
          maxPossibleScore > 0
            ? Number(
                (((row.rawTotalScore ?? 0) / maxPossibleScore) * 100).toFixed(
                  2,
                ),
              )
            : 0;

        return {
          teamId: row.teamId,
          teamName: row.teamName,
          rawTotalScore: row.rawTotalScore ?? 0,
          normalizedTotalScore: row.normalizedTotalScore ?? 0,
          maxPossibleScore,
          percentage,
          judgeCount: row.judgeCount,
        };
      })
      .sort((a, b) => b.normalizedTotalScore - a.normalizedTotalScore)
      .map((row, index) => ({
        rank: index + 1,
        ...row,
      }));

    return NextResponse.json(
      {
        round: {
          id: round.id,
          name: round.name,
          status: round.status,
        },
        cumulative,
        maxPerJudge,
        rows: leaderboard,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error fetching judge leaderboard:", error);
    return NextResponse.json(
      { message: "Failed to fetch judge leaderboard" },
      { status: 500 },
    );
  }
});

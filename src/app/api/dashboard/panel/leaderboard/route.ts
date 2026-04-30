import { eq, sql } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { adminProtected } from "~/auth/routes-wrapper";
import db from "~/db";
import {
  ideaSubmission,
  panelCriterias,
  panelTeamRoundScores,
  teamRoundScores,
  teams,
  tracks,
} from "~/db/schema";

export const GET = adminProtected(async (req: NextRequest) => {
  try {
    const { searchParams } = new URL(req.url);
    const panelRoundId = searchParams.get("panelRoundId");

    if (!panelRoundId) {
      return NextResponse.json([], { status: 200 });
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

    // Panel scores for this round
    const aggregatedScores = await db
      .select({
        teamId: panelTeamRoundScores.teamId,
        teamName: teams.name,
        rawTotalScore: panelTeamRoundScores.rawTotalScore,
        normalizedTotalScore: panelTeamRoundScores.normalizedTotalScore,
        panelistCount: panelTeamRoundScores.panelistCount,
        trackId: ideaSubmission.trackId,
        trackName: tracks.name,
      })
      .from(panelTeamRoundScores)
      .innerJoin(teams, eq(teams.id, panelTeamRoundScores.teamId))
      .leftJoin(
        ideaSubmission,
        eq(ideaSubmission.teamId, panelTeamRoundScores.teamId),
      )
      .leftJoin(tracks, eq(tracks.id, ideaSubmission.trackId))
      .where(eq(panelTeamRoundScores.roundId, panelRoundId));

    // Judge Z-score totals (sum of normalized_total_score across ALL judge rounds per team)
    const judgeZScores = await db
      .select({
        teamId: teamRoundScores.teamId,
        judgeNormalizedTotal:
          sql<number>`coalesce(sum(${teamRoundScores.normalizedTotalScore}), 0)`.mapWith(
            Number,
          ),
      })
      .from(teamRoundScores)
      .groupBy(teamRoundScores.teamId);

    const judgeZScoreMap = new Map(
      judgeZScores.map((row) => [row.teamId, row.judgeNormalizedTotal]),
    );

    const criteriaTotals = await db
      .select({
        panelRoundId: panelCriterias.panelRoundId,
        totalMaxScore:
          sql<number>`coalesce(sum(${panelCriterias.maxScore}), 0)`.mapWith(
            Number,
          ),
      })
      .from(panelCriterias)
      .groupBy(panelCriterias.panelRoundId);

    const maxScoreByRoundId = new Map(
      criteriaTotals.map((item) => [item.panelRoundId, item.totalMaxScore]),
    );
    const maxPerPanelist = maxScoreByRoundId.get(panelRoundId) ?? 0;

    const leaderboard = aggregatedScores
      .filter((row) => row.normalizedTotalScore !== null)
      .map((row) => {
        const maxPossibleScore = maxPerPanelist * (row.panelistCount || 1);
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
          trackId: row.trackId ?? null,
          trackName: row.trackName ?? null,
          rawTotalScore: row.rawTotalScore ?? 0,
          normalizedTotalScore: row.normalizedTotalScore ?? 0,
          maxPossibleScore,
          percentage,
          panelistCount: row.panelistCount,
          judgeNormalizedTotal: judgeZScoreMap.get(row.teamId) ?? 0,
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
        maxPerPanelist,
        rows: leaderboard,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error fetching panel leaderboard:", error);
    return NextResponse.json(
      { message: "Failed to fetch panel leaderboard" },
      { status: 500 },
    );
  }
});

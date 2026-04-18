import { eq } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { adminProtected } from "~/auth/routes-wrapper";
import db from "~/db";
import { judgeRoundAssignments } from "~/db/schema";
import {
  aggregateTeamScores,
  recalculateNormalizedScores,
} from "~/db/services/judge-services";

export const POST = adminProtected(async (req: NextRequest) => {
  try {
    const { roundId } = await req.json();

    if (!roundId) {
      return NextResponse.json(
        { message: "roundId is required" },
        { status: 400 },
      );
    }

    // 1. Get all judges who have assignments in this round
    const assignments = await db
      .select({
        judgeId: judgeRoundAssignments.judgeId,
      })
      .from(judgeRoundAssignments)
      .where(eq(judgeRoundAssignments.judgeRoundId, roundId));

    const uniqueJudgeIds = [...new Set(assignments.map((a) => a.judgeId))];

    console.log(
      `[Normalize API] Found ${uniqueJudgeIds.length} judges for round ${roundId}`,
    );

    // 2. Run normalization for each judge in the round
    for (const judgeId of uniqueJudgeIds) {
      await recalculateNormalizedScores(judgeId, roundId);
    }

    // 3. Aggregate all normalized scores for the round
    await aggregateTeamScores(roundId);

    return NextResponse.json(
      { message: "Scores normalized and aggregated successfully" },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error bulk normalizing scores:", error);
    return NextResponse.json(
      { message: "Failed to normalize scores" },
      { status: 500 },
    );
  }
});

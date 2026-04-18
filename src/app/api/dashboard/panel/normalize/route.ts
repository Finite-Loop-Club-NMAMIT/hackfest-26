import { eq } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { adminProtected } from "~/auth/routes-wrapper";
import db from "~/db";
import { panelRoundAssignments } from "~/db/schema";
import {
  aggregatePanelTeamScores,
  recalculatePanelNormalizedScores,
} from "~/db/services/panel-services";

export const POST = adminProtected(async (req: NextRequest) => {
  try {
    const { roundId } = await req.json();

    if (!roundId) {
      return NextResponse.json(
        { message: "roundId is required" },
        { status: 400 },
      );
    }

    // 1. Get all panelists who have assignments in this round
    const assignments = await db
      .select({
        panelistId: panelRoundAssignments.panelistId,
      })
      .from(panelRoundAssignments)
      .where(eq(panelRoundAssignments.panelRoundId, roundId));

    const uniquePanelistIds = [
      ...new Set(assignments.map((a) => a.panelistId)),
    ];

    console.log(
      `[Panel Normalize API] Found ${uniquePanelistIds.length} panelists for round ${roundId}`,
    );

    // 2. Run normalization for each panelist in the round
    for (const panelistId of uniquePanelistIds) {
      await recalculatePanelNormalizedScores(panelistId, roundId);
    }

    // 3. Aggregate all normalized scores for the round
    await aggregatePanelTeamScores(roundId);

    return NextResponse.json(
      { message: "Scores normalized and aggregated successfully" },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error bulk normalizing panel scores:", error);
    return NextResponse.json(
      { message: "Failed to normalize scores" },
      { status: 500 },
    );
  }
});

import { type NextRequest, NextResponse } from "next/server";
import { adminProtected } from "~/auth/routes-wrapper";
import { fetchLeaderboardTeamDetails } from "~/db/services/idea-services";

export const GET = adminProtected(async (req: NextRequest) => {
  try {
    const url = new URL(req.url);
    const roundId = url.searchParams.get("roundId");
    const teamId = url.searchParams.get("teamId");

    if (!roundId || !teamId) {
      return NextResponse.json(
        { message: "roundId and teamId are required" },
        { status: 400 },
      );
    }

    const result = await fetchLeaderboardTeamDetails(roundId, teamId);
    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error("Error fetching leaderboard team details:", error);
    const message =
      error instanceof Error ? error.message : "Failed to fetch details";
    return NextResponse.json({ message }, { status: 500 });
  }
});

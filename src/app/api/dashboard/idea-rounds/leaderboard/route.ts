import { type NextRequest, NextResponse } from "next/server";
import { adminProtected } from "~/auth/routes-wrapper";
import { fetchIdeaLeaderboard } from "~/db/services/idea-services";

export const GET = adminProtected(async (req: NextRequest) => {
  try {
    const { searchParams } = new URL(req.url);
    const roundId = searchParams.get("roundId");

    if (!roundId) {
      return NextResponse.json([], { status: 200 });
    }

    const result = await fetchIdeaLeaderboard(roundId);

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error("Error fetching idea leaderboard:", error);
    const message =
      error instanceof Error
        ? error.message
        : "Failed to fetch idea leaderboard";
    const status = (error as any).statusCode || 500;
    return NextResponse.json({ message }, { status });
  }
});

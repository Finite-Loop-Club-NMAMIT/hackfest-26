import { type NextRequest, NextResponse } from "next/server";
import { adminProtected, permissionProtected } from "~/auth/routes-wrapper";
import {
  createIdeaRound,
  fetchIdeaRounds,
  updateIdeaRoundStatus,
} from "~/db/services/idea-services";

export const GET = permissionProtected(
  ["submission:score"],
  async (_req, _context, user) => {
    try {
      const rounds = await fetchIdeaRounds(user);
      return NextResponse.json(rounds, { status: 200 });
    } catch (error) {
      console.error("Error fetching idea rounds:", error);
      const message =
        error instanceof Error ? error.message : "Failed to fetch idea rounds";
      const status = (error as any).statusCode || 500;
      return NextResponse.json({ message }, { status });
    }
  },
);

export const POST = adminProtected(async (req: NextRequest) => {
  try {
    const body = await req.json();

    const createdRound = await createIdeaRound(body);
    return NextResponse.json(createdRound, { status: 201 });
  } catch (error) {
    console.error("Error creating idea round:", error);
    const message =
      error instanceof Error ? error.message : "Failed to create idea round";
    const status = (error as any).statusCode || 500;
    return NextResponse.json({ message }, { status });
  }
});

export const PATCH = adminProtected(async (req: NextRequest) => {
  try {
    const body = await req.json();
    const updatedRound = await updateIdeaRoundStatus(body);
    return NextResponse.json(updatedRound, { status: 200 });
  } catch (error) {
    console.error("Error updating idea round status:", error);
    const message =
      error instanceof Error
        ? error.message
        : "Failed to update idea round status";
    const status = (error as any).statusCode || 500;
    return NextResponse.json({ message }, { status });
  }
});

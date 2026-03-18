import { type NextRequest, NextResponse } from "next/server";
import { adminProtected, permissionProtected } from "~/auth/routes-wrapper";
import {
  createIdeaRound,
  fetchIdeaRounds,
  updateIdeaRoundStatus,
} from "~/db/services/idea-services";
import { errorResponse } from "~/lib/response/error";

export const GET = permissionProtected(
  ["submission:score"],
  async (_req, _context, user) => {
    try {
      const rounds = await fetchIdeaRounds(user);
      return NextResponse.json(rounds, { status: 200 });
    } catch (error) {
      return errorResponse(error);
    }
  },
);

export const POST = adminProtected(async (req: NextRequest) => {
  try {
    const body = await req.json();

    const createdRound = await createIdeaRound(body);
    return NextResponse.json(createdRound, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
});

export const PATCH = adminProtected(async (req: NextRequest) => {
  try {
    const body = await req.json();
    const updatedRound = await updateIdeaRoundStatus(body);
    return NextResponse.json(updatedRound, { status: 200 });
  } catch (error) {
    return errorResponse(error);
  }
});

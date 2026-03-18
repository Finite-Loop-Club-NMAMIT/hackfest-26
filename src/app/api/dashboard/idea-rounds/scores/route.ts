import { NextResponse } from "next/server";
import { permissionProtected } from "~/auth/routes-wrapper";
import { fetchIdeaScores, saveIdeaScores } from "~/db/services/idea-services";
import { errorResponse } from "~/lib/response/error";

export const GET = permissionProtected(
  ["submission:score"],
  async (request, _context, user) => {
    try {
      const { searchParams } = new URL(request.url);
      const assignmentId = searchParams.get("assignmentId");

      if (!assignmentId) {
        return NextResponse.json(
          { message: "assignmentId is required" },
          { status: 400 },
        );
      }

      const response = await fetchIdeaScores(user, assignmentId);
      return NextResponse.json(response, { status: 200 });
    } catch (error) {
      return errorResponse(error);
    }
  },
);

export const POST = permissionProtected(
  ["submission:score"],
  async (request, _context, user) => {
    try {
      const body = await request.json();
      const result = await saveIdeaScores(user, body);
      return NextResponse.json(result, { status: 200 });
    } catch (error) {
      return errorResponse(error);
    }
  },
);

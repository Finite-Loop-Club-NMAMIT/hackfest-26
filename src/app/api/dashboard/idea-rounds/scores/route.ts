import { NextResponse } from "next/server";
import { permissionProtected } from "~/auth/routes-wrapper";
import { fetchIdeaScores, saveIdeaScores } from "~/db/services/idea-services";

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
      console.error("Error fetching idea scores:", error);
      const message =
        error instanceof Error ? error.message : "Failed to fetch idea scores";
      const status = (error as any).statusCode || 500;
      return NextResponse.json({ message }, { status });
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
      console.error("Error saving idea scores:", error);
      const message =
        error instanceof Error ? error.message : "Failed to save idea scores";
      const status = (error as any).statusCode || 500;
      return NextResponse.json({ message }, { status });
    }
  },
);

import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { adminProtected } from "~/auth/routes-wrapper";
import { reassignUnderScoredTeams } from "~/db/services/idea-services";

const reassignSchema = z.object({
  roundId: z.string().min(1, "Round ID is required"),
  evaluatorId: z.string().min(1, "Evaluator ID is required"),
});

export const POST = adminProtected(async (req: NextRequest) => {
  try {
    const body = await req.json();
    const result = reassignSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { message: "Invalid input", errors: result.error.format() },
        { status: 400 },
      );
    }

    const reassignResult = await reassignUnderScoredTeams(
      result.data.roundId,
      result.data.evaluatorId,
    );

    return NextResponse.json(reassignResult, { status: 200 });
  } catch (error) {
    console.error("Error reassigning under-scored teams:", error);
    const message =
      error instanceof Error
        ? error.message
        : "Failed to reassign under-scored teams";
    return NextResponse.json({ message }, { status: 500 });
  }
});

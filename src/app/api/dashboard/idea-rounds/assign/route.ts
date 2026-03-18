import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { adminProtected } from "~/auth/routes-wrapper";
import { assignIdeaRound } from "~/db/services/idea-services";

const assignSchema = z.object({
  roundId: z.string().min(1, "Round ID is required"),
});

export const POST = adminProtected(async (req: NextRequest) => {
  try {
    const body = await req.json();
    const result = assignSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { message: "Invalid input", errors: result.error.format() },
        { status: 400 },
      );
    }

    const assignmentResult = await assignIdeaRound(result.data.roundId);

    return NextResponse.json(assignmentResult, { status: 200 });
  } catch (error) {
    console.error("Error assigning idea round:", error);
    const message =
      error instanceof Error ? error.message : "Failed to assign idea round";
    return NextResponse.json({ message }, { status: 500 });
  }
});

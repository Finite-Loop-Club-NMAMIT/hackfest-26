import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { adminProtected } from "~/auth/routes-wrapper";
import {
  fetchEvaluatorAllocations,
  manageEvaluatorAllocation,
} from "~/db/services/idea-services";

const actionSchema = z.object({
  roundId: z.string().min(1, "Round ID is required"),
  evaluatorId: z.string().min(1, "Evaluator ID is required"),
  teamId: z.string().min(1, "Team ID is required"),
  action: z.enum(["assign", "deallocate"]),
});

export const GET = adminProtected(async (req: NextRequest) => {
  try {
    const url = new URL(req.url);
    const roundId = url.searchParams.get("roundId");
    const evaluatorId = url.searchParams.get("evaluatorId");

    if (!roundId || !evaluatorId) {
      return NextResponse.json(
        { message: "roundId and evaluatorId are required" },
        { status: 400 },
      );
    }

    const allocations = await fetchEvaluatorAllocations(roundId, evaluatorId);
    return NextResponse.json(allocations, { status: 200 });
  } catch (error) {
    console.error("Error fetching evaluator allocations:", error);
    const message =
      error instanceof Error ? error.message : "Failed to fetch allocations";
    return NextResponse.json({ message }, { status: 500 });
  }
});

export const POST = adminProtected(async (req: NextRequest) => {
  try {
    const body = await req.json();
    const result = actionSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { message: "Invalid input", errors: result.error.format() },
        { status: 400 },
      );
    }

    const res = await manageEvaluatorAllocation(
      result.data.roundId,
      result.data.evaluatorId,
      result.data.teamId,
      result.data.action,
    );

    return NextResponse.json(res, { status: 200 });
  } catch (error) {
    console.error("Error managing evaluator allocation:", error);
    const message =
      error instanceof Error ? error.message : "Failed to manage allocation";
    return NextResponse.json({ message }, { status: 500 });
  }
});

import { type NextRequest, NextResponse } from "next/server";
import { adminProtected } from "~/auth/routes-wrapper";
import { fetchAllAllocations } from "~/db/services/idea-services";
import { errorResponse } from "~/lib/response/error";

export const GET = adminProtected(async (req: NextRequest) => {
  try {
    const { searchParams } = new URL(req.url);
    const roundId = searchParams.get("roundId");

    if (!roundId) {
      return NextResponse.json(
        { message: "roundId is required" },
        { status: 400 },
      );
    }

    const result = await fetchAllAllocations(roundId);
    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    return errorResponse(error);
  }
});

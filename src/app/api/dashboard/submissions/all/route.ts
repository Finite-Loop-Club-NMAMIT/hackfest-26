import { type NextRequest, NextResponse } from "next/server";
import { adminProtected } from "~/auth/routes-wrapper";
import { fetchAllSubmissionsDetails } from "~/db/services/idea-services";
import { errorResponse } from "~/lib/response/error";

export const GET = adminProtected(async (_req: NextRequest) => {
  try {
    const result = await fetchAllSubmissionsDetails();
    return NextResponse.json({ rows: result }, { status: 200 });
  } catch (error) {
    return errorResponse(error);
  }
});

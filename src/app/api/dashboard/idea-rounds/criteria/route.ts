import { type NextRequest, NextResponse } from "next/server";
import { adminProtected } from "~/auth/routes-wrapper";
import {
  createIdeaCriterion,
  deleteIdeaCriterion,
  listIdeaCriteria,
} from "~/db/services/idea-services";
import { errorResponse } from "~/lib/response/error";

export const GET = adminProtected(async (req: NextRequest) => {
  try {
    const { searchParams } = new URL(req.url);
    const roundId = searchParams.get("roundId");

    if (!roundId) {
      return NextResponse.json([], { status: 200 });
    }

    const criteria = await listIdeaCriteria(roundId);

    return NextResponse.json(criteria, { status: 200 });
  } catch (error) {
    return errorResponse(error);
  }
});

export const POST = adminProtected(async (req: NextRequest) => {
  try {
    const body = await req.json();
    const created = await createIdeaCriterion(body);
    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
});

export const DELETE = adminProtected(async (req: NextRequest) => {
  try {
    const { searchParams } = new URL(req.url);
    const criteriaId = searchParams.get("id");

    if (!criteriaId) {
      return NextResponse.json(
        { message: "Criteria ID is required" },
        { status: 400 },
      );
    }

    const result = await deleteIdeaCriterion(criteriaId);
    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    return errorResponse(error);
  }
});

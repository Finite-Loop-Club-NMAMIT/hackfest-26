import { type NextRequest, NextResponse } from "next/server";
import { adminProtected } from "~/auth/routes-wrapper";
import {
  createIdeaCriterion,
  deleteIdeaCriterion,
  listIdeaCriteria,
} from "~/db/services/idea-services";

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
    console.error("Error fetching idea criteria:", error);
    const message =
      error instanceof Error ? error.message : "Failed to fetch idea criteria";
    const status = (error as any).statusCode || 500;
    return NextResponse.json({ message }, { status });
  }
});

export const POST = adminProtected(async (req: NextRequest) => {
  try {
    const body = await req.json();
    const created = await createIdeaCriterion(body);
    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    console.error("Error creating idea criteria:", error);
    const message =
      error instanceof Error ? error.message : "Failed to create idea criteria";
    const status = (error as any).statusCode || 500;
    return NextResponse.json({ message }, { status });
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
    console.error("Error deleting idea criteria:", error);
    const message =
      error instanceof Error ? error.message : "Failed to delete idea criteria";
    const status = (error as any).statusCode || 500;
    return NextResponse.json({ message }, { status });
  }
});

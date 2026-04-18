import { asc, eq } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { adminProtected } from "~/auth/routes-wrapper";
import db from "~/db";
import { panelCriterias } from "~/db/schema";

const createPanelCriteriaSchema = z.object({
  panelRoundId: z.string().min(1, "Panel round is required"),
  criteriaName: z.string().min(1, "Criteria name is required").max(120),
  maxScore: z.number().int().min(1).max(100),
});

export const GET = adminProtected(async (req: NextRequest) => {
  try {
    const { searchParams } = new URL(req.url);
    const panelRoundId = searchParams.get("panelRoundId");

    if (!panelRoundId) {
      return NextResponse.json([], { status: 200 });
    }

    const criteria = await db
      .select()
      .from(panelCriterias)
      .where(eq(panelCriterias.panelRoundId, panelRoundId))
      .orderBy(asc(panelCriterias.criteriaName));

    return NextResponse.json(criteria, { status: 200 });
  } catch (error) {
    console.error("Error fetching panel criteria:", error);
    return NextResponse.json(
      { message: "Failed to fetch panel criteria" },
      { status: 500 },
    );
  }
});

export const POST = adminProtected(async (req: NextRequest) => {
  try {
    const body = await req.json();
    const result = createPanelCriteriaSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { message: "Invalid input", errors: result.error.format() },
        { status: 400 },
      );
    }

    const existingRound = await db.query.panelRounds.findFirst({
      where: (round, { eq }) => eq(round.id, result.data.panelRoundId),
    });

    if (!existingRound) {
      return NextResponse.json(
        { message: "Panel round not found" },
        { status: 404 },
      );
    }

    if (existingRound.status !== "Draft") {
      return NextResponse.json(
        {
          message:
            "Round is locked. Criteria can only be changed while status is Draft.",
        },
        { status: 409 },
      );
    }

    const duplicate = await db.query.panelCriterias.findFirst({
      where: (criteria, { eq, and }) =>
        and(
          eq(criteria.panelRoundId, result.data.panelRoundId),
          eq(criteria.criteriaName, result.data.criteriaName),
        ),
    });

    if (duplicate) {
      return NextResponse.json(
        { message: "Criteria already exists for this round" },
        { status: 409 },
      );
    }

    const [created] = await db
      .insert(panelCriterias)
      .values({
        panelRoundId: result.data.panelRoundId,
        criteriaName: result.data.criteriaName,
        maxScore: result.data.maxScore,
      })
      .returning();

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    console.error("Error creating panel criteria:", error);
    return NextResponse.json(
      { message: "Failed to create panel criteria" },
      { status: 500 },
    );
  }
});

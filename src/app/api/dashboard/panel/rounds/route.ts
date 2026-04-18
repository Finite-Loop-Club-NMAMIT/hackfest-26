import { asc, eq } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { adminProtected } from "~/auth/routes-wrapper";
import db from "~/db";
import { panelRounds } from "~/db/schema";

const createPanelRoundSchema = z.object({
  name: z.string().min(1, "Round name is required").max(100),
});

const updatePanelRoundStatusSchema = z.object({
  id: z.string().min(1, "Round ID is required"),
  status: z.enum(["Draft", "Active", "Completed"]),
});

export const GET = adminProtected(async (_req: NextRequest) => {
  try {
    const rounds = await db
      .select()
      .from(panelRounds)
      .orderBy(asc(panelRounds.name));

    return NextResponse.json(rounds, { status: 200 });
  } catch (error) {
    console.error("Error fetching panel rounds:", error);
    return NextResponse.json(
      { message: "Failed to fetch panel rounds" },
      { status: 500 },
    );
  }
});

export const POST = adminProtected(async (req: NextRequest) => {
  try {
    const body = await req.json();
    const result = createPanelRoundSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { message: "Invalid input", errors: result.error.format() },
        { status: 400 },
      );
    }

    const [createdRound] = await db
      .insert(panelRounds)
      .values({ name: result.data.name })
      .returning();

    return NextResponse.json(createdRound, { status: 201 });
  } catch (error) {
    console.error("Error creating panel round:", error);
    return NextResponse.json(
      { message: "Failed to create panel round" },
      { status: 500 },
    );
  }
});

export const PATCH = adminProtected(async (req: NextRequest) => {
  try {
    const body = await req.json();
    const result = updatePanelRoundStatusSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { message: "Invalid input", errors: result.error.format() },
        { status: 400 },
      );
    }

    const [updatedRound] = await db
      .update(panelRounds)
      .set({ status: result.data.status })
      .where(eq(panelRounds.id, result.data.id))
      .returning();

    if (!updatedRound) {
      return NextResponse.json(
        { message: "Panel round not found" },
        { status: 404 },
      );
    }

    return NextResponse.json(updatedRound, { status: 200 });
  } catch (error) {
    console.error("Error updating panel round status:", error);
    return NextResponse.json(
      { message: "Failed to update panel round status" },
      { status: 500 },
    );
  }
});

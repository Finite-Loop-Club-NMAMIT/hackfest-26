import { asc, eq } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { adminProtected } from "~/auth/routes-wrapper";
import db from "~/db";
import { mentorRounds } from "~/db/schema";

const createMentorRoundSchema = z.object({
  name: z.string().min(1, "Round name is required").max(100),
});

const updateMentorRoundStatusSchema = z.object({
  id: z.string().min(1, "Round ID is required"),
  status: z.enum(["Draft", "Active", "Completed"]).optional(),
  name: z.string().min(1, "Round name is required").max(100).optional(),
});

const deleteMentorRoundSchema = z.object({
  id: z.string().min(1, "Round ID is required"),
});

export const GET = adminProtected(async (_req: NextRequest) => {
  try {
    const rounds = await db
      .select()
      .from(mentorRounds)
      .orderBy(asc(mentorRounds.name));

    return NextResponse.json(rounds, { status: 200 });
  } catch (error) {
    console.error("Error fetching mentor rounds:", error);
    return NextResponse.json(
      { message: "Failed to fetch mentor rounds" },
      { status: 500 },
    );
  }
});

export const POST = adminProtected(async (req: NextRequest) => {
  try {
    const body = await req.json();
    const result = createMentorRoundSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { message: "Invalid input", errors: result.error.format() },
        { status: 400 },
      );
    }

    const [createdRound] = await db
      .insert(mentorRounds)
      .values({ name: result.data.name })
      .returning();

    return NextResponse.json(createdRound, { status: 201 });
  } catch (error) {
    console.error("Error creating mentor round:", error);
    return NextResponse.json(
      { message: "Failed to create mentor round" },
      { status: 500 },
    );
  }
});

export const PATCH = adminProtected(async (req: NextRequest) => {
  try {
    const body = await req.json();
    const result = updateMentorRoundStatusSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { message: "Invalid input", errors: result.error.format() },
        { status: 400 },
      );
    }

    const updatePayload: {
      status?: "Draft" | "Active" | "Completed";
      name?: string;
    } = {};
    if (result.data.status) {
      updatePayload.status = result.data.status;
    }
    if (result.data.name) {
      updatePayload.name = result.data.name;
    }

    if (!updatePayload.status && !updatePayload.name) {
      return NextResponse.json(
        { message: "Nothing to update" },
        { status: 400 },
      );
    }

    const [updatedRound] = await db
      .update(mentorRounds)
      .set(updatePayload)
      .where(eq(mentorRounds.id, result.data.id))
      .returning();

    if (!updatedRound) {
      return NextResponse.json(
        { message: "Mentor round not found" },
        { status: 404 },
      );
    }

    return NextResponse.json(updatedRound, { status: 200 });
  } catch (error) {
    console.error("Error updating mentor round status:", error);
    return NextResponse.json(
      { message: "Failed to update mentor round status" },
      { status: 500 },
    );
  }
});

export const DELETE = adminProtected(async (req: NextRequest) => {
  try {
    const { searchParams } = new URL(req.url);
    const result = deleteMentorRoundSchema.safeParse({
      id: searchParams.get("id"),
    });

    if (!result.success) {
      return NextResponse.json(
        { message: "Invalid input", errors: result.error.format() },
        { status: 400 },
      );
    }

    const [deletedRound] = await db
      .delete(mentorRounds)
      .where(eq(mentorRounds.id, result.data.id))
      .returning();

    if (!deletedRound) {
      return NextResponse.json(
        { message: "Mentor round not found" },
        { status: 404 },
      );
    }

    return NextResponse.json(
      { message: "Mentor round deleted successfully", id: deletedRound.id },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error deleting mentor round:", error);
    return NextResponse.json(
      { message: "Failed to delete mentor round" },
      { status: 500 },
    );
  }
});

import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { adminProtected } from "~/auth/routes-wrapper";
import { createLab, listLabs } from "~/db/services/allocation-services";
import { errorResponse } from "~/lib/response/error";

export const GET = adminProtected(async (_req: NextRequest) => {
  try {
    const labs = await listLabs();
    return NextResponse.json({ labs });
  } catch (error) {
    return errorResponse(error);
  }
});

const createSchema = z.object({
  name: z.string().min(1, "Name is required"),
  capacity: z.number().int().positive("Capacity must be a positive number"),
});

export const POST = adminProtected(async (req: NextRequest) => {
  try {
    const body = await req.json();
    const result = createSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: "Invalid input", errors: result.error.format() },
        { status: 400 },
      );
    }
    const lab = await createLab(result.data.name, result.data.capacity);
    return NextResponse.json({ lab }, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
});

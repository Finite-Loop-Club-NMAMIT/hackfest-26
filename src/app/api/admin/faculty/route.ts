import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { adminProtected } from "~/auth/routes-wrapper";
import {
  createFacultyMember,
  listAllFacultyMembers,
  normalizeFacultyMember,
} from "~/db/services/faculty-services";
import { AppError } from "~/lib/errors/app-error";
import { createFacultySchema } from "~/lib/validation/faculty";

export const GET = adminProtected(
  async (_request: NextRequest) => {
    try {
      const faculty = await listAllFacultyMembers();
      return NextResponse.json({
        faculty: faculty.map(normalizeFacultyMember),
      });
    } catch (error) {
      console.error("Error fetching faculty members:", error);
      return NextResponse.json(
        { message: "Failed to fetch faculty members" },
        { status: 500 },
      );
    }
  },
);

export const POST = adminProtected(
  async (request: NextRequest) => {
    const requestStart = Date.now();

    try {
      const body = await request.json();
      console.info("[API][admin/faculty][POST] Request received", {
        hasPhoto: Boolean(body?.photo),
        department: body?.department,
      });

      const parsed = createFacultySchema.safeParse(body);

      if (!parsed.success) {
        const firstIssue = parsed.error.issues[0];
        console.error("[API][admin/faculty][POST] Validation failed", {
          durationMs: Date.now() - requestStart,
          issues: parsed.error.issues,
        });
        return NextResponse.json(
          {
            message: firstIssue?.message || "Invalid input",
            errors: z.treeifyError(parsed.error),
          },
          { status: 400 },
        );
      }

      const insertStart = Date.now();
      const faculty = await createFacultyMember(parsed.data);
      const insertDurationMs = Date.now() - insertStart;
      const totalDurationMs = Date.now() - requestStart;

      console.info("[API][admin/faculty][POST] Faculty created", {
        facultyId: faculty.id,
        insertDurationMs,
        totalDurationMs,
      });

      if (totalDurationMs > 2000) {
        console.warn("[API][admin/faculty][POST] Slow create detected", {
          facultyId: faculty.id,
          insertDurationMs,
          totalDurationMs,
        });
      }

      return NextResponse.json(
        { faculty: normalizeFacultyMember(faculty) },
        { status: 201 },
      );
    } catch (error) {
      console.error("[API][admin/faculty][POST] Failed", {
        durationMs: Date.now() - requestStart,
        error,
      });

      if (error instanceof z.ZodError) {
        const firstIssue = error.issues[0];
        return NextResponse.json(
          {
            message: firstIssue?.message || "Invalid input",
            errors: z.treeifyError(error),
          },
          { status: 400 },
        );
      }

      if (error instanceof AppError) {
        return NextResponse.json(
          {
            message: error.message,
            description: error.description,
          },
          { status: error.status },
        );
      }

      return NextResponse.json(
        {
          message:
            error instanceof Error
              ? error.message
              : "Failed to create faculty member",
        },
        { status: 500 },
      );
    }
  },
);

import { and, eq } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { permissionProtected } from "~/auth/routes-wrapper";
import db from "~/db";
import {
  mentorFeedback,
  mentorRoundAssignments,
  mentorRounds,
  mentors,
} from "~/db/schema";

const saveFeedbackSchema = z.object({
  assignmentId: z.string().min(1, "Assignment ID is required"),
  feedback: z.string().min(1, "Feedback is required").max(4000),
});

export const GET = permissionProtected(
  ["submission:remark", "submission:score"],
  async (req: NextRequest) => {
    try {
      const { searchParams } = new URL(req.url);
      const assignmentId = searchParams.get("assignmentId");

      if (!assignmentId) {
        return NextResponse.json(
          { message: "assignmentId is required" },
          { status: 400 },
        );
      }

      const assignment = await db
        .select({
          assignmentId: mentorRoundAssignments.id,
          mentorId: mentorRoundAssignments.mentorId,
          roundStatus: mentorRounds.status,
        })
        .from(mentorRoundAssignments)
        .innerJoin(
          mentorRounds,
          eq(mentorRounds.id, mentorRoundAssignments.mentorRoundId),
        )
        .where(eq(mentorRoundAssignments.id, assignmentId))
        .limit(1);

      const selectedAssignment = assignment[0];
      if (!selectedAssignment) {
        return NextResponse.json(
          { message: "Mentor assignment not found" },
          { status: 404 },
        );
      }

      const existingFeedback = await db
        .select({
          id: mentorFeedback.id,
          feedback: mentorFeedback.feedback,
        })
        .from(mentorFeedback)
        .where(eq(mentorFeedback.roundAssignmentId, assignmentId));

      const primaryFeedback = existingFeedback[0];

      return NextResponse.json(
        {
          assignmentId: selectedAssignment.assignmentId,
          roundStatus: selectedAssignment.roundStatus,
          feedback: primaryFeedback?.feedback ?? "",
        },
        { status: 200 },
      );
    } catch (error) {
      console.error("Error fetching mentor feedback:", error);
      return NextResponse.json(
        { message: "Failed to fetch mentor feedback" },
        { status: 500 },
      );
    }
  },
);

export const POST = permissionProtected(
  ["submission:remark", "submission:score"],
  async (req: NextRequest, _context, user) => {
    try {
      const body = await req.json();
      const parsed = saveFeedbackSchema.safeParse(body);

      if (!parsed.success) {
        return NextResponse.json(
          { message: "Invalid input", errors: parsed.error.format() },
          { status: 400 },
        );
      }

      const { assignmentId, feedback } = parsed.data;

      const assignment = await db
        .select({
          assignmentId: mentorRoundAssignments.id,
          mentorId: mentorRoundAssignments.mentorId,
          roundStatus: mentorRounds.status,
        })
        .from(mentorRoundAssignments)
        .innerJoin(
          mentorRounds,
          eq(mentorRounds.id, mentorRoundAssignments.mentorRoundId),
        )
        .where(eq(mentorRoundAssignments.id, assignmentId))
        .limit(1);

      const selectedAssignment = assignment[0];
      if (!selectedAssignment) {
        return NextResponse.json(
          { message: "Mentor assignment not found" },
          { status: 404 },
        );
      }

      if (selectedAssignment.roundStatus === "Completed") {
        return NextResponse.json(
          { message: "Round is completed. Feedback is locked." },
          { status: 409 },
        );
      }

      const ownedAssignment = await db
        .select({ assignmentId: mentorRoundAssignments.id })
        .from(mentorRoundAssignments)
        .innerJoin(mentors, eq(mentors.id, mentorRoundAssignments.mentorId))
        .where(
          and(
            eq(mentorRoundAssignments.id, assignmentId),
            eq(mentors.dashboardUserId, user.id),
          ),
        )
        .limit(1);

      if (ownedAssignment.length === 0) {
        return NextResponse.json(
          { message: "Only assigned mentor can submit feedback" },
          { status: 403 },
        );
      }

      const existingFeedback = await db
        .select({
          id: mentorFeedback.id,
        })
        .from(mentorFeedback)
        .where(eq(mentorFeedback.roundAssignmentId, assignmentId));

      if (existingFeedback.length === 0) {
        await db.insert(mentorFeedback).values({
          roundAssignmentId: assignmentId,
          feedback,
        });
      } else {
        const [primary, ...duplicates] = existingFeedback;

        await db
          .update(mentorFeedback)
          .set({ feedback })
          .where(eq(mentorFeedback.id, primary.id));

        if (duplicates.length > 0) {
          await Promise.all(
            duplicates.map((entry) =>
              db.delete(mentorFeedback).where(eq(mentorFeedback.id, entry.id)),
            ),
          );
        }
      }

      return NextResponse.json(
        { message: "Feedback saved successfully" },
        { status: 200 },
      );
    } catch (error) {
      console.error("Error saving mentor feedback:", error);
      return NextResponse.json(
        { message: "Failed to save mentor feedback" },
        { status: 500 },
      );
    }
  },
);

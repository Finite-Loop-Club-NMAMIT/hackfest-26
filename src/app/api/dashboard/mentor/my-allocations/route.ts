import { eq, inArray, sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { permissionProtected } from "~/auth/routes-wrapper";
import db from "~/db";
import {
  ideaSubmission,
  mentorFeedback,
  mentorRoundAssignments,
  mentorRounds,
  teams,
  tracks,
} from "~/db/schema";

export const GET = permissionProtected(
  ["submission:remark", "submission:score"],
  async (_request, _context, user) => {
    try {
      const mentorRows = await db.query.mentors.findMany({
        where: (m, { eq }) => eq(m.dashboardUserId, user.id),
      });

      const mentorIds = mentorRows.map((mentor) => mentor.id);

      if (mentorIds.length === 0) {
        return NextResponse.json([], { status: 200 });
      }

      const assignments = await db
        .select({
          assignmentId: mentorRoundAssignments.id,
          teamId: teams.id,
          teamName: teams.name,
          teamStage: teams.teamStage,
          paymentStatus: teams.paymentStatus,
          roundId: mentorRounds.id,
          roundName: mentorRounds.name,
          roundStatus: mentorRounds.status,
          pptUrl: ideaSubmission.pptUrl,
          trackName: tracks.name,
        })
        .from(mentorRoundAssignments)
        .innerJoin(teams, eq(teams.id, mentorRoundAssignments.teamId))
        .innerJoin(
          mentorRounds,
          eq(mentorRounds.id, mentorRoundAssignments.mentorRoundId),
        )
        .leftJoin(ideaSubmission, eq(ideaSubmission.teamId, teams.id))
        .leftJoin(tracks, eq(tracks.id, ideaSubmission.trackId))
        .where(inArray(mentorRoundAssignments.mentorId, mentorIds));

      if (assignments.length === 0) {
        return NextResponse.json([], { status: 200 });
      }

      const assignmentIds = assignments.map(
        (assignment) => assignment.assignmentId,
      );

      const feedbackStats = await db
        .select({
          assignmentId: mentorFeedback.roundAssignmentId,
          feedbackCount: sql<number>`count(*)`.mapWith(Number),
        })
        .from(mentorFeedback)
        .where(inArray(mentorFeedback.roundAssignmentId, assignmentIds))
        .groupBy(mentorFeedback.roundAssignmentId);

      const feedbackCountMap = new Map(
        feedbackStats.map((item) => [item.assignmentId, item.feedbackCount]),
      );

      const response = assignments
        .filter((assignment) => {
          const status = assignment.roundStatus?.toLowerCase();
          return status === "active" || status === "completed";
        })
        .map((assignment) => ({
          ...assignment,
          feedbackCount: feedbackCountMap.get(assignment.assignmentId) ?? 0,
        }));

      return NextResponse.json(response, { status: 200 });
    } catch (error) {
      console.error("Error fetching mentor allocations:", error);
      return NextResponse.json(
        { message: "Failed to fetch mentor allocations" },
        { status: 500 },
      );
    }
  },
);

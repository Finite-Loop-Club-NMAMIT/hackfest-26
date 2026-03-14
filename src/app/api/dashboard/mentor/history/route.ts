import { and, asc, desc, eq } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { permissionProtected } from "~/auth/routes-wrapper";
import db from "~/db";
import {
  dashboardUsers,
  mentorFeedback,
  mentorRoundAssignments,
  mentorRounds,
  mentors,
  teams,
} from "~/db/schema";

export const GET = permissionProtected(
  ["submission:remark", "submission:score"],
  async (req: NextRequest) => {
    try {
      const { searchParams } = new URL(req.url);
      const teamId = searchParams.get("teamId");
      const mentorRoundId = searchParams.get("mentorRoundId");

      const filters = [];
      if (teamId) {
        filters.push(eq(mentorRoundAssignments.teamId, teamId));
      }
      if (mentorRoundId) {
        filters.push(eq(mentorRoundAssignments.mentorRoundId, mentorRoundId));
      }

      const rows = await db
        .select({
          assignmentId: mentorRoundAssignments.id,
          teamId: teams.id,
          teamName: teams.name,
          mentorRoundId: mentorRounds.id,
          mentorRoundName: mentorRounds.name,
          mentorRoundStatus: mentorRounds.status,
          mentorId: mentors.id,
          mentorUserId: dashboardUsers.id,
          mentorName: dashboardUsers.name,
          mentorUsername: dashboardUsers.username,
          feedbackId: mentorFeedback.id,
          feedback: mentorFeedback.feedback,
        })
        .from(mentorRoundAssignments)
        .innerJoin(mentors, eq(mentors.id, mentorRoundAssignments.mentorId))
        .innerJoin(
          dashboardUsers,
          eq(dashboardUsers.id, mentors.dashboardUserId),
        )
        .innerJoin(
          mentorRounds,
          eq(mentorRounds.id, mentorRoundAssignments.mentorRoundId),
        )
        .innerJoin(teams, eq(teams.id, mentorRoundAssignments.teamId))
        .leftJoin(
          mentorFeedback,
          eq(mentorFeedback.roundAssignmentId, mentorRoundAssignments.id),
        )
        .where(filters.length > 0 ? and(...filters) : undefined)
        .orderBy(desc(mentorRounds.name), asc(dashboardUsers.name));

      return NextResponse.json(rows, { status: 200 });
    } catch (error) {
      console.error("Error fetching mentor feedback history:", error);
      return NextResponse.json(
        { message: "Failed to fetch mentor feedback history" },
        { status: 500 },
      );
    }
  },
);

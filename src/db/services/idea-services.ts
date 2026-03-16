import { and, desc, eq, ilike, inArray, lt, sql } from "drizzle-orm";
import { AppError } from "~/lib/errors/app-error";
import db from "..";
import {
  dashboardUserRoles,
  ideaRoundAssignments,
  ideaRounds,
  ideaSubmission,
  teams,
  tracks,
} from "../schema";

export async function submitIdea({
  teamId,
  pdfUrl,
  trackId,
  userId,
}: {
  teamId: string;
  pdfUrl: string;
  trackId: string;
  userId: string;
}) {
  try {
    const leader = await db.query.teams.findFirst({
      where: eq(teams.id, teamId),
      columns: {
        leaderId: true,
      },
    });
    if (!leader || !(leader.leaderId === userId)) {
      throw new AppError("You are not the leader of this team", 400);
    }
    const [submitIdea] = await db
      .insert(ideaSubmission)
      .values({
        teamId,
        pptUrl: pdfUrl,
        trackId,
      })
      .returning();
    const res = submitIdea;
    return res;
  } catch (error) {
    console.error("Error submitting idea:", error);
    throw new AppError("Failed to submit idea", 500);
  }
}

export async function getIdeaSubmission(teamId: string) {
  try {
    const ideaSubmissionData = await db.query.ideaSubmission.findFirst({
      where: (submission, { eq }) => eq(submission.teamId, teamId),
      with: {
        track: true,
      },
    });
    const submission = ideaSubmissionData
      ? {
          pdfUrl: ideaSubmissionData.pptUrl,
          trackId: ideaSubmissionData.trackId,
          trackName: ideaSubmissionData.track?.name ?? "Unknown Track",
        }
      : null;
    return submission;
  } catch (error) {
    console.error("Error fetching idea submission:", error);
    throw new AppError("Failed to fetch idea submission", 500);
  }
}

export async function fetchIdeas({
  cursor,
  limit = 50,
  search,
  trackId,
}: {
  cursor?: string;
  limit?: number;
  search?: string;
  trackId?: string;
}) {
  try {
    const conditions = [];

    if (search) {
      conditions.push(ilike(teams.name, `%${search}%`));
    }

    if (cursor) {
      conditions.push(lt(ideaSubmission.createdAt, new Date(cursor)));
    }

    if (trackId) {
      conditions.push(eq(ideaSubmission.trackId, trackId));
    }

    const ideas = await db
      .select({
        id: ideaSubmission.id,
        teamId: ideaSubmission.teamId,
        pptUrl: ideaSubmission.pptUrl,
        trackId: ideaSubmission.trackId,
        createdAt: ideaSubmission.createdAt,
        team: {
          id: teams.id,
          name: teams.name,
        },
        track: {
          id: tracks.id,
          name: tracks.name,
        },
      })
      .from(ideaSubmission)
      .leftJoin(teams, eq(ideaSubmission.teamId, teams.id))
      .leftJoin(tracks, eq(ideaSubmission.trackId, tracks.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(ideaSubmission.createdAt))
      .limit(limit);

    let nextCursor: string | undefined;
    if (ideas.length === limit) {
      const lastIdea = ideas[ideas.length - 1];
      nextCursor = lastIdea.createdAt?.toISOString();
    }

    const [{ count }] = await db
      .select({ count: sql`count(*)`.mapWith(Number) })
      .from(ideaSubmission)
      .leftJoin(teams, eq(ideaSubmission.teamId, teams.id))
      .where(search ? ilike(teams.name, `%${search}%`) : undefined);

    return {
      ideas,
      nextCursor,
      totalCount: count,
    };
  } catch (error) {
    console.error("Error fetching ideas:", error);
    throw new AppError("Failed to fetch ideas", 500);
  }
}

const MIN_EVALUATORS_PER_TEAM = 4;
const CHUNK_SIZE = 200;

export async function assignIdeaRound(roundId: string) {
  const round = await db.query.ideaRounds.findFirst({
    where: eq(ideaRounds.id, roundId),
  });
  if (!round) throw new Error(`Round not found: ${roundId}`);

  const evaluators = await db
    .select({ id: dashboardUserRoles.dashboardUserId })
    .from(dashboardUserRoles)
    .where(eq(dashboardUserRoles.roleId, round.roleId));

  if (evaluators.length === 0)
    throw new Error(`No evaluators found for role: ${round.roleId}`);

  if (evaluators.length < MIN_EVALUATORS_PER_TEAM)
    throw new Error(
      `Need at least ${MIN_EVALUATORS_PER_TEAM} evaluators, only ${evaluators.length} found`,
    );

  const eligibleTeams = await db
    .select({ id: teams.id })
    .from(teams)
    .where(eq(teams.teamStage, round.targetStage));

  if (eligibleTeams.length === 0)
    throw new Error(`No teams found with stage: ${round.targetStage}`);

  const eligibleTeamIds = eligibleTeams.map((t) => t.id);

  const alreadyAssignedTeams = await db
    .selectDistinct({ teamId: ideaRoundAssignments.teamId })
    .from(ideaRoundAssignments)
    .where(
      and(
        eq(ideaRoundAssignments.roundId, roundId),
        inArray(ideaRoundAssignments.teamId, eligibleTeamIds),
      ),
    );

  const alreadyAssignedTeamIds = new Set(
    alreadyAssignedTeams.map((a) => a.teamId),
  );

  const unassignedTeams = eligibleTeams.filter(
    (t) => !alreadyAssignedTeamIds.has(t.id),
  );

  if (unassignedTeams.length === 0)
    return { assigned: 0, message: "All eligible teams already assigned" };

  const newAssignments: {
    roundId: string;
    teamId: string;
    evaluatorId: string;
  }[] = [];

  let evalIdx = 0;

  for (const team of unassignedTeams) {
    let assigned = 0;
    let attempts = 0;

    while (assigned < MIN_EVALUATORS_PER_TEAM && attempts < evaluators.length) {
      const evaluator = evaluators[evalIdx % evaluators.length]!;
      evalIdx++;
      attempts++;

      newAssignments.push({
        roundId,
        teamId: team.id,
        evaluatorId: evaluator.id,
      });
      assigned++;
    }

    if (assigned < MIN_EVALUATORS_PER_TEAM) {
      console.warn(
        `Team ${team.id} only got ${assigned}/${MIN_EVALUATORS_PER_TEAM} evaluators`,
      );
    }
  }

  for (let i = 0; i < newAssignments.length; i += CHUNK_SIZE) {
    await db
      .insert(ideaRoundAssignments)
      .values(newAssignments.slice(i, i + CHUNK_SIZE))
      .onConflictDoNothing();
  }

  return {
    assigned: newAssignments.length,
    teamsProcessed: unassignedTeams.length,
    teamsSkipped: alreadyAssignedTeamIds.size,
    evaluators: evaluators.length,
    message: `Assigned ${newAssignments.length} slots across ${unassignedTeams.length} teams`,
  };
}

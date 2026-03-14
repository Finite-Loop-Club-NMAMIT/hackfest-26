import {
  and,
  asc,
  count,
  desc,
  eq,
  ilike,
  inArray,
  isNotNull,
  sql,
} from "drizzle-orm";
import db from "~/db";
import {
  ideaRoundCriteria,
  ideaRounds,
  ideaTeamEvaluations,
} from "~/db/schema/evaluator";
import { dashboardUsers, ideaSubmission, teams, tracks } from "~/db/schema";
import { AppError } from "~/lib/errors/app-error";

export type SubmissionRound = "ROUND_1" | "ROUND_2";

const DEFAULT_LIMIT = 25;
const MAX_LIMIT = 100;

function parseOffsetCursor(cursor?: string) {
  if (!cursor) return 0;
  const parsed = Number.parseInt(cursor, 10);
  return Number.isNaN(parsed) || parsed < 0 ? 0 : parsed;
}

function getRoundName(round: SubmissionRound) {
  return round === "ROUND_2" ? "Round 2" : "Round 1";
}

export async function listSubmissionsForRound({
  round,
  cursor,
  limit = DEFAULT_LIMIT,
  search,
  trackId,
  evaluatorId,
  sortOrder = "desc",
}: {
  round: SubmissionRound;
  cursor?: string;
  limit?: number;
  search?: string;
  trackId?: string;
  evaluatorId?: string;
  sortOrder?: "asc" | "desc";
}) {
  const safeLimit = Math.min(Math.max(limit, 1), MAX_LIMIT);
  const offset = parseOffsetCursor(cursor);
  const conditions = [isNotNull(ideaSubmission.id)];

  if (round === "ROUND_2") {
    conditions.push(eq(teams.teamStage, "SEMI_SELECTED"));
  }

  if (search?.trim()) {
    conditions.push(ilike(teams.name, `%${search.trim()}%`));
  }

  if (trackId && trackId !== "all") {
    conditions.push(eq(ideaSubmission.trackId, trackId));
  }

  const whereClause = and(...conditions);

  const rows = await db
    .select({
      id: ideaSubmission.id,
      teamId: ideaSubmission.teamId,
      ideaTitle: teams.name,
      pdfUrl: ideaSubmission.pptUrl,
      createdAt: ideaSubmission.createdAt,
      teamName: teams.name,
      teamStage: teams.teamStage,
      trackId: tracks.id,
      trackName: tracks.name,
    })
    .from(ideaSubmission)
    .innerJoin(teams, eq(ideaSubmission.teamId, teams.id))
    .innerJoin(tracks, eq(ideaSubmission.trackId, tracks.id))
    .where(whereClause)
    .orderBy(
      sortOrder === "asc"
        ? asc(ideaSubmission.createdAt)
        : desc(ideaSubmission.createdAt),
      asc(ideaSubmission.id),
    )
    .offset(offset)
    .limit(safeLimit + 1);

  const hasMore = rows.length > safeLimit;
  const pageRows = hasMore ? rows.slice(0, safeLimit) : rows;

  const nextCursor = hasMore ? String(offset + safeLimit) : null;

  const [{ totalCount }] = await db
    .select({ totalCount: count() })
    .from(ideaSubmission)
    .innerJoin(teams, eq(ideaSubmission.teamId, teams.id))
    .where(whereClause);

  let evaluatorScoresByTeam = new Map<string, number>();

  if (evaluatorId && pageRows.length > 0) {
    const roundName = getRoundName(round);
    const [existingRound] = await db
      .select({ id: ideaRounds.id })
      .from(ideaRounds)
      .where(eq(ideaRounds.name, roundName))
      .limit(1);

    if (existingRound) {
      const teamIds = pageRows.map((row) => row.teamId);
      const evaluatorScores = await db
        .select({
          teamId: ideaTeamEvaluations.teamId,
          rawTotalScore: ideaTeamEvaluations.rawTotalScore,
        })
        .from(ideaTeamEvaluations)
        .where(
          and(
            eq(ideaTeamEvaluations.roundId, existingRound.id),
            eq(ideaTeamEvaluations.evaluatorId, evaluatorId),
            inArray(ideaTeamEvaluations.teamId, teamIds),
          ),
        );

      evaluatorScoresByTeam = new Map(
        evaluatorScores.map((item) => [item.teamId, item.rawTotalScore]),
      );
    }
  }

  return {
    submissions: pageRows.map((row) => ({
      ...row,
      evaluatorScore: evaluatorScoresByTeam.get(row.teamId) ?? null,
    })),
    nextCursor,
    totalCount,
  };
}

export async function listLeaderboard({
  cursor,
  limit = DEFAULT_LIMIT,
  trackId,
  search,
  round,
  scoreType = "average",
}: {
  cursor?: string;
  limit?: number;
  trackId?: string;
  search?: string;
  round?: SubmissionRound | "all";
  scoreType?: "average" | "sum";
}) {
  const safeLimit = Math.min(Math.max(limit, 1), MAX_LIMIT);
  const offset = parseOffsetCursor(cursor);
  const conditions = [isNotNull(ideaSubmission.id)];

  if (trackId && trackId !== "all") {
    conditions.push(eq(ideaSubmission.trackId, trackId));
  }

  if (search?.trim()) {
    conditions.push(ilike(teams.name, `%${search.trim()}%`));
  }

  if (round === "ROUND_2") {
    conditions.push(eq(teams.teamStage, "SEMI_SELECTED"));
  }

  if (round === "ROUND_1") {
    conditions.push(eq(teams.teamStage, "NOT_SELECTED"));
  }

  const whereClause = and(...conditions);

  const scoreExpression =
    scoreType === "sum"
      ? sql<number>`COALESCE(SUM(${ideaTeamEvaluations.rawTotalScore}), 0)`
      : sql<number>`COALESCE(AVG(${ideaTeamEvaluations.rawTotalScore}), 0)`;

  const rows = await db
    .select({
      teamId: teams.id,
      teamName: teams.name,
      trackId: tracks.id,
      trackName: tracks.name,
      score: scoreExpression,
    })
    .from(ideaSubmission)
    .innerJoin(teams, eq(ideaSubmission.teamId, teams.id))
    .innerJoin(tracks, eq(ideaSubmission.trackId, tracks.id))
    .leftJoin(ideaTeamEvaluations, eq(ideaTeamEvaluations.teamId, teams.id))
    .where(whereClause)
    .groupBy(teams.id, teams.name, tracks.id, tracks.name)
    .orderBy(desc(scoreExpression), asc(teams.name))
    .offset(offset)
    .limit(safeLimit + 1);

  const hasMore = rows.length > safeLimit;
  const pageRows = hasMore ? rows.slice(0, safeLimit) : rows;
  const nextCursor = hasMore ? String(offset + safeLimit) : null;

  const [{ totalCount }] = await db
    .select({ totalCount: count() })
    .from(ideaSubmission)
    .innerJoin(teams, eq(ideaSubmission.teamId, teams.id))
    .where(whereClause);

  return {
    leaderboard: pageRows.map((entry, index) => ({
      rank: offset + index + 1,
      ...entry,
      score: Number(entry.score),
    })),
    nextCursor,
    totalCount,
  };
}

export async function listEvaluatorRoleCandidates() {
  const evaluatorRole = await db.query.roles.findFirst({
    where: (table, { eq }) => eq(table.name, "EVALUATOR"),
    columns: { id: true },
  });

  if (!evaluatorRole) {
    throw new AppError("EVALUATOR role does not exist", 400, {
      title: "Evaluator role missing",
      description:
        "Create the EVALUATOR role first in role management before assigning evaluators.",
    });
  }

  const users = await db
    .select({
      id: dashboardUsers.id,
      name: dashboardUsers.name,
      username: dashboardUsers.username,
      email: dashboardUsers.email,
      isActive: dashboardUsers.isActive,
      hasEvaluatorRole:
        sql<boolean>`EXISTS (SELECT 1 FROM dashboard_user_role dur WHERE dur.dashboard_user_id = ${dashboardUsers.id} AND dur.role_id = ${evaluatorRole.id} AND dur.is_active = true)`.mapWith(
          Boolean,
        ),
    })
    .from(dashboardUsers)
    .orderBy(asc(dashboardUsers.name));

  return {
    evaluatorRoleId: evaluatorRole.id,
    users,
  };
}

export async function ensureRoundForEvaluation(round: SubmissionRound) {
  const role = await db.query.roles.findFirst({
    where: (table, { eq }) => eq(table.name, "EVALUATOR"),
    columns: { id: true },
  });

  if (!role) {
    throw new AppError("EVALUATOR role does not exist", 400, {
      title: "Evaluator role missing",
      description: "Create EVALUATOR role before scoring submissions.",
    });
  }

  const roundName = getRoundName(round);

  const [existingRound] = await db
    .select()
    .from(ideaRounds)
    .where(eq(ideaRounds.name, roundName))
    .limit(1);

  if (existingRound) {
    return existingRound;
  }

  const [createdRound] = await db
    .insert(ideaRounds)
    .values({
      name: roundName,
      roleId: role.id,
      targetStage: round === "ROUND_2" ? "SEMI_SELECTED" : "NOT_SELECTED",
      status: "Active",
    })
    .returning();

  await db.insert(ideaRoundCriteria).values({
    roundId: createdRound.id,
    name: "Overall",
    maxScore: 10,
  });

  return createdRound;
}

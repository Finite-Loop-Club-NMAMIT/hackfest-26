import {
  and,
  count,
  countDistinct,
  desc,
  eq,
  isNotNull,
  sql,
} from "drizzle-orm";
import { cacheLife, cacheTag } from "next/cache";
import { AppError } from "~/lib/errors/app-error";
import db from "..";
import { colleges, participants, teams } from "../schema";
import { ideaSubmission } from "../schema/ideaSubmission";
import { selected } from "../schema/team-progress";

export async function getDashboardStats() {
  "use cache";
  cacheLife("seconds");
  cacheTag("dashboard-stats");

  try {
    const [teamsResult] = await db.select({ count: count() }).from(teams);
    const totalTeams = teamsResult?.count ?? 0;

    const [usersResult] = await db
      .select({ count: count() })
      .from(participants);
    const totalUsers = usersResult?.count ?? 0;

    const [participantsResult] = await db
      .select({ count: count() })
      .from(participants)
      .where(isNotNull(participants.teamId));
    const totalParticipants = participantsResult?.count ?? 0;

    const [collegesTotalResult] = await db
      .select({ count: countDistinct(participants.collegeId) })
      .from(participants)
      .where(isNotNull(participants.teamId));
    const uniqueTotalColleges = collegesTotalResult?.count ?? 0;

    const [statesTotalResult] = await db
      .select({ count: countDistinct(colleges.state) })
      .from(colleges)
      .innerJoin(participants, eq(colleges.id, participants.collegeId))
      .innerJoin(teams, eq(participants.teamId, teams.id));
    const uniqueTotalStates = statesTotalResult?.count ?? 0;

    const [collegesConfirmedResult] = await db
      .select({ count: countDistinct(participants.collegeId) })
      .from(participants)
      .innerJoin(teams, eq(participants.teamId, teams.id))
      .where(isNotNull(participants.teamId) && eq(teams.isCompleted, true));
    const uniqueConfirmedColleges = collegesConfirmedResult?.count ?? 0;

    const [statesConfirmedResult] = await db
      .select({ count: countDistinct(colleges.state) })
      .from(colleges)
      .innerJoin(participants, eq(colleges.id, participants.collegeId))
      .innerJoin(teams, eq(participants.teamId, teams.id))
      .where(eq(teams.isCompleted, true));
    const uniqueConfirmedStates = statesConfirmedResult?.count ?? 0;

    const [confirmedTeamsResult] = await db
      .select({ count: count() })
      .from(teams)
      .where(eq(teams.isCompleted, true));
    const confirmedTeams = confirmedTeamsResult?.count ?? 0;

    const [confirmedParticipantsResult] = await db
      .select({ count: count() })
      .from(participants)
      .innerJoin(teams, eq(participants.teamId, teams.id))
      .where(and(isNotNull(participants.teamId), eq(teams.isCompleted, true)));
    const confirmedParticipants = confirmedParticipantsResult?.count ?? 0;

    const [ideaSubmissionsResult] = await db
      .select({ count: count() })
      .from(ideaSubmission);
    const ideaSubmissions = ideaSubmissionsResult?.count ?? 0;

    return {
      totalTeams,
      totalUsers,
      totalParticipants,
      uniqueTotalColleges,
      uniqueTotalStates,
      uniqueConfirmedColleges,
      uniqueConfirmedStates,
      confirmedTeams,
      confirmedParticipants,
      ideaSubmissions,
    };
  } catch (error) {
    console.log(error);
    throw new AppError("QUICK_STATS_FETCH_FAILED", 500);
  }
}

export async function getStatesConfirmedStats() {
  "use cache";
  cacheLife("seconds");
  cacheTag("dashboard-stats");

  try {
    const statesStatsResult = await db
      .select({
        state: colleges.state,
        totalTeams: countDistinct(teams.id),
        totalParticipants: count(participants.id),
      })
      .from(colleges)
      .innerJoin(participants, eq(colleges.id, participants.collegeId))
      .innerJoin(teams, eq(participants.teamId, teams.id))
      .where(eq(teams.isCompleted, true))
      .groupBy(colleges.state)
      .orderBy(desc(countDistinct(teams.id)));

    return statesStatsResult;
  } catch (error) {
    console.log(error);
    throw new AppError("STATES_STATS_FETCH_FAILED", 500);
  }
}

export async function getCollegeRankingsBySelections() {
  "use cache";
  cacheLife("seconds");
  cacheTag("dashboard-stats");

  try {
    const collegeRankingsResult = await db
      .select({
        college: colleges.name,
        totalTeams: countDistinct(teams.id),
        totalParticipants: count(participants.id),
      })
      .from(colleges)
      .innerJoin(participants, eq(colleges.id, participants.collegeId))
      .innerJoin(teams, eq(participants.teamId, teams.id))
      .innerJoin(selected, eq(teams.id, selected.teamId))
      .groupBy(colleges.name)
      .orderBy(desc(count(selected.id)));

    return collegeRankingsResult;
  } catch (error) {
    console.log(error);
    throw new AppError("COLLEGE_RANKINGS_FETCH_FAILED", 500);
  }
}

export async function getStatesTotalStats() {
  "use cache";
  cacheLife("seconds");
  cacheTag("dashboard-stats");

  try {
    const statesStatsTotalResult = await db
      .select({
        state: colleges.state,
        totalTeams: countDistinct(teams.id),
        totalParticipants: count(participants.id),
      })
      .from(colleges)
      .innerJoin(participants, eq(colleges.id, participants.collegeId))
      .innerJoin(teams, eq(participants.teamId, teams.id))
      .groupBy(colleges.state)
      .orderBy(desc(countDistinct(teams.id)));

    return statesStatsTotalResult;
  } catch (error) {
    console.log(error);
    throw new AppError("STATES_STATS_TOTAL_FETCH_FAILED", 500);
  }
}

export async function getCollegeBreakdown({
  page = 0,
  limit = 10,
  state,
  ideaOnly = false,
}: {
  page?: number;
  limit?: number;
  state?: string;
  ideaOnly?: boolean;
}) {
  try {
    const whereConditions = state
      ? sql`${colleges.state} = ${state}`
      : undefined;

    const baseQuery = db
      .select({
        college: colleges.name,
        state: colleges.state,
        totalTeams: countDistinct(teams.id),
        confirmedTeams:
          sql<number>`count(distinct case when ${teams.isCompleted} = true then ${teams.id} end)`.mapWith(
            Number,
          ),
        ideaSubmissions:
          sql<number>`count(distinct ${ideaSubmission.id})`.mapWith(Number),
      })
      .from(colleges)
      .innerJoin(participants, eq(colleges.id, participants.collegeId))
      .innerJoin(teams, eq(participants.teamId, teams.id))
      .leftJoin(ideaSubmission, eq(teams.id, ideaSubmission.teamId));

    const query = whereConditions
      ? baseQuery.where(whereConditions)
      : baseQuery;

    const grouped = query.groupBy(colleges.name, colleges.state);

    const havingClause = ideaOnly
      ? grouped.having(sql`count(distinct ${ideaSubmission.id}) > 0`)
      : grouped;

    const allResults = await havingClause.orderBy(
      desc(countDistinct(teams.id)),
    );

    const total = allResults.length;
    const data = allResults.slice(page * limit, (page + 1) * limit);

    return { data, total };
  } catch (error) {
    console.log(error);
    throw new AppError("COLLEGE_BREAKDOWN_FETCH_FAILED", 500);
  }
}

export async function getCollegeBreakdownStates() {
  "use cache";
  cacheLife("seconds");
  cacheTag("dashboard-stats");

  try {
    const statesResult = await db
      .selectDistinct({ state: colleges.state })
      .from(colleges)
      .innerJoin(participants, eq(colleges.id, participants.collegeId))
      .innerJoin(teams, eq(participants.teamId, teams.id))
      .orderBy(colleges.state);

    return statesResult
      .map((r) => r.state)
      .filter((s): s is NonNullable<typeof s> => s !== null);
  } catch (error) {
    console.log(error);
    throw new AppError("COLLEGE_BREAKDOWN_STATES_FETCH_FAILED", 500);
  }
}

// For sake of visual trends, sry (iykyk)
export async function getRegistrationTrends() {
  "use cache";
  cacheLife("seconds");
  cacheTag("dashboard-stats");

  try {
    const teamTrends = await db
      .select({
        date: sql<string>`DATE(${teams.createdAt})`.as("date"),
        totalRegistrations: count(),
        confirmedRegistrations:
          sql<number>`count(case when ${teams.isCompleted} = true then 1 end)`.mapWith(
            Number,
          ),
      })
      .from(teams)
      .groupBy(sql`DATE(${teams.createdAt})`)
      .orderBy(sql`DATE(${teams.createdAt})`);

    const ideaTrends = await db
      .select({
        date: sql<string>`DATE(${ideaSubmission.createdAt})`.as("date"),
        submissions: count(),
      })
      .from(ideaSubmission)
      .groupBy(sql`DATE(${ideaSubmission.createdAt})`)
      .orderBy(sql`DATE(${ideaSubmission.createdAt})`);

    const userTrends = await db
      .select({
        date: sql<string>`DATE(${participants.createdAt})`.as("date"),
        userAccounts: count(),
      })
      .from(participants)
      .groupBy(sql`DATE(${participants.createdAt})`)
      .orderBy(sql`DATE(${participants.createdAt})`);

    const ideaMap = new Map(ideaTrends.map((i) => [i.date, i.submissions]));
    const userMap = new Map(userTrends.map((u) => [u.date, u.userAccounts]));
    const teamMap = new Map(
      teamTrends.map((t) => [
        t.date,
        {
          totalRegistrations: t.totalRegistrations,
          confirmedRegistrations: t.confirmedRegistrations,
        },
      ]),
    );

    const allDates = [
      ...new Set([
        ...teamTrends.map((t) => t.date),
        ...userTrends.map((u) => u.date),
        ...ideaTrends.map((i) => i.date),
      ]),
    ].sort();

    return allDates.map((date) => ({
      date,
      totalRegistrations: teamMap.get(date)?.totalRegistrations ?? 0,
      confirmedRegistrations: teamMap.get(date)?.confirmedRegistrations ?? 0,
      ideaSubmissions: ideaMap.get(date) ?? 0,
      userAccounts: userMap.get(date) ?? 0,
    }));
  } catch (error) {
    console.log(error);
    throw new AppError("REGISTRATION_TRENDS_FETCH_FAILED", 500);
  }
}

import {
  doublePrecision,
  index,
  integer,
  pgTable,
  text,
  unique,
} from "drizzle-orm/pg-core";
import { roundStatus } from "../enum";
import { dashboardUsers } from "./rbac";
import { teams } from "./team";

export const judges = pgTable(
  "judges",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    dashboardUserId: text("dashboard_user_id")
      .notNull()
      .references(() => dashboardUsers.id, { onDelete: "cascade" }),
  },
  (table) => [index("judge_dashboard_user_idx").on(table.dashboardUserId)],
);

export const judgeRounds = pgTable("judge_rounds", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),

  name: text("name").notNull(),

  status: roundStatus("status").default("Draft").notNull(),
});

export const judgeRoundAssignments = pgTable(
  "judge_round_assignments",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),

    judgeId: text("judge_id")
      .notNull()
      .references(() => judges.id, { onDelete: "cascade" }),

    teamId: text("team_id")
      .notNull()
      .references(() => teams.id, { onDelete: "cascade" }),

    judgeRoundId: text("judge_round_id")
      .notNull()
      .references(() => judgeRounds.id, { onDelete: "cascade" }),

    rawTotalScore: integer("raw_total_score").notNull().default(0),
    normalizedTotalScore: doublePrecision("normalized_total_score")
      .notNull()
      .default(0),
  },
  (table) => [
    unique("judge_round_team_assignment_unique").on(
      table.judgeId,
      table.teamId,
      table.judgeRoundId,
    ),
    index("judge_assignment_round_idx").on(table.judgeRoundId),
    index("judge_assignments_idx").on(table.judgeId),
    index("judge_assignment_team_idx").on(table.teamId),
    index("judge_round_judge_idx").on(table.judgeRoundId, table.judgeId),
    index("judge_round_team_idx").on(table.judgeRoundId, table.teamId),
  ],
);

export const judgeScores = pgTable(
  "judge_scores",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),

    roundAssignmentId: text("round_assignment_id")
      .notNull()
      .references(() => judgeRoundAssignments.id, { onDelete: "cascade" }),

    criteriaId: text("criteria_id")
      .notNull()
      .references(() => judgeCriterias.id, { onDelete: "cascade" }),

    rawScore: integer("raw_score").notNull().default(0),
  },
  (table) => [
    unique("judge_score_assignment_criteria_unique").on(
      table.roundAssignmentId,
      table.criteriaId,
    ),
    index("judge_score_assignment_idx").on(table.roundAssignmentId),
    index("judge_score_criteria_idx").on(table.criteriaId),
  ],
);

export const judgeCriterias = pgTable(
  "judge_criterias",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    judgeRoundId: text("judge_round_id")
      .notNull()
      .references(() => judgeRounds.id, { onDelete: "cascade" }),
    criteriaName: text("criteria_name").notNull(),
    maxScore: integer("max_score").notNull().default(10),
  },
  (table) => [index("judge_criteria_round_idx").on(table.judgeRoundId)],
);

export const teamRoundScores = pgTable(
  "team_round_scores",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),

    teamId: text("team_id").notNull(),
    roundId: text("round_id").notNull(),

    normalizedTotalScore: doublePrecision("normalized_total_score")
      .notNull()
      .default(0),
    judgeCount: integer("judge_count").notNull().default(0),
  },
  (table) => [
    unique("team_round_scores_unique").on(table.teamId, table.roundId),
  ],
);

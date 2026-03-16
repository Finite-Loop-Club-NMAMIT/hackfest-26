import {
  doublePrecision,
  integer,
  pgTable,
  text,
  timestamp,
  unique,
} from "drizzle-orm/pg-core";
import { roundStatus, teamStage } from "../enum";
import { dashboardUsers, roles } from "./rbac";
import { teams } from "./team";

export const ideaRounds = pgTable("idea_rounds", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),

  name: text("name").notNull(),

  roleId: text("role_id")
    .notNull()
    .references(() => roles.id),

  targetStage: teamStage("team_stage").default("NOT_SELECTED").notNull(),

  status: roundStatus("status").default("Draft").notNull(),

  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const ideaRoundAssignments = pgTable(
  "idea_round_assignments",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),

    roundId: text("round_id")
      .notNull()
      .references(() => ideaRounds.id, { onDelete: "cascade" }),

    teamId: text("team_id")
      .notNull()
      .references(() => teams.id, { onDelete: "cascade" }),

    evaluatorId: text("evaluator_id")
      .notNull()
      .references(() => dashboardUsers.id, { onDelete: "cascade" }),

    assignedAt: timestamp("assigned_at").defaultNow().notNull(),
  },
  (table) => [
    unique("unique_idea_assignment").on(
      table.roundId,
      table.teamId,
      table.evaluatorId,
    ),
  ],
);

export const ideaRoundCriteria = pgTable("idea_round_criteria", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),

  roundId: text("round_id")
    .notNull()
    .references(() => ideaRounds.id, { onDelete: "cascade" }),

  name: text("name").notNull(),

  maxScore: integer("max_score").default(10).notNull(),
});

export const ideaScores = pgTable(
  "idea_scores",
  {
    id: text("id").primaryKey(),

    roundId: text("round_id")
      .notNull()
      .references(() => ideaRounds.id),

    teamId: text("team_id")
      .notNull()
      .references(() => teams.id),

    evaluatorId: text("evaluator_id")
      .notNull()
      .references(() => dashboardUsers.id),

    criteriaId: text("criteria_id")
      .notNull()
      .references(() => ideaRoundCriteria.id),

    rawScore: integer("raw_score").notNull(),
  },
  (table) => [
    unique("unique_score").on(
      table.roundId,
      table.teamId,
      table.evaluatorId,
      table.criteriaId,
    ),
  ],
);

export const ideaTeamRoundScores = pgTable(
  "idea_team_round_scores",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),

    roundId: text("round_id")
      .notNull()
      .references(() => ideaRounds.id, { onDelete: "cascade" }),

    teamId: text("team_id")
      .notNull()
      .references(() => teams.id, { onDelete: "cascade" }),

    rawTotalScore: integer("raw_total_score").notNull().default(0),
    normalizedTotalScore: doublePrecision("normalized_total_score")
      .notNull()
      .default(0),

    evaluatorCount: integer("evaluator_count").notNull().default(0),
  },
  (table) => [
    unique("unique_idea_team_round_score").on(table.roundId, table.teamId),
  ],
);

export const ideaTeamEvaluations = pgTable(
  "idea_team_evaluations",
  {
    id: text("id").primaryKey(),

    roundId: text("round_id")
      .notNull()
      .references(() => ideaRounds.id),

    teamId: text("team_id")
      .notNull()
      .references(() => teams.id),

    evaluatorId: text("evaluator_id")
      .notNull()
      .references(() => dashboardUsers.id),

    rawTotalScore: integer("raw_total_score").notNull().default(0),

    normalizedTotalScore: doublePrecision("normalized_total_score")
      .notNull()
      .default(0),
  },
  (table) => [
    unique("unique_team_evaluation").on(
      table.roundId,
      table.teamId,
      table.evaluatorId,
    ),
  ],
);

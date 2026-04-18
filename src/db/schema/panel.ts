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

export const panelists = pgTable(
  "panelists",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    dashboardUserId: text("dashboard_user_id")
      .notNull()
      .references(() => dashboardUsers.id, { onDelete: "cascade" }),
  },
  (table) => [index("panelist_dashboard_user_idx").on(table.dashboardUserId)],
);

export const panelRounds = pgTable("panel_rounds", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),

  name: text("name").notNull(),

  status: roundStatus("status").default("Draft").notNull(),
});

export const panelRoundAssignments = pgTable(
  "panel_round_assignments",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),

    panelistId: text("panelist_id")
      .notNull()
      .references(() => panelists.id, { onDelete: "cascade" }),

    teamId: text("team_id")
      .notNull()
      .references(() => teams.id, { onDelete: "cascade" }),

    panelRoundId: text("panel_round_id")
      .notNull()
      .references(() => panelRounds.id, { onDelete: "cascade" }),

    rawTotalScore: integer("raw_total_score"),
    normalizedTotalScore: doublePrecision("normalized_total_score"),
  },
  (table) => [
    unique("panel_round_team_assignment_unique").on(
      table.panelistId,
      table.teamId,
      table.panelRoundId,
    ),
    index("panel_assignment_round_idx").on(table.panelRoundId),
    index("panel_assignments_idx").on(table.panelistId),
    index("panel_assignment_team_idx").on(table.teamId),
    index("panel_round_panelist_idx").on(table.panelRoundId, table.panelistId),
    index("panel_round_team_idx").on(table.panelRoundId, table.teamId),
  ],
);

export const panelScores = pgTable(
  "panel_scores",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),

    roundAssignmentId: text("round_assignment_id")
      .notNull()
      .references(() => panelRoundAssignments.id, { onDelete: "cascade" }),

    criteriaId: text("criteria_id")
      .notNull()
      .references(() => panelCriterias.id, { onDelete: "cascade" }),

    rawScore: integer("raw_score"),
  },
  (table) => [
    unique("panel_score_assignment_criteria_unique").on(
      table.roundAssignmentId,
      table.criteriaId,
    ),
    index("panel_score_assignment_idx").on(table.roundAssignmentId),
    index("panel_score_criteria_idx").on(table.criteriaId),
  ],
);

export const panelCriterias = pgTable(
  "panel_criterias",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    panelRoundId: text("panel_round_id")
      .notNull()
      .references(() => panelRounds.id, { onDelete: "cascade" }),
    criteriaName: text("criteria_name").notNull(),
    maxScore: integer("max_score").notNull().default(10),
  },
  (table) => [index("panel_criteria_round_idx").on(table.panelRoundId)],
);

export const panelTeamRoundScores = pgTable(
  "panel_team_round_scores",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),

    teamId: text("team_id")
      .notNull()
      .references(() => teams.id, { onDelete: "cascade" }),
    roundId: text("round_id")
      .notNull()
      .references(() => panelRounds.id, { onDelete: "cascade" }),

    rawTotalScore: integer("raw_total_score"),
    normalizedTotalScore: doublePrecision("normalized_total_score"),
    panelistCount: integer("panelist_count").notNull().default(0),
  },
  (table) => [
    unique("panel_team_round_scores_unique").on(table.teamId, table.roundId),
  ],
);

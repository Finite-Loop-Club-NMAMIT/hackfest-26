// Write relations here
// Why relations? Gives type safety eg .with joins

import { relations } from "drizzle-orm";
import { colleges, teams, users } from "./schema";

export const userRelations = relations(users, ({ one }) => ({
  college: one(colleges, {
    fields: [users.collegeId],
    references: [colleges.id],
  }),
  team: one(teams, {
    fields: [users.teamId],
    references: [teams.id],
  }),
}));

export const collegeRelations = relations(colleges, ({ many }) => ({
  users: many(users),
}));

export const teamRelations = relations(teams, ({ many }) => ({
  users: many(users),
}));

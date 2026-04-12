import {
  bigint,
  boolean,
  integer,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import { timerStatus } from "../enum";

export const timer = pgTable("timer", {
  id: text()
    .primaryKey()
    .notNull()
    .$defaultFn(() => crypto.randomUUID()),
  label: text().notNull(),
  durationSeconds: integer("duration_seconds").notNull(),
  elapsedSeconds: integer("elapsed_seconds").default(0).notNull(),
  status: timerStatus("status").default("IDLE").notNull(),
  startedAt: bigint("started_at", { mode: "number" }),
  startTime: timestamp("start_time", { mode: "string" }),
  createdAt: timestamp("created_at", { mode: "string" }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { mode: "string" }).defaultNow().notNull(),
});

export const announcement = pgTable("announcement", {
  id: text()
    .primaryKey()
    .notNull()
    .$defaultFn(() => crypto.randomUUID()),
  message: text().notNull(),
  active: boolean("active").default(false).notNull(),
  createdAt: timestamp("created_at", { mode: "string" }).defaultNow().notNull(),
});

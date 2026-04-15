import { integer, pgTable, text } from "drizzle-orm/pg-core";

export const lab = pgTable("lab", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  capacity: integer("capacity").notNull(),
});

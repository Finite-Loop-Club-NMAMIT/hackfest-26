import { integer, pgTable, text, uuid } from "drizzle-orm/pg-core";

export const lab = pgTable("lab", {
  id: uuid("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  capacity: integer("capacity").notNull(),
});

// db/schema/embeddings.ts
import { mysqlTable, varchar, text, index } from "drizzle-orm/mysql-core";
import { customType } from "drizzle-orm/mysql-core";
import { nanoid } from "nanoid";

const vector = (name: string, dims: number = 3072) =>
  customType<{ data: number[] }>({
    dataType() {
      return `vector(${dims})`;
    },
    // send the raw array, Drizzle/MySQL2 will encode it as JSON
    toDriver(value: number[]) {
      return value;
    },
    // TiDB returns it as JSON → number[]
    fromDriver(value: unknown): number[] {
      if (Array.isArray(value)) return value;
      if (typeof value === "string") {
        try {
          return JSON.parse(value);
        } catch {
          return [];
        }
      }
      return [];
    },
  })(name);

export const embeddings = mysqlTable(
  "embeddings",
  {
    id: varchar("id", { length: 191 })
      .primaryKey()
      .$defaultFn(() => nanoid()),
    resourceId: varchar("resource_id", { length: 191 }).notNull(),
    content: text("content").notNull(),
    embedding: vector("embedding", 3072).notNull(),
  },
  (table) => [index("resource_id_index").on(table.resourceId)]
);

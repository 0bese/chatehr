import type { Config } from "drizzle-kit";
import { env } from "@/lib/env.mjs";

export default {
  schema: "./src/lib/db/schema",
  dialect: "mysql",
  out: "./src/lib/db/migrations",
  dbCredentials: {
    host: env.HOST, // Use public endpoint
    port: 4000,
    user: env.USER,
    password: env.PASSWORD,
    database: env.DATABASE,
    ssl: { rejectUnauthorized: false },
    url: env.TIDB_URL,
  },
} satisfies Config;

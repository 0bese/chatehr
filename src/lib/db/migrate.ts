import { env } from "@/lib/env.mjs";

import { drizzle } from "drizzle-orm/mysql2";
import { migrate } from "drizzle-orm/mysql2/migrator";
import mysql from "mysql2/promise";

const runMigrate = async () => {
  if (!env.TIDB_URL) {
    throw new Error("TIDB_URL is not defined");
  }

  const connection = await mysql.createConnection(env.TIDB_URL);
  const db = drizzle(connection);

  console.log("⏳ Running migrations...");
  const start = Date.now();

  await migrate(db, { migrationsFolder: "lib/db/migrations" });

  const end = Date.now();
  console.log("✅ Migrations completed in", end - start, "ms");

  await connection.end();
  process.exit(0);
};

runMigrate().catch((err) => {
  console.error("❌ Migration failed");
  console.error(err);
  process.exit(1);
});

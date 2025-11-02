import type { Config } from "drizzle-kit";

const databaseUrl = process.env.DATABASE_URL || "file:./sqlite.db";
const isPostgres = databaseUrl.startsWith("postgres");

export default {
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: isPostgres ? "postgresql" : "sqlite",
  dbCredentials: isPostgres
    ? { url: databaseUrl }
    : { url: databaseUrl.replace("file:", "") },
} satisfies Config;

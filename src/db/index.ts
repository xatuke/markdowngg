import { drizzle as drizzlePg } from "drizzle-orm/postgres-js";
import { drizzle as drizzleSqlite } from "drizzle-orm/better-sqlite3";
import postgres from "postgres";
import Database from "better-sqlite3";
import { documentsPg, documentsLite } from "./schema";

const databaseUrl = process.env.DATABASE_URL || "file:./sqlite.db";
const isPostgres = databaseUrl.startsWith("postgres");

let db: any;
let documents: typeof documentsPg | typeof documentsLite;

if (isPostgres) {
  const client = postgres(databaseUrl);
  db = drizzlePg(client);
  documents = documentsPg;
} else {
  const dbPath = databaseUrl.replace("file:", "");
  const sqlite = new Database(dbPath);
  db = drizzleSqlite(sqlite);
  documents = documentsLite;
}

export { db, documents };
export type Database = typeof db;

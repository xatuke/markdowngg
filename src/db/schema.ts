import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { pgTable, text as pgText, timestamp } from "drizzle-orm/pg-core";

// SQLite Schema
export const documentsLite = sqliteTable("documents", {
  id: text("id").primaryKey(),
  encryptedContent: text("encrypted_content").notNull(),
  writeTokenHash: text("write_token_hash"), // Nullable for backwards compatibility with old docs
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});

// PostgreSQL Schema
export const documentsPg = pgTable("documents", {
  id: pgText("id").primaryKey(),
  encryptedContent: pgText("encrypted_content").notNull(),
  writeTokenHash: pgText("write_token_hash"), // Nullable for backwards compatibility with old docs
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Type exports
export type Document = {
  id: string;
  encryptedContent: string;
  writeTokenHash: string | null;
  createdAt: Date;
};

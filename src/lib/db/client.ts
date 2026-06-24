import { DatabaseSync } from "node:sqlite";
import fs from "node:fs";
import path from "node:path";

const DB_PATH = process.env.DATABASE_PATH || path.join(process.cwd(), "data", "rezervasyo.db");

declare global {
  // eslint-disable-next-line no-var
  var __rezervasyoDb: DatabaseSync | undefined;
}

function createDb(): DatabaseSync {
  const dir = path.dirname(DB_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  const db = new DatabaseSync(DB_PATH);
  db.exec("PRAGMA journal_mode = WAL;");
  db.exec("PRAGMA foreign_keys = ON;");

  const schema = fs.readFileSync(path.join(process.cwd(), "src", "lib", "db", "schema.sql"), "utf-8");
  db.exec(schema);
  runMigrations(db);

  return db;
}

function runMigrations(db: DatabaseSync) {
  const statements = [
    "ALTER TABLE plans ADD COLUMN original_monthly_price REAL",
    "ALTER TABLE plans ADD COLUMN original_yearly_price REAL",
  ];
  for (const sql of statements) {
    try {
      db.exec(sql);
    } catch (err) {
      if (!(err instanceof Error) || !/duplicate column/i.test(err.message)) throw err;
    }
  }
}

export function getDb(): DatabaseSync {
  if (!globalThis.__rezervasyoDb) {
    globalThis.__rezervasyoDb = createDb();
  }
  return globalThis.__rezervasyoDb;
}

export function uid(): string {
  return crypto.randomUUID();
}

export function nowIso(): string {
  return new Date().toISOString();
}

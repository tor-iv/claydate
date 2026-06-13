import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { mkdirSync } from "fs";
import { dirname } from "path";
import * as schema from "./schema";

const DB_PATH = process.env.DB_PATH ?? "./data/claydate.db";
const UPLOAD_DIR = process.env.DATA_DIR ?? "./data/uploads";

// Ensure data directories exist on startup
mkdirSync(dirname(DB_PATH), { recursive: true });
mkdirSync(UPLOAD_DIR, { recursive: true });

function createDb() {
  const sqlite = new Database(DB_PATH);

  // Performance and integrity pragmas
  sqlite.pragma("journal_mode = WAL");
  sqlite.pragma("foreign_keys = ON");

  // Bootstrap all tables — raw SQL must exactly match Drizzle schema definitions
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      avatar_shape TEXT NOT NULL,
      avatar_glaze TEXT NOT NULL,
      avatar_pattern TEXT NOT NULL,
      created_at INTEGER NOT NULL
    );

    CREATE INDEX IF NOT EXISTS users_name_idx ON users (name);

    CREATE TABLE IF NOT EXISTS meetups (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      location TEXT NOT NULL,
      date TEXT NOT NULL,
      time TEXT NOT NULL,
      note TEXT,
      created_by TEXT NOT NULL REFERENCES users(id),
      created_at INTEGER NOT NULL
    );

    CREATE INDEX IF NOT EXISTS meetups_date_idx ON meetups (date);

    CREATE TABLE IF NOT EXISTS rsvps (
      id TEXT PRIMARY KEY,
      meetup_id TEXT NOT NULL REFERENCES meetups(id) ON DELETE CASCADE,
      user_id TEXT NOT NULL REFERENCES users(id),
      status TEXT NOT NULL CHECK (status IN ('yes', 'no', 'maybe')),
      updated_at INTEGER NOT NULL,
      UNIQUE(meetup_id, user_id)
    );

    CREATE INDEX IF NOT EXISTS rsvps_meetup_id_idx ON rsvps (meetup_id);

    CREATE TABLE IF NOT EXISTS comments (
      id TEXT PRIMARY KEY,
      meetup_id TEXT NOT NULL REFERENCES meetups(id) ON DELETE CASCADE,
      user_id TEXT NOT NULL REFERENCES users(id),
      body TEXT NOT NULL,
      created_at INTEGER NOT NULL
    );

    CREATE INDEX IF NOT EXISTS comments_meetup_id_idx ON comments (meetup_id);

    CREATE TABLE IF NOT EXISTS gallery_photos (
      id TEXT PRIMARY KEY,
      meetup_id TEXT NOT NULL REFERENCES meetups(id) ON DELETE CASCADE,
      user_id TEXT NOT NULL REFERENCES users(id),
      filename TEXT NOT NULL,
      caption TEXT,
      created_at INTEGER NOT NULL
    );

    CREATE INDEX IF NOT EXISTS gallery_photos_meetup_id_idx ON gallery_photos (meetup_id);
  `);

  return drizzle(sqlite, { schema });
}

// globalThis guard to prevent multiple connections during Next.js dev hot-reload
const globalForDb = globalThis as typeof globalThis & {
  _claydateDb?: ReturnType<typeof createDb>;
};

export const db = globalForDb._claydateDb ?? createDb();

if (process.env.NODE_ENV !== "production") {
  globalForDb._claydateDb = db;
}

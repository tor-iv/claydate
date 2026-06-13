import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { mkdirSync } from "fs";
import { dirname } from "path";
import { nanoid } from "nanoid";
import * as schema from "./schema.ts";

const DB_PATH = process.env.DB_PATH ?? "./data/claydate.db";
const UPLOAD_DIR = process.env.DATA_DIR ?? "./data/uploads";

mkdirSync(dirname(DB_PATH), { recursive: true });
mkdirSync(UPLOAD_DIR, { recursive: true });

const sqlite = new Database(DB_PATH);
sqlite.pragma("journal_mode = WAL");
sqlite.pragma("foreign_keys = ON");

// DDL duplicated from index.ts: this script runs via plain `node` (which needs
// .ts-suffixed relative imports), while index.ts must stay bundler-importable
// (extensionless imports). Keep both DDL blocks in sync.
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

const db = drizzle(sqlite, { schema });

const now = Date.now();

// Seed users
const user1Id = nanoid();
const user2Id = nanoid();

await db.insert(schema.users).values([
  {
    id: user1Id,
    name: "Maya",
    avatar_shape: "round-belly",
    avatar_glaze: "celadon",
    avatar_pattern: "dots",
    created_at: now,
  },
  {
    id: user2Id,
    name: "Jordan",
    avatar_shape: "tall-slim",
    avatar_glaze: "terracotta",
    avatar_pattern: "stripes",
    created_at: now,
  },
]);

// Seed meetups
const meetup1Id = nanoid();
const meetup2Id = nanoid();

await db.insert(schema.meetups).values([
  {
    id: meetup1Id,
    title: "Wheel Throwing Night",
    location: "Slo Slo Studio",
    date: "2026-06-20",
    time: "18:00",
    note: "Bring comfy clothes you don't mind getting muddy!",
    created_by: user1Id,
    created_at: now,
  },
  {
    id: meetup2Id,
    title: "Glazing Session",
    location: "Slo Slo Studio",
    date: "2026-06-27",
    time: "14:00",
    note: null,
    created_by: user2Id,
    created_at: now,
  },
]);

// Seed RSVPs
await db.insert(schema.rsvps).values([
  {
    id: nanoid(),
    meetup_id: meetup1Id,
    user_id: user1Id,
    status: "yes",
    updated_at: now,
  },
  {
    id: nanoid(),
    meetup_id: meetup1Id,
    user_id: user2Id,
    status: "maybe",
    updated_at: now,
  },
  {
    id: nanoid(),
    meetup_id: meetup2Id,
    user_id: user2Id,
    status: "yes",
    updated_at: now,
  },
]);

// Seed comments
await db.insert(schema.comments).values([
  {
    id: nanoid(),
    meetup_id: meetup1Id,
    user_id: user2Id,
    body: "Can't wait, I've been wanting to try the wheel for ages!",
    created_at: now,
  },
  {
    id: nanoid(),
    meetup_id: meetup2Id,
    user_id: user1Id,
    body: "I finally finished my bowls — time to make them pretty.",
    created_at: now,
  },
]);

console.log("Seed complete:");
console.log(`  Users: ${user1Id} (Maya), ${user2Id} (Jordan)`);
console.log(`  Meetups: ${meetup1Id} (Wheel Throwing Night), ${meetup2Id} (Glazing Session)`);
console.log("  RSVPs: 3 rows");
console.log("  Comments: 2 rows");

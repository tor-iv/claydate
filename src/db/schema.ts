import { sqliteTable, text, integer, index, uniqueIndex } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";
// Type-only import (erased at runtime) so this file stays runnable via plain
// `node src/db/seed.ts`; canonical avatar option lists live in lib/avatars.ts
import type { AvatarShape, AvatarGlaze, AvatarPattern } from "../lib/avatars.ts";

export const users = sqliteTable(
  "users",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    avatar_shape: text("avatar_shape").$type<AvatarShape>().notNull(),
    avatar_glaze: text("avatar_glaze").$type<AvatarGlaze>().notNull(),
    avatar_pattern: text("avatar_pattern").$type<AvatarPattern>().notNull(),
    created_at: integer("created_at").notNull(),
  },
  (t) => [
    index("users_name_idx").on(t.name),
    // Names are identity here — forbid case-insensitive duplicates at the DB level
    uniqueIndex("users_name_ci_uniq").on(sql`lower(${t.name})`),
  ]
);

export const meetups = sqliteTable(
  "meetups",
  {
    id: text("id").primaryKey(),
    title: text("title").notNull(),
    location: text("location").notNull(),
    date: text("date").notNull(),
    time: text("time").notNull(),
    note: text("note"),
    created_by: text("created_by")
      .notNull()
      .references(() => users.id),
    created_at: integer("created_at").notNull(),
  },
  (t) => [index("meetups_date_idx").on(t.date)]
);

export const rsvps = sqliteTable(
  "rsvps",
  {
    id: text("id").primaryKey(),
    meetup_id: text("meetup_id")
      .notNull()
      .references(() => meetups.id, { onDelete: "cascade" }),
    user_id: text("user_id")
      .notNull()
      .references(() => users.id),
    status: text("status", { enum: ["yes", "no", "maybe"] }).notNull(),
    updated_at: integer("updated_at").notNull(),
  },
  (t) => [
    index("rsvps_meetup_id_idx").on(t.meetup_id),
    uniqueIndex("rsvps_meetup_user_uniq").on(t.meetup_id, t.user_id),
  ]
);

export const comments = sqliteTable(
  "comments",
  {
    id: text("id").primaryKey(),
    meetup_id: text("meetup_id")
      .notNull()
      .references(() => meetups.id, { onDelete: "cascade" }),
    user_id: text("user_id")
      .notNull()
      .references(() => users.id),
    body: text("body").notNull(),
    created_at: integer("created_at").notNull(),
  },
  (t) => [index("comments_meetup_id_idx").on(t.meetup_id)]
);

export const gallery_photos = sqliteTable(
  "gallery_photos",
  {
    id: text("id").primaryKey(),
    meetup_id: text("meetup_id")
      .notNull()
      .references(() => meetups.id, { onDelete: "cascade" }),
    user_id: text("user_id")
      .notNull()
      .references(() => users.id),
    filename: text("filename").notNull(),
    caption: text("caption"),
    created_at: integer("created_at").notNull(),
  },
  (t) => [index("gallery_photos_meetup_id_idx").on(t.meetup_id)]
);

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export type Meetup = typeof meetups.$inferSelect;
export type NewMeetup = typeof meetups.$inferInsert;

export type Rsvp = typeof rsvps.$inferSelect;
export type NewRsvp = typeof rsvps.$inferInsert;

export type Comment = typeof comments.$inferSelect;
export type NewComment = typeof comments.$inferInsert;

export type GalleryPhoto = typeof gallery_photos.$inferSelect;
export type NewGalleryPhoto = typeof gallery_photos.$inferInsert;

// ── Secret Santa ─────────────────────────────────────────────────────────────
// Raw DDL lives in santa-ddl.ts; keep both in sync.

export const santaExchange = sqliteTable("santa_exchange", {
  id: text("id").primaryKey(), // always "singleton"
  year: integer("year").notNull(),
  budget_text: text("budget_text"),
  deadline_date: text("deadline_date"), // YYYY-MM-DD
  house_rules: text("house_rules"),
  no_mutual_pairs: integer("no_mutual_pairs", { mode: "boolean" }).notNull().default(false),
  draw_status: text("draw_status", { enum: ["none", "drawn", "unsealed"] }).notNull().default("none"),
  drawn_at: integer("drawn_at"),
  unsealed_at: integer("unsealed_at"),
});

export const santaParticipants = sqliteTable("santa_participants", {
  user_id: text("user_id").primaryKey().references(() => users.id, { onDelete: "cascade" }),
  reveal_pin_hash: text("reveal_pin_hash"),
  joined_at: integer("joined_at").notNull(),
});

export const santaExclusions = sqliteTable(
  "santa_exclusions",
  {
    a_id: text("a_id").notNull().references(() => santaParticipants.user_id, { onDelete: "cascade" }),
    b_id: text("b_id").notNull().references(() => santaParticipants.user_id, { onDelete: "cascade" }),
    note: text("note"),
  },
  (t) => [uniqueIndex("santa_exclusions_pair_uniq").on(t.a_id, t.b_id), index("santa_exclusions_b_idx").on(t.b_id)]
);

export const santaAssignments = sqliteTable("santa_assignments", {
  giver_id: text("giver_id").primaryKey().references(() => santaParticipants.user_id, { onDelete: "cascade" }),
  receiver_id: text("receiver_id").notNull().unique().references(() => santaParticipants.user_id, { onDelete: "cascade" }),
  revealed_at: integer("revealed_at"),
});

export const santaWishItems = sqliteTable(
  "santa_wish_items",
  {
    id: text("id").primaryKey(),
    user_id: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    url: text("url"),
    price_note: text("price_note"),
    position: integer("position").notNull(),
    created_at: integer("created_at").notNull(),
  },
  (t) => [index("santa_wish_items_user_idx").on(t.user_id, t.position)]
);

export const santaAuditLog = sqliteTable(
  "santa_audit_log",
  {
    id: text("id").primaryKey(),
    actor_id: text("actor_id").references(() => users.id, { onDelete: "set null" }),
    action: text("action").notNull(),
    detail: text("detail"),
    created_at: integer("created_at").notNull(),
  },
  (t) => [index("santa_audit_log_created_idx").on(t.created_at)]
);

export type SantaExchange = typeof santaExchange.$inferSelect;
export type SantaParticipant = typeof santaParticipants.$inferSelect;
export type SantaWishItem = typeof santaWishItems.$inferSelect;

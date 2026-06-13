import { sqliteTable, text, integer, index, uniqueIndex } from "drizzle-orm/sqlite-core";

export const users = sqliteTable(
  "users",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    avatar_shape: text("avatar_shape").notNull(),
    avatar_glaze: text("avatar_glaze").notNull(),
    avatar_pattern: text("avatar_pattern").notNull(),
    created_at: integer("created_at").notNull(),
  },
  (t) => [index("users_name_idx").on(t.name)]
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

"use server";

import { redirect } from "next/navigation";
import { eq, sql } from "drizzle-orm";
import { nanoid } from "nanoid";
import { db } from "@/db";
import { users } from "@/db/schema";
import { getSession } from "@/lib/session";
import {
  AVATAR_SHAPES,
  AVATAR_GLAZES,
  AVATAR_PATTERNS,
  DEFAULT_AVATAR,
} from "@/lib/avatars";
import type { AvatarShape, AvatarGlaze, AvatarPattern } from "@/lib/avatars";

function validShape(id: string): AvatarShape {
  return AVATAR_SHAPES.some((s) => s.id === id)
    ? (id as AvatarShape)
    : DEFAULT_AVATAR.shape;
}

function validGlaze(id: string): AvatarGlaze {
  return AVATAR_GLAZES.some((g) => g.id === id)
    ? (id as AvatarGlaze)
    : DEFAULT_AVATAR.glaze;
}

function validPattern(id: string): AvatarPattern {
  return AVATAR_PATTERNS.some((p) => p.id === id)
    ? (id as AvatarPattern)
    : DEFAULT_AVATAR.pattern;
}

export async function loginAction(formData: FormData): Promise<void> {
  const rawName = (formData.get("name") ?? "").toString().trim();
  const rawShape = (formData.get("avatarShape") ?? "").toString();
  const rawGlaze = (formData.get("avatarGlaze") ?? "").toString();
  const rawPattern = (formData.get("avatarPattern") ?? "").toString();

  // Validate name — redirect back with error message as searchParam
  if (!rawName) {
    redirect(
      "/login?error=" +
        encodeURIComponent("Name can't be empty — what do your friends call you? 🏺")
    );
  }
  if (rawName.length > 50) {
    redirect(
      "/login?error=" +
        encodeURIComponent("That name is a bit long! Keep it under 50 characters.")
    );
  }

  // Sanitize avatar fields (fall back to defaults for invalid values)
  const avatarShape = validShape(rawShape);
  const avatarGlaze = validGlaze(rawGlaze);
  const avatarPattern = validPattern(rawPattern);

  // Case-insensitive lookup
  const existing = await db
    .select()
    .from(users)
    .where(sql`lower(${users.name}) = ${rawName.toLowerCase()}`)
    .limit(1);

  let userId: string;
  let userName: string;

  if (existing.length > 0) {
    // Update avatar for returning user
    const user = existing[0];
    await db
      .update(users)
      .set({
        avatar_shape: avatarShape,
        avatar_glaze: avatarGlaze,
        avatar_pattern: avatarPattern,
      })
      .where(eq(users.id, user.id));
    userId = user.id;
    userName = user.name; // preserve original casing
  } else {
    // Create new user
    userId = nanoid();
    userName = rawName;
    await db.insert(users).values({
      id: userId,
      name: userName,
      avatar_shape: avatarShape,
      avatar_glaze: avatarGlaze,
      avatar_pattern: avatarPattern,
      created_at: Date.now(),
    });
  }

  // Set session
  const session = await getSession();
  session.userId = userId;
  session.userName = userName;
  await session.save();

  redirect("/calendar");
}

export async function logoutAction(): Promise<void> {
  const session = await getSession();
  session.destroy();
  redirect("/login");
}

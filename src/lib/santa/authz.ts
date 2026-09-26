import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { santaParticipants, users, type SantaParticipant, type User } from "@/db/schema";
import { getCurrentUser, canEdit } from "@/lib/session";
import { SANTA_ORGANIZERS } from "@/lib/constants";

export interface SantaContext {
  user: User;
  role: "friend" | "guest";
  isOrganizer: boolean;
  participant: SantaParticipant | null;
}

/** The logged-in claydate user plus their Secret Santa standing. Redirects to /login if signed out. */
export async function requireSantaUser(): Promise<SantaContext> {
  const session = await getCurrentUser();
  if (!session) redirect("/login?next=/santa");
  const user = (await db.select().from(users).where(eq(users.id, session.userId)).limit(1))[0];
  if (!user) redirect("/login?next=/santa");
  const participant =
    (await db.select().from(santaParticipants).where(eq(santaParticipants.user_id, user.id)).limit(1))[0] ?? null;
  const role = session.role ?? "friend";
  return {
    user,
    role,
    isOrganizer: canEdit(role) && SANTA_ORGANIZERS.includes(user.name.toLowerCase()),
    participant,
  };
}

export async function requireSantaOrganizer(): Promise<SantaContext> {
  const ctx = await requireSantaUser();
  if (!ctx.isOrganizer) redirect("/santa");
  return ctx;
}

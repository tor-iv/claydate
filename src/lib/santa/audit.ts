import { nanoid } from "nanoid";
import { db } from "@/db";
import { santaAuditLog } from "@/db/schema";

export async function santaAudit(actorId: string | null, action: string, detail?: unknown): Promise<void> {
  await db.insert(santaAuditLog).values({
    id: nanoid(),
    actor_id: actorId,
    action,
    detail: detail === undefined ? null : JSON.stringify(detail),
    created_at: Date.now(),
  });
}

import { eq } from "drizzle-orm";
import { db } from "@/db";
import { santaExchange } from "@/db/schema";

/** The single exchange row, created on first use. */
export function getSantaExchange() {
  const row = db.select().from(santaExchange).where(eq(santaExchange.id, "singleton")).get();
  if (row) return row;
  db.insert(santaExchange).values({ id: "singleton", year: new Date().getFullYear() }).onConflictDoNothing().run();
  return db.select().from(santaExchange).where(eq(santaExchange.id, "singleton")).get()!;
}

export function sessionKeyFor(pinHash: string): string {
  return pinHash.slice(-16);
}

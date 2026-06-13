import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import type { SessionOptions } from "iron-session";

export interface SessionData {
  userId: string;
  userName: string;
}

// Dev-only fallback — replace with a real secret in production via SESSION_SECRET env var
const DEV_ONLY_SECRET = "dev-only-secret-do-not-use-in-production-claydate-2026";

const sessionOptions: SessionOptions = {
  cookieName: "claydate-session",
  password: process.env.SESSION_SECRET ?? DEV_ONLY_SECRET,
  // ~1 year in seconds — this is a friends app, no aggressive expiry needed
  ttl: 365 * 24 * 60 * 60,
  cookieOptions: {
    httpOnly: true,
    sameSite: "lax",
    // IMPORTANT: must NOT default to true — app serves plain HTTP on a bare IP.
    // A secure-only cookie would silently break login over plain HTTP.
    secure: process.env.HTTPS === "true",
  },
};

export async function getSession() {
  // In Next.js 16, cookies() is async and must be awaited
  return getIronSession<SessionData>(await cookies(), sessionOptions);
}

export async function getCurrentUser(): Promise<{
  userId: string;
  userName: string;
} | null> {
  const session = await getSession();
  if (!session.userId || !session.userName) {
    return null;
  }
  return { userId: session.userId, userName: session.userName };
}

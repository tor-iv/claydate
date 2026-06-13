import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import type { SessionOptions } from "iron-session";

export interface SessionData {
  userId: string;
  userName: string;
}

function resolveSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (secret && secret.length >= 32) {
    return secret;
  }
  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "SESSION_SECRET must be set to a 32+ character value in production"
    );
  }
  console.warn("claydate: SESSION_SECRET not set — using insecure dev secret");
  return "dev-only-secret-never-used-in-production";
}

const sessionOptions: SessionOptions = {
  cookieName: "claydate-session",
  password: resolveSecret(),
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

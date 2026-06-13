import type { Metadata } from "next";
import { Caveat, Patrick_Hand } from "next/font/google";
import { eq } from "drizzle-orm";
import PaperTexture from "@/components/ui/PaperTexture";
import PageHeader from "@/components/shared/PageHeader";
import { getCurrentUser } from "@/lib/session";
import { db } from "@/db";
import { users } from "@/db/schema";
import "./globals.css";

const caveat = Caveat({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-caveat",
  display: "swap",
});

const patrickHand = Patrick_Hand({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-patrick-hand",
  display: "swap",
});

export const metadata: Metadata = {
  title: "ClayDate 🏺",
  description: "Pottery meetup calendar for friends at Slo Slo Studio, LES NYC",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Resolve the logged-in user's full DB row for avatar data
  let headerUser: {
    name: string;
    avatarShape: string;
    avatarGlaze: string;
    avatarPattern: string;
  } | null = null;

  try {
    const sessionUser = await getCurrentUser();
    if (sessionUser) {
      const rows = await db
        .select()
        .from(users)
        .where(eq(users.id, sessionUser.userId))
        .limit(1);

      if (rows.length > 0) {
        const row = rows[0];
        headerUser = {
          name: row.name,
          avatarShape: row.avatar_shape,
          avatarGlaze: row.avatar_glaze,
          avatarPattern: row.avatar_pattern,
        };
      }
      // If rows.length === 0, userId is stale (deleted DB row) — treat as logged out
    }
  } catch (e) {
    // Next probes routes for static rendering during build; reading cookies
    // forces dynamic — that's expected, not an error worth logging. Only log
    // genuine session/DB failures (silent ones look like "I keep getting
    // logged out" with no trace).
    if (!(e instanceof Error && e.message.includes("Dynamic server usage"))) {
      console.error("RootLayout: failed to resolve session user", e);
    }
    headerUser = null;
  }

  return (
    <html
      lang="en"
      className={`${caveat.variable} ${patrickHand.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {/* Inline wobbly SVG filter – zero-size, position:absolute, global */}
        <svg
          width="0"
          height="0"
          style={{ position: "absolute", overflow: "hidden" }}
          aria-hidden="true"
        >
          <defs>
            <filter id="wobbly-filter" x="-5%" y="-5%" width="110%" height="110%">
              <feTurbulence
                type="fractalNoise"
                baseFrequency="0.02"
                numOctaves="3"
                seed="2"
                result="noise"
              />
              <feDisplacementMap
                in="SourceGraphic"
                in2="noise"
                scale="3"
                xChannelSelector="R"
                yChannelSelector="G"
              />
            </filter>
          </defs>
        </svg>

        <PaperTexture className="flex flex-col flex-1">
          <PageHeader user={headerUser} />
          {children}
        </PaperTexture>
      </body>
    </html>
  );
}

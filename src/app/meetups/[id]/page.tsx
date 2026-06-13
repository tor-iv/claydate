import { notFound } from "next/navigation";
import { eq, asc } from "drizzle-orm";
import { db } from "@/db";
import { meetups, rsvps, comments, users } from "@/db/schema";
import { getCurrentUser } from "@/lib/session";
import WobblyCard from "@/components/ui/WobblyCard";
import DoodleIcon from "@/components/ui/DoodleIcon";
import UserTag from "@/components/shared/UserTag";
import RsvpBar from "@/components/meetups/RsvpBar";
import type { UserInfo } from "@/components/meetups/RsvpBar";
import CommentThread from "@/components/meetups/CommentThread";
import type { CommentEntry } from "@/components/meetups/CommentThread";

interface MeetupDetailPageProps {
  params: Promise<{ id: string }>;
}

/** Format "HH:MM" to "3:30 PM" style — inline helper, no external import */
function format12h(time: string): string {
  const [hStr, mStr] = time.split(":");
  const h = parseInt(hStr, 10);
  const m = mStr ?? "00";
  const period = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${m} ${period}`;
}

/** Format "YYYY-MM-DD" to "Saturday, June 14" style */
function formatDate(dateStr: string): string {
  const [y, mo, d] = dateStr.split("-").map(Number);
  // Use UTC noon to avoid any timezone offset flipping the day
  const date = new Date(Date.UTC(y, mo - 1, d, 12, 0, 0));
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });
}

export default async function MeetupDetailPage({ params }: MeetupDetailPageProps) {
  const { id } = await params;

  // Fetch meetup
  const meetupRows = await db
    .select()
    .from(meetups)
    .where(eq(meetups.id, id))
    .limit(1);

  if (meetupRows.length === 0) {
    notFound();
  }

  const meetup = meetupRows[0];

  // Fetch creator user row
  const creatorRows = await db
    .select()
    .from(users)
    .where(eq(users.id, meetup.created_by))
    .limit(1);

  const creator = creatorRows[0] ?? null;

  // Fetch rsvps joined to users
  const rsvpRows = await db
    .select({
      status: rsvps.status,
      user_id: rsvps.user_id,
      name: users.name,
      avatar_shape: users.avatar_shape,
      avatar_glaze: users.avatar_glaze,
      avatar_pattern: users.avatar_pattern,
    })
    .from(rsvps)
    .innerJoin(users, eq(rsvps.user_id, users.id))
    .where(eq(rsvps.meetup_id, id));

  // Group rsvps by status
  const grouped: { yes: UserInfo[]; no: UserInfo[]; maybe: UserInfo[] } = {
    yes: [],
    no: [],
    maybe: [],
  };
  for (const row of rsvpRows) {
    const info: UserInfo = {
      name: row.name,
      avatarShape: row.avatar_shape,
      avatarGlaze: row.avatar_glaze,
      avatarPattern: row.avatar_pattern,
    };
    grouped[row.status].push(info);
  }

  // Fetch current user and their RSVP status
  const currentUser = await getCurrentUser();
  let myStatus: "yes" | "no" | "maybe" | null = null;
  let myInfo: UserInfo | null = null;

  if (currentUser) {
    const myRsvp = rsvpRows.find((r) => r.user_id === currentUser.userId);
    myStatus = myRsvp?.status ?? null;

    // Get current user's avatar info for optimistic updates
    const myUserRows = await db
      .select()
      .from(users)
      .where(eq(users.id, currentUser.userId))
      .limit(1);

    if (myUserRows.length > 0) {
      const u = myUserRows[0];
      myInfo = {
        name: u.name,
        avatarShape: u.avatar_shape,
        avatarGlaze: u.avatar_glaze,
        avatarPattern: u.avatar_pattern,
      };
    }
  }

  // Fetch comments joined to users, ordered by created_at asc
  const commentRows = await db
    .select({
      body: comments.body,
      created_at: comments.created_at,
      name: users.name,
      avatar_shape: users.avatar_shape,
      avatar_glaze: users.avatar_glaze,
      avatar_pattern: users.avatar_pattern,
    })
    .from(comments)
    .innerJoin(users, eq(comments.user_id, users.id))
    .where(eq(comments.meetup_id, id))
    .orderBy(asc(comments.created_at));

  const commentEntries: CommentEntry[] = commentRows.map((r) => ({
    body: r.body,
    created_at: r.created_at,
    name: r.name,
    avatarShape: r.avatar_shape,
    avatarGlaze: r.avatar_glaze,
    avatarPattern: r.avatar_pattern,
  }));

  return (
    <main className="flex flex-col items-center px-4 py-8 sm:py-12 min-h-screen">
      <div className="w-full max-w-2xl mx-auto">
        {/* Big title */}
        <h1
          className="leading-tight mb-6"
          style={{
            fontFamily: "var(--font-hand)",
            fontSize: "clamp(2rem, 7vw, 3rem)",
            fontWeight: 700,
            color: "#B85C2A",
          }}
        >
          {meetup.title}
        </h1>

        {/* Meetup details card */}
        <WobblyCard className="mb-6">
          <div className="flex flex-col gap-4">
            {/* Date + time */}
            <div className="flex items-start gap-3">
              <span
                style={{
                  fontFamily: "var(--font-hand)",
                  fontSize: "1.5rem",
                  lineHeight: 1,
                }}
                aria-hidden="true"
              >
                📅
              </span>
              <div>
                <p
                  style={{
                    fontFamily: "var(--font-hand)",
                    fontSize: "1.1rem",
                    color: "#2C1810",
                  }}
                >
                  {formatDate(meetup.date)}
                </p>
                <p
                  style={{
                    fontFamily: "var(--font-body)",
                    fontSize: "0.95rem",
                    color: "var(--color-clay-ink-muted)",
                  }}
                >
                  {format12h(meetup.time)}
                </p>
              </div>
            </div>

            {/* Location */}
            <div className="flex items-center gap-3">
              <DoodleIcon name="pot" size={22} color="#B85C2A" />
              <p
                style={{
                  fontFamily: "var(--font-body)",
                  fontSize: "1rem",
                  color: "#2C1810",
                }}
              >
                {meetup.location}
              </p>
            </div>

            {/* Note (if any) */}
            {meetup.note && (
              <div
                className="px-3 py-2 rounded-lg"
                style={{
                  background: "rgba(44,24,16,0.04)",
                  border: "1px dashed rgba(44,24,16,0.2)",
                }}
              >
                <p
                  style={{
                    fontFamily: "var(--font-body)",
                    fontSize: "0.95rem",
                    color: "var(--color-clay-ink-muted)",
                    lineHeight: 1.6,
                  }}
                >
                  {meetup.note}
                </p>
              </div>
            )}

            {/* Hosted by */}
            {creator && (
              <div className="flex items-center gap-2 pt-1">
                <span
                  style={{
                    fontFamily: "var(--font-body)",
                    fontSize: "0.9rem",
                    color: "rgba(92,61,46,0.6)",
                  }}
                >
                  hosted by
                </span>
                <UserTag
                  user={{
                    name: creator.name,
                    avatarShape: creator.avatar_shape,
                    avatarGlaze: creator.avatar_glaze,
                    avatarPattern: creator.avatar_pattern,
                  }}
                />
              </div>
            )}
          </div>
        </WobblyCard>

        {/* RSVP section */}
        <WobblyCard tone="warm" className="mb-6">
          <h2
            className="mb-4"
            style={{
              fontFamily: "var(--font-hand)",
              fontSize: "1.3rem",
              color: "#2C1810",
            }}
          >
            who&apos;s coming?
          </h2>
          {currentUser ? (
            <RsvpBar
              meetupId={id}
              myStatus={myStatus}
              myInfo={myInfo}
              grouped={grouped}
            />
          ) : (
            <p
              style={{
                fontFamily: "var(--font-body)",
                fontSize: "0.95rem",
                color: "var(--color-clay-ink-muted)",
              }}
            >
              <a href="/login" style={{ color: "#B85C2A", textDecoration: "underline" }}>
                log in
              </a>{" "}
              to RSVP!
            </p>
          )}
        </WobblyCard>

        {/* Comments section */}
        <WobblyCard>
          <h2
            className="mb-4"
            style={{
              fontFamily: "var(--font-hand)",
              fontSize: "1.3rem",
              color: "#2C1810",
            }}
          >
            chatter 💬
          </h2>
          <CommentThread meetupId={id} comments={commentEntries} />
        </WobblyCard>
      </div>
    </main>
  );
}

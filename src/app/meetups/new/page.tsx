import { redirect } from "next/navigation";
import { getCurrentUser, canEdit } from "@/lib/session";
import { createMeetupAction } from "@/actions/meetups";
import { DEFAULT_LOCATION } from "@/lib/constants";
import WobblyCard from "@/components/ui/WobblyCard";
import InkButton from "@/components/ui/InkButton";
import HandInput from "@/components/ui/HandInput";
import DoodleIcon from "@/components/ui/DoodleIcon";
import Link from "next/link";

interface NewMeetupPageProps {
  searchParams: Promise<{ error?: string; date?: string; time?: string }>;
}

/** Validates "YYYY-MM-DD" — true if format and calendar date are valid. */
function isValidDateStr(s: string): boolean {
  if (!/^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/.test(s)) return false;
  const [y, mo, d] = s.split("-").map(Number);
  const dt = new Date(y, mo - 1, d);
  return dt.getFullYear() === y && dt.getMonth() + 1 === mo && dt.getDate() === d;
}

/** Validates "HH:MM" 24-hour time. */
function isValidTimeStr(s: string): boolean {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(s);
}

export default async function NewMeetupPage({ searchParams }: NewMeetupPageProps) {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  // Guests can view the page but see a friendly wall instead of the form
  if (!canEdit(user.role)) {
    return (
      <main className="flex flex-col items-center min-h-screen px-4 py-8 sm:py-12">
        <div className="w-full max-w-md mx-auto my-auto text-center">
          <DoodleIcon name="amphora" size={48} color="#B85C2A" />
          <h1
            className="leading-tight mb-3"
            style={{
              fontFamily: "var(--font-hand)",
              fontSize: "clamp(1.8rem, 6vw, 2.4rem)",
              fontWeight: 700,
              color: "#B85C2A",
            }}
          >
            friends-only thing
          </h1>
          <WobblyCard>
            <p
              style={{
                fontFamily: "var(--font-body)",
                fontSize: "1rem",
                color: "var(--color-clay-ink-muted)",
                lineHeight: 1.65,
                marginBottom: "1.25rem",
              }}
            >
              planning pottery dates is for friends only{" "}
              ask for the friends password to unlock this!
            </p>
            <Link
              href="/calendar"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg"
              style={{
                fontFamily: "var(--font-hand)",
                fontSize: "1rem",
                color: "#2C1810",
                background: "rgba(232,213,176,0.6)",
                border: "2px solid rgba(44,24,16,0.3)",
                textDecoration: "none",
              }}
            >
              back to calendar
            </Link>
          </WobblyCard>
        </div>
      </main>
    );
  }

  const { error, date: rawDate, time: rawTime } = await searchParams;

  // Only trust params that pass validation
  const defaultDate = rawDate && isValidDateStr(rawDate) ? rawDate : undefined;
  const defaultTime = rawTime && isValidTimeStr(rawTime) ? rawTime : undefined;

  return (
    <main className="flex flex-col items-center min-h-screen px-4 py-8 sm:py-12">
      <div className="w-full max-w-md mx-auto my-auto">
        {/* Heading */}
        <div className="text-center mb-6">
          <h1
            className="leading-tight flex items-center justify-center gap-2"
            style={{
              fontFamily: "var(--font-hand)",
              fontSize: "clamp(2rem, 7vw, 2.8rem)",
              fontWeight: 700,
              color: "#B85C2A",
            }}
          >
            plan a pottery date <DoodleIcon name="amphora" size={28} color="#B85C2A" />
          </h1>
          <p
            className="mt-1"
            style={{
              fontFamily: "var(--font-body)",
              fontSize: "1.05rem",
              color: "var(--color-clay-ink-muted)",
            }}
          >
            set up a meetup for your crew
          </p>
        </div>

        <WobblyCard>
          <form action={createMeetupAction} className="flex flex-col gap-6">
            {/* Error message */}
            {error && (
              <p
                role="alert"
                className="text-sm px-3 py-2 rounded-lg"
                style={{
                  fontFamily: "var(--font-body)",
                  color: "#2C1810",
                  background: "rgba(212,132,122,0.18)",
                  border: "1.5px solid rgba(212,132,122,0.5)",
                }}
              >
                {error}
              </p>
            )}

            {/* Title */}
            <HandInput
              label="what are you making?"
              name="title"
              placeholder="e.g. Sunday wheel-throwing session"
              required
              maxLength={80}
            />

            {/* Date */}
            <div className="flex flex-col gap-1">
              <label
                htmlFor="meetup-date"
                className="text-sm flex items-center gap-1"
                style={{
                  fontFamily: "var(--font-hand)",
                  color: "var(--color-clay-ink-muted)",
                }}
              >
                when is it? <DoodleIcon name="calendar" size={16} color="var(--color-clay-ink-muted)" />
              </label>
              <input
                type="date"
                id="meetup-date"
                name="date"
                required
                defaultValue={defaultDate}
                className="hand-input"
              />
            </div>

            {/* Time */}
            <div className="flex flex-col gap-1">
              <label
                htmlFor="meetup-time"
                className="text-sm"
                style={{
                  fontFamily: "var(--font-hand)",
                  color: "var(--color-clay-ink-muted)",
                }}
              >
                what time?
              </label>
              <input
                type="time"
                id="meetup-time"
                name="time"
                required
                defaultValue={defaultTime}
                className="hand-input"
              />
            </div>

            {/* Location */}
            <HandInput
              label="where?"
              name="location"
              defaultValue={DEFAULT_LOCATION}
              placeholder={DEFAULT_LOCATION}
              maxLength={80}
            />

            {/* Note */}
            <HandInput
              as="textarea"
              label="any notes? (optional)"
              name="note"
              placeholder="bring your fave apron, we'll have snacks"
              maxLength={500}
              rows={3}
            />

            {/* Submit */}
            <div className="flex justify-center pt-2">
              <InkButton type="submit" variant="primary" className="w-full">
                <DoodleIcon name="sparkle" size={18} color="#F5F0E8" />
                let&apos;s make it!
              </InkButton>
            </div>
          </form>
        </WobblyCard>
      </div>
    </main>
  );
}

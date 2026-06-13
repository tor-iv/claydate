"use client";

import { useOptimistic, useTransition } from "react";
import { upsertRsvpAction } from "@/actions/rsvps";
import UserTag from "@/components/shared/UserTag";

export type RsvpStatus = "yes" | "no" | "maybe";

export interface UserInfo {
  name: string;
  avatarShape: string;
  avatarGlaze: string;
  avatarPattern: string;
}

interface GroupedRsvps {
  yes: UserInfo[];
  no: UserInfo[];
  maybe: UserInfo[];
}

interface RsvpBarProps {
  meetupId: string;
  myStatus: RsvpStatus | null;
  myInfo: UserInfo | null;
  grouped: GroupedRsvps;
  canEdit?: boolean;
}

type OptimisticState = {
  myStatus: RsvpStatus | null;
  grouped: GroupedRsvps;
};

function applyOptimistic(
  state: OptimisticState,
  newStatus: RsvpStatus,
  myInfo: UserInfo | null
): OptimisticState {
  // Dedup by name is safe: users_name_ci_uniq makes names globally unique.
  // Revisit if name changes are ever allowed.
  const clean: GroupedRsvps = {
    yes: state.grouped.yes.filter((u) => u.name !== myInfo?.name),
    no: state.grouped.no.filter((u) => u.name !== myInfo?.name),
    maybe: state.grouped.maybe.filter((u) => u.name !== myInfo?.name),
  };

  // Add to new group
  if (myInfo) {
    clean[newStatus] = [...clean[newStatus], myInfo];
  }

  return { myStatus: newStatus, grouped: clean };
}

const BUTTON_CONFIG: {
  status: RsvpStatus;
  label: string;
  emoji: string;
  selectedBg: string;
  selectedBorder: string;
}[] = [
  {
    status: "yes",
    label: "going!",
    emoji: "✨",
    selectedBg: "#7EB5C8",
    selectedBorder: "#2C1810",
  },
  {
    status: "maybe",
    label: "maybe~",
    emoji: "🔥",
    selectedBg: "#D4847A",
    selectedBorder: "#2C1810",
  },
  {
    status: "no",
    label: "can't",
    emoji: "〰",
    selectedBg: "transparent",
    selectedBorder: "#2C1810",
  },
];

const GROUP_LABELS: Record<RsvpStatus, string> = {
  yes: "going ✨",
  maybe: "maybe~",
  no: "can't make it",
};

export default function RsvpBar({
  meetupId,
  myStatus,
  myInfo,
  grouped,
  canEdit = true,
}: RsvpBarProps) {
  const [isPending, startTransition] = useTransition();

  const [optimistic, setOptimistic] = useOptimistic<OptimisticState, RsvpStatus>(
    { myStatus, grouped },
    (state, newStatus) => applyOptimistic(state, newStatus, myInfo)
  );

  function handleRsvp(status: RsvpStatus) {
    startTransition(async () => {
      setOptimistic(status);
      try {
        await upsertRsvpAction(meetupId, status);
      } catch (e) {
        // useOptimistic reverts to server state when the transition settles;
        // swallow so a transient error doesn't crash the tree
        console.error("RSVP failed", e);
      }
    });
  }

  const allStatuses: RsvpStatus[] = ["yes", "maybe", "no"];

  return (
    <div className="flex flex-col gap-5">
      {/* RSVP buttons (friends) or guest note */}
      {canEdit ? (
        <div className="flex flex-wrap gap-2">
          {BUTTON_CONFIG.map(({ status, label, emoji, selectedBg, selectedBorder }) => {
            const isSelected = optimistic.myStatus === status;
            return (
              <button
                key={status}
                type="button"
                disabled={isPending}
                onClick={() => handleRsvp(status)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full transition-all duration-100 cursor-pointer select-none active:translate-y-[1px] disabled:opacity-60 disabled:cursor-not-allowed"
                style={{
                  fontFamily: "var(--font-hand)",
                  fontSize: "1rem",
                  background: isSelected ? selectedBg : "transparent",
                  border: `2px solid ${selectedBorder}`,
                  color: "#2C1810",
                  boxShadow: isSelected
                    ? "2px 3px 0px rgba(44,24,16,0.25)"
                    : "1px 2px 0px rgba(44,24,16,0.12)",
                  transform: isSelected ? "translateY(-1px)" : undefined,
                  fontWeight: isSelected ? 700 : 400,
                }}
                aria-pressed={isSelected}
              >
                <span>{emoji}</span>
                {label}
              </button>
            );
          })}
        </div>
      ) : (
        <p
          style={{
            fontFamily: "var(--font-body)",
            fontSize: "0.92rem",
            color: "var(--color-clay-ink-muted)",
            fontStyle: "italic",
          }}
        >
          friends can RSVP — ask for the password 🤫
        </p>
      )}

      {/* Guest lists */}
      <div className="flex flex-col gap-4">
        {allStatuses.map((status) => {
          const users = optimistic.grouped[status];
          return (
            <div key={status}>
              <p
                className="text-sm mb-2"
                style={{
                  fontFamily: "var(--font-hand)",
                  color: "var(--color-clay-ink-muted)",
                }}
              >
                {GROUP_LABELS[status]}
                {users.length > 0 && (
                  <span
                    className="ml-1.5 px-1.5 py-0.5 rounded-full text-xs"
                    style={{
                      background: "rgba(44,24,16,0.08)",
                      color: "var(--color-clay-ink-muted)",
                    }}
                  >
                    {users.length}
                  </span>
                )}
              </p>
              {users.length === 0 ? (
                <p
                  className="text-sm italic"
                  style={{
                    fontFamily: "var(--font-body)",
                    color: "rgba(92,61,46,0.45)",
                  }}
                >
                  {status === "yes"
                    ? "no one yet — be first! 🏺"
                    : status === "maybe"
                      ? "no maybes yet"
                      : "no one said no yet 🎉"}
                </p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {users.map((u, i) => (
                    <UserTag
                      key={`${u.name}-${i}`}
                      user={{
                        name: u.name,
                        avatarShape: u.avatarShape,
                        avatarGlaze: u.avatarGlaze,
                        avatarPattern: u.avatarPattern,
                      }}
                    />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

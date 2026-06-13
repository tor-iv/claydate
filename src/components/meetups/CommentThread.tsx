import { addCommentAction } from "@/actions/comments";
import VaseAvatar from "@/components/avatar/VaseAvatar";
import HandInput from "@/components/ui/HandInput";
import InkButton from "@/components/ui/InkButton";
import DoodleIcon from "@/components/ui/DoodleIcon";

export interface CommentUser {
  name: string;
  avatarShape: string;
  avatarGlaze: string;
  avatarPattern: string;
}

export interface CommentEntry extends CommentUser {
  body: string;
  created_at: number;
}

interface CommentThreadProps {
  meetupId: string;
  comments: CommentEntry[];
  canEdit?: boolean;
}

import { formatShortEpoch } from "@/lib/dates";

export default function CommentThread({ meetupId, comments, canEdit = true }: CommentThreadProps) {
  const boundAction = addCommentAction.bind(null, meetupId);

  return (
    <div className="flex flex-col gap-6">
      {/* Comment list */}
      <div className="flex flex-col">
        {comments.length === 0 ? (
          <p
            className="text-base italic py-4 flex items-center gap-1"
            style={{
              fontFamily: "var(--font-body)",
              color: "rgba(92,61,46,0.5)",
            }}
          >
            no chatter yet — say hi! <DoodleIcon name="wave" size={18} color="rgba(92,61,46,0.5)" />
          </p>
        ) : (
          comments.map((c, i) => (
            // created_at + name is stable & unique enough (names are globally unique)
            <div key={`${c.created_at}-${c.name}`}>
              {/* Comment entry */}
              <div className="flex items-start gap-3 py-3">
                <VaseAvatar
                  shape={c.avatarShape}
                  glaze={c.avatarGlaze}
                  pattern={c.avatarPattern}
                  size={32}
                  className="flex-shrink-0 mt-0.5"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2 flex-wrap">
                    <span
                      className="font-semibold"
                      style={{
                        fontFamily: "var(--font-hand)",
                        fontSize: "1rem",
                        color: "var(--color-clay-ink)",
                      }}
                    >
                      {c.name}
                    </span>
                    <span
                      className="text-xs"
                      style={{
                        fontFamily: "var(--font-body)",
                        color: "rgba(92,61,46,0.5)",
                      }}
                    >
                      {formatShortEpoch(c.created_at)}
                    </span>
                  </div>
                  <p
                    className="mt-0.5 break-words"
                    style={{
                      fontFamily: "var(--font-body)",
                      fontSize: "0.95rem",
                      color: "var(--color-clay-ink)",
                      lineHeight: 1.55,
                    }}
                  >
                    {c.body}
                  </p>
                </div>
              </div>
              {/* Ink underline separator (not after last item) */}
              {i < comments.length - 1 && (
                <div
                  style={{
                    height: "1px",
                    background: "rgba(44,24,16,0.1)",
                  }}
                />
              )}
            </div>
          ))
        )}
      </div>

      {/* Post comment form (friends) or guest note */}
      {canEdit ? (
        <form action={boundAction} className="flex flex-col gap-3">
          <HandInput
            as="textarea"
            name="body"
            label="your comment"
            placeholder="say something nice"
            maxLength={500}
            rows={2}
          />
          <div className="flex justify-end">
            <InkButton type="submit" variant="soft" className="px-4 py-2 text-sm">
              post it
            </InkButton>
          </div>
        </form>
      ) : (
        <p
          className="flex items-center gap-1"
          style={{
            fontFamily: "var(--font-body)",
            fontSize: "0.92rem",
            color: "var(--color-clay-ink-muted)",
            fontStyle: "italic",
          }}
        >
          friends can leave comments — ask for the password <DoodleIcon name="secret" size={15} color="var(--color-clay-ink-muted)" />
        </p>
      )}
    </div>
  );
}

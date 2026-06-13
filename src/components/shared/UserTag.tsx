import VaseAvatar from "@/components/avatar/VaseAvatar";
import type { AvatarShape, AvatarGlaze, AvatarPattern } from "@/lib/avatars";

interface UserTagProps {
  user: {
    name: string;
    avatarShape: AvatarShape | string;
    avatarGlaze: AvatarGlaze | string;
    avatarPattern: AvatarPattern | string;
  };
  className?: string;
}

export default function UserTag({ user, className = "" }: UserTagProps) {
  return (
    <span
      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full ${className}`}
      style={{
        background: "rgba(232,213,176,0.6)",
        border: "1.5px solid rgba(44,24,16,0.3)",
        fontFamily: "var(--font-hand)",
        color: "#2C1810",
        fontSize: "0.95rem",
        lineHeight: 1,
      }}
    >
      <VaseAvatar
        shape={user.avatarShape}
        glaze={user.avatarGlaze}
        pattern={user.avatarPattern}
        size={22}
      />
      {user.name}
    </span>
  );
}

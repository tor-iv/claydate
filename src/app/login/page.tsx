import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { loginAction } from "@/actions/auth";
import WobblyCard from "@/components/ui/WobblyCard";
import InkButton from "@/components/ui/InkButton";
import HandInput from "@/components/ui/HandInput";
import DoodleIcon from "@/components/ui/DoodleIcon";
import AvatarBuilder from "@/components/avatar/AvatarBuilder";

interface LoginPageProps {
  searchParams: Promise<{ error?: string }>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const user = await getCurrentUser();
  if (user) {
    redirect("/calendar");
  }

  const { error } = await searchParams;

  return (
    <main className="flex flex-col items-center justify-center min-h-screen px-4 py-12">
      <div className="w-full max-w-md mx-auto">
        {/* Heading above card */}
        <div className="text-center mb-6">
          <h1
            className="leading-tight"
            style={{
              fontFamily: "var(--font-hand)",
              fontSize: "clamp(2.4rem, 8vw, 3.2rem)",
              fontWeight: 700,
              color: "#B85C2A",
            }}
          >
            hi, potter! 🏺
          </h1>
          <p
            className="mt-1"
            style={{
              fontFamily: "var(--font-body)",
              fontSize: "1.05rem",
              color: "var(--color-clay-ink-muted)",
            }}
          >
            tell us your name &amp; pick your vase
          </p>
        </div>

        <WobblyCard>
          <form action={loginAction} className="flex flex-col gap-6">
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

            {/* Name field */}
            <div className="flex flex-col gap-1">
              <label
                htmlFor="login-name"
                style={{
                  fontFamily: "var(--font-hand)",
                  fontSize: "1.1rem",
                  color: "#2C1810",
                }}
              >
                what&apos;s your name?
              </label>
              <HandInput
                id="login-name"
                name="name"
                placeholder="e.g. Maya"
                required
                maxLength={50}
                autoComplete="nickname"
                style={{ fontSize: "1.1rem" }}
              />
            </div>

            {/* Divider */}
            <div className="flex items-center gap-3">
              <div
                className="flex-1"
                style={{ height: 1, background: "rgba(44,24,16,0.15)" }}
              />
              <span
                style={{
                  fontFamily: "var(--font-hand)",
                  fontSize: "0.95rem",
                  color: "var(--color-clay-ink-muted)",
                  whiteSpace: "nowrap",
                }}
              >
                <DoodleIcon name="sparkle" size={14} color="#B85C2A" />
                {" "}make your vase{" "}
                <DoodleIcon name="sparkle" size={14} color="#B85C2A" />
              </span>
              <div
                className="flex-1"
                style={{ height: 1, background: "rgba(44,24,16,0.15)" }}
              />
            </div>

            {/* Avatar builder */}
            <AvatarBuilder />

            {/* Submit */}
            <div className="flex justify-center pt-2">
              <InkButton type="submit" variant="primary" className="w-full">
                <DoodleIcon name="pot" size={18} color="#F5F0E8" />
                let&apos;s clay!
              </InkButton>
            </div>
          </form>
        </WobblyCard>
      </div>
    </main>
  );
}

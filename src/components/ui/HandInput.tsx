import type { InputHTMLAttributes, TextareaHTMLAttributes } from "react";

type BaseProps = {
  label?: string;
  as?: "input" | "textarea";
  className?: string;
};

type InputProps    = BaseProps & { as?: "input" }   & InputHTMLAttributes<HTMLInputElement>;
type TextAreaProps = BaseProps & { as: "textarea" } & TextareaHTMLAttributes<HTMLTextAreaElement>;

type HandInputProps = InputProps | TextAreaProps;

/**
 * Notebook-style input: transparent bg, dashed ink underline that turns
 * solid rust on focus. Focus styling is pure CSS (.hand-input in
 * globals.css), so this stays a Server Component with zero client JS.
 */
export default function HandInput({
  label,
  as: Tag = "input",
  className = "",
  ...rest
}: HandInputProps) {
  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      {label && (
        <label
          className="text-sm"
          style={{
            fontFamily: "var(--font-hand)",
            color: "#5C3D2E",
          }}
        >
          {label}
        </label>
      )}
      {Tag === "textarea" ? (
        <textarea
          {...(rest as TextareaHTMLAttributes<HTMLTextAreaElement>)}
          className="hand-input"
        />
      ) : (
        <input
          {...(rest as InputHTMLAttributes<HTMLInputElement>)}
          className="hand-input"
        />
      )}
    </div>
  );
}

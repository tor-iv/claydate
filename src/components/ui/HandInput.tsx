import { type InputHTMLAttributes, type TextareaHTMLAttributes } from "react";

type BaseProps = {
  label?: string;
  as?: "input" | "textarea";
  className?: string;
};

type InputProps  = BaseProps & { as?: "input" }    & InputHTMLAttributes<HTMLInputElement>;
type TextAreaProps = BaseProps & { as: "textarea" } & TextareaHTMLAttributes<HTMLTextAreaElement>;

type HandInputProps = InputProps | TextAreaProps;

export default function HandInput({
  label,
  as: Tag = "input",
  className = "",
  ...rest
}: HandInputProps) {
  const sharedStyle: React.CSSProperties = {
    fontFamily: "var(--font-body)",
    background: "transparent",
    color: "#2C1810",
    border: "none",
    borderBottom: "2px dashed rgba(44,24,16,0.45)",
    borderRadius: 0,
    outline: "none",
    padding: "6px 2px",
    width: "100%",
    fontSize: "1rem",
    lineHeight: 1.5,
    transition: "border-color 0.15s, border-bottom-width 0.15s",
  };

  const focusHandler = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    e.currentTarget.style.borderBottom = "2.5px solid #B85C2A";
    e.currentTarget.style.borderBottomStyle = "solid";
  };
  const blurHandler = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    e.currentTarget.style.borderBottom = "2px dashed rgba(44,24,16,0.45)";
    e.currentTarget.style.borderBottomStyle = "dashed";
  };

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
          style={{ ...sharedStyle, resize: "vertical", minHeight: "80px" }}
          onFocus={focusHandler}
          onBlur={blurHandler}
        />
      ) : (
        <input
          {...(rest as InputHTMLAttributes<HTMLInputElement>)}
          style={sharedStyle}
          onFocus={focusHandler}
          onBlur={blurHandler}
        />
      )}
    </div>
  );
}

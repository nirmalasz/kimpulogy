import type { ComponentPropsWithoutRef } from "react";

type InputProps = ComponentPropsWithoutRef<"input"> & {
  label?: string;
  error?: string;
};

export function Input({ label, error, id, className = "", ...props }: InputProps) {
  const inputId = id ?? props.name;
  return (
    <div className="flex w-full flex-col gap-2">
      {label ? (
        <label
          htmlFor={inputId}
          className="text-sm font-semibold text-fg-text"
        >
          {label}
        </label>
      ) : null}
      <input
        id={inputId}
        aria-invalid={error ? true : undefined}
        className={[
          "h-12 w-full rounded-xl border bg-bg-default px-4 text-base text-fg-default",
          "placeholder:text-neutral-500",
          "transition-colors focus:outline-none focus:ring-2",
          error
            ? "border-alert-solid focus:ring-alert-solid"
            : "border-fg-line focus:ring-primary-300",
          className,
        ].join(" ")}
        {...props}
      />
      {error ? <p className="text-sm text-alert-text">{error}</p> : null}
    </div>
  );
}
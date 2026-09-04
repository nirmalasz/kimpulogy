import type { ReactNode } from "react";

type BadgeTone = "neutral" | "success" | "warning" | "alert" | "info" | "primary";

type BadgeProps = {
  tone?: BadgeTone;
  children: ReactNode;
};

const toneClasses: Record<BadgeTone, string> = {
  neutral: "bg-neutral-200 text-fg-text",
  success: "bg-success-bg text-success-text",
  warning: "bg-warning-bg text-warning-text",
  alert: "bg-alert-bg text-alert-text",
  info: "bg-info-bg text-info-text",
  primary: "bg-primary-100 text-primary-400",
};

export function Badge({ tone = "neutral", children }: BadgeProps) {
  return (
    <span
      className={[
        "inline-flex items-center gap-1 rounded-full px-3 py-1 text-sm font-semibold",
        toneClasses[tone],
      ].join(" ")}
    >
      {children}
    </span>
  );
}
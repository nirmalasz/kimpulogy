import type { ComponentPropsWithoutRef } from "react";

type CardProps = ComponentPropsWithoutRef<"div"> & {
  padded?: boolean;
};

export function Card({ padded = true, className = "", children, ...props }: CardProps) {
  return (
    <div
      className={[
        "rounded-2xl border border-fg-line bg-bg-default shadow-sm",
        padded ? "p-6" : "",
        className,
      ].join(" ")}
      {...props}
    >
      {children}
    </div>
  );
}
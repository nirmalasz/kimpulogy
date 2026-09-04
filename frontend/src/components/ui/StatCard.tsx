import type { ReactNode } from "react";
import { Card } from "./Card";

export type StatCardProps = {
  icon: ReactNode;
  label: string;
  value: string;
  trend?: string;
  trendDirection?: "up" | "down";
};

export function StatCard({
  icon,
  label,
  value,
  trend,
  trendDirection = "up",
}: StatCardProps) {
  return (
    <Card className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-100 text-primary-400">
          {icon}
        </span>
        {trend ? (
          <span
            className={[
              "rounded-full px-3 py-1 text-sm font-semibold",
              trendDirection === "up"
                ? "bg-success-bg text-success-text"
                : "bg-alert-bg text-alert-text",
            ].join(" ")}
          >
            {trend}
          </span>
        ) : null}
      </div>
      <div className="flex flex-col gap-1">
        <span className="text-sm text-fg-text">{label}</span>
        <span className="text-3xl font-bold font-heading text-fg-default">
          {value}
        </span>
      </div>
    </Card>
  );
}
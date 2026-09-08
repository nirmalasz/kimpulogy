"use client";

import { useMemo } from "react";

export type SalesCompareChartProps = {
  thisWeekLabel?: string;
  lastWeekLabel?: string;
  /** Penjualan per hari, Senin..Minggu */
  thisWeek?: number[];
  lastWeek?: number[];
};

const DAYS = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"];
const WIDTH = 640;
const HEIGHT = 220;
const PAD_X = 28;
const PAD_TOP = 12;
const PAD_BOTTOM = 28;

// TODO: ganti mock ini dengan agregasi mingguan dari backend ketika endpoint tersedia
const MOCK_THIS_WEEK = [95, 132, 120, 160, 190, 150, 200];
const MOCK_LAST_WEEK = [110, 105, 140, 130, 170, 125, 150];

function buildPath(values: number[], max: number) {
  const innerW = WIDTH - PAD_X * 2;
  const innerH = HEIGHT - PAD_TOP - PAD_BOTTOM;
  const step = innerW / (values.length - 1);
  return values
    .map((value, index) => {
      const x = PAD_X + index * step;
      const y = PAD_TOP + innerH - (innerH * value) / max;
      return `${index === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
}

function dayX(index: number) {
  const innerW = WIDTH - PAD_X * 2;
  return PAD_X + (index * innerW) / (DAYS.length - 1);
}

export function SalesCompareChart({
  thisWeekLabel = "Minggu ini",
  lastWeekLabel = "Minggu lalu",
  thisWeek = MOCK_THIS_WEEK,
  lastWeek = MOCK_LAST_WEEK,
}: SalesCompareChartProps) {
  const max = useMemo(
    () => Math.max(...thisWeek, ...lastWeek, 1),
    [thisWeek, lastWeek]
  );
  const thisWeekPath = buildPath(thisWeek, max);
  const lastWeekPath = buildPath(lastWeek, max);
  const ticks = [max, (max * 2) / 3, max / 3, 0];

  return (
    <div className="flex h-full w-full flex-col gap-3">
      <div className="flex flex-wrap items-center gap-4">
        <span className="flex items-center gap-1.5 text-xs text-fg-text">
          <span className="h-2 w-4 rounded-full bg-secondary-500" />
          {thisWeekLabel}
        </span>
        <span className="flex items-center gap-1.5 text-xs text-fg-text">
          <span className="h-2 w-4 rounded-full bg-neutral-400" />
          {lastWeekLabel}
        </span>
      </div>
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        role="img"
        aria-label="Grafik penjualan minggu ini dibanding minggu lalu"
        className="h-auto w-full"
      >
        {ticks.map((value, index) => {
          const y =
            PAD_TOP +
            ((HEIGHT - PAD_TOP - PAD_BOTTOM) * (max - value)) / max;
          return (
            <g key={index}>
              <line
                x1={PAD_X}
                x2={WIDTH - PAD_X}
                y1={y}
                y2={y}
                stroke="var(--t-fg-line)"
                strokeWidth="1"
              />
              <text
                x={PAD_X - 6}
                y={y + 4}
                textAnchor="end"
                className="fill-neutral-500 text-[11px]"
              >
                {Math.round(value)}
              </text>
            </g>
          );
        })}
        <path
          d={lastWeekPath}
          fill="none"
          stroke="var(--t-neutral-400)"
          strokeWidth="2.5"
          strokeDasharray="5 4"
        />
        <path
          d={thisWeekPath}
          fill="none"
          stroke="var(--t-secondary-500)"
          strokeWidth="3"
          strokeLinecap="round"
        />
        {DAYS.map((day, index) => (
          <text
            key={day}
            x={dayX(index)}
            y={HEIGHT - 8}
            textAnchor="middle"
            className="fill-neutral-500 text-[11px]"
          >
            {day}
          </text>
        ))}
      </svg>
    </div>
  );
}

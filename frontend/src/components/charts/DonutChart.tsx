"use client";

import { useMemo } from "react";

export type DonutSlice = {
  label: string;
  value: number;
  color: string;
};

export type DonutChartProps = {
  slices?: DonutSlice[];
  size?: number;
  thickness?: number;
};

// TODO: ganti mock ini dengan agregasi mingguan dari backend ketika endpoint tersedia
const MOCK_SLICES: DonutSlice[] = [
  { label: "Beras", value: 52.1, color: "#EA6C0C" },
  { label: "Minyak", value: 22.8, color: "#FBA33C" },
  { label: "Gula", value: 13.9, color: "#354973" },
  { label: "Tepung", value: 11.2, color: "#A1BD25" },
];

function polarToCartesian(
  cx: number,
  cy: number,
  r: number,
  angleDeg: number
) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function arcPath(
  cx: number,
  cy: number,
  r: number,
  startAngle: number,
  endAngle: number
) {
  const start = polarToCartesian(cx, cy, r, endAngle);
  const end = polarToCartesian(cx, cy, r, startAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? 0 : 1;
  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArcFlag} 0 ${end.x} ${end.y}`;
}

export function DonutChart({
  slices = MOCK_SLICES,
  size = 178,
  thickness = 34,
}: DonutChartProps) {
  const segments = useMemo(() => {
    const total = slices.reduce((sum, s) => sum + s.value, 0) || 1;
    const r = (size - thickness) / 2;
    const cx = size / 2;
    const cy = size / 2;
    return slices.reduce<Array<DonutSlice & { path: string }>>(
      (acc, slice) => {
        const angle = (acc.reduce((sum, s) => sum + s.value, 0) / total) * 360;
        const sweep = (slice.value / total) * 360;
        acc.push({ ...slice, path: arcPath(cx, cy, r, angle, angle + sweep) });
        return acc;
      },
      []
    );
  }, [slices, size, thickness]);

  return (
    <div className="flex items-center justify-center gap-10">
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        role="img"
        aria-label="Donut penjualan minggu ini"
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={(size - thickness) / 2}
          fill="none"
          stroke="var(--t-neutral-200)"
          strokeWidth={thickness}
        />
        {segments.map((slice) => (
          <path
            key={slice.label}
            d={slice.path}
            fill="none"
            stroke={slice.color}
            strokeWidth={thickness}
            strokeLinecap="butt"
          />
        ))}
      </svg>

      <div className="flex flex-col gap-3">
        {segments.map((slice) => (
          <div
            key={slice.label}
            className="flex items-center justify-between gap-8"
          >
            <span className="flex items-center gap-1.5">
              <span
                className="h-3 w-3 rounded-full"
                style={{ backgroundColor: slice.color }}
              />
              <span className="text-base text-fg-default">{slice.label}</span>
            </span>
            <span className="text-base text-fg-default">
              {slice.value}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

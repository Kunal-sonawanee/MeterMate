"use client";

import { useId, useState } from "react";
import { useMeasure } from "@/hooks/use-measure";
import {
  formatCurrency,
  formatPeriod,
  formatPeriodLong,
  formatUnits,
} from "@/lib/format";
import { cn } from "@/lib/utils";
import type { TrendPoint } from "@/lib/types";

/**
 * Monthly consumption, as columns.
 *
 * One series, so there is no legend — the heading says what is plotted. Marks
 * are capped at 24px with a rounded cap and a square baseline; gridlines are a
 * hairline one step off the surface. The same numbers are exposed as a
 * visually-hidden table, which is both the screen-reader path and the "show me
 * the data" fallback.
 */

const BAR_MAX_WIDTH = 24;
const BAR_RADIUS = 4;

type Props = {
  data: TrendPoint[];
  /** Which measure the columns encode. Cost and units never share an axis. */
  measure?: "units" | "bill";
  height?: number;
  className?: string;
  caption: string;
};

function niceCeiling(value: number): number {
  if (value <= 0) return 10;
  const magnitude = 10 ** Math.floor(Math.log10(value));
  const normalized = value / magnitude;
  const step =
    normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 5 ? 5 : 10;
  return step * magnitude;
}

export function ConsumptionChart({
  data,
  measure = "units",
  height = 220,
  className,
  caption,
}: Props) {
  const { ref, width } = useMeasure<HTMLDivElement>();
  const [active, setActive] = useState<number | null>(null);
  const titleId = useId();

  const valueOf = (point: TrendPoint) =>
    measure === "units" ? point.unitsConsumed : point.billAmount;
  const formatValue = (value: number) =>
    measure === "units" ? `${formatUnits(value)} units` : formatCurrency(value);

  const axisWidth = measure === "units" ? 40 : 56;
  const padding = { top: 12, right: 4, bottom: 24, left: axisWidth };
  const plotWidth = Math.max(0, width - padding.left - padding.right);
  const plotHeight = Math.max(0, height - padding.top - padding.bottom);

  const max = niceCeiling(Math.max(...data.map(valueOf), 0));
  const ticks = [0, max / 2, max];

  const band = data.length > 0 ? plotWidth / data.length : 0;
  const barWidth = Math.max(4, Math.min(BAR_MAX_WIDTH, band * 0.55));

  // Below ~44px per column there is no room for every month's label.
  const labelStride = band > 0 && band < 44 ? 2 : 1;

  const activePoint = active !== null ? data[active] : null;

  return (
    <div className={cn("relative w-full min-w-0", className)} ref={ref}>
      {width > 0 && data.length > 0 ? (
        // Sized from the viewBox rather than width/height attributes: an SVG
        // with an explicit pixel width has an intrinsic width, which becomes a
        // min-content floor on every ancestor and stops the layout shrinking.
        // The viewBox matches the measured width exactly, so it renders 1:1.
        <svg
          role="img"
          aria-labelledby={titleId}
          viewBox={`0 0 ${width} ${height}`}
          style={{ width: "100%", height }}
          className="block overflow-visible"
          onPointerLeave={() => setActive(null)}
        >
          <title id={titleId}>{caption}</title>

          {ticks.map((tick) => {
            const y = padding.top + plotHeight - (tick / max) * plotHeight;
            return (
              <g key={tick}>
                <line
                  x1={padding.left}
                  x2={width - padding.right}
                  y1={y}
                  y2={y}
                  className="stroke-chart-grid"
                  strokeWidth={1}
                  shapeRendering="crispEdges"
                />
                <text
                  x={padding.left - 8}
                  y={y}
                  textAnchor="end"
                  dominantBaseline="middle"
                  className="fill-muted-foreground text-[10px] tabular-nums"
                >
                  {measure === "units"
                    ? formatUnits(tick)
                    : tick >= 1000
                      ? `${Math.round(tick / 1000)}k`
                      : Math.round(tick)}
                </text>
              </g>
            );
          })}

          {data.map((point, index) => {
            const value = valueOf(point);
            const barHeight = max > 0 ? (value / max) * plotHeight : 0;
            const x = padding.left + index * band + (band - barWidth) / 2;
            const y = padding.top + plotHeight - barHeight;
            const isActive = active === index;

            return (
              <g key={`${point.year}-${point.month}`}>
                {/* Hit target spans the whole column so hovering is forgiving. */}
                <rect
                  x={padding.left + index * band}
                  y={padding.top}
                  width={band}
                  height={plotHeight}
                  fill="transparent"
                  onPointerEnter={() => setActive(index)}
                />

                {barHeight > 0 ? (
                  <path
                    d={roundedTopBar(x, y, barWidth, barHeight)}
                    className="fill-chart-1 transition-opacity duration-150"
                    opacity={active === null || isActive ? 1 : 0.45}
                    pointerEvents="none"
                  />
                ) : (
                  <rect
                    x={x}
                    y={padding.top + plotHeight - 2}
                    width={barWidth}
                    height={2}
                    className="fill-chart-grid"
                    pointerEvents="none"
                  />
                )}

                {index % labelStride === 0 ? (
                  <text
                    x={padding.left + index * band + band / 2}
                    y={height - 6}
                    textAnchor="middle"
                    className={cn(
                      "text-[10px]",
                      isActive
                        ? "fill-foreground font-medium"
                        : "fill-muted-foreground",
                    )}
                    pointerEvents="none"
                  >
                    {formatPeriod(point.month, point.year).replace(" ", " ")}
                  </text>
                ) : null}
              </g>
            );
          })}
        </svg>
      ) : (
        <div style={{ height }} aria-hidden />
      )}

      {activePoint ? (
        <div
          role="status"
          className={cn(
            "bg-popover text-popover-foreground border-border pointer-events-none absolute top-0 z-10",
            "rounded-lg border px-3 py-2 text-xs shadow-md",
          )}
          style={{
            left: Math.min(
              Math.max(padding.left + (active! + 0.5) * band - 60, 0),
              Math.max(width - 132, 0),
            ),
          }}
        >
          <p className="font-medium">
            {formatPeriodLong(activePoint.month, activePoint.year)}
          </p>
          <p className="text-muted-foreground mt-0.5 tabular-nums">
            {formatValue(valueOf(activePoint))}
          </p>
        </div>
      ) : null}

      {/*
        The data itself, for screen readers and for anyone who wants numbers.
        The wrapper carries `sr-only`, not the table: a table can't shrink below
        its min-content width, so hiding it directly would widen the page.
      */}
      <div className="sr-only">
        <table>
          <caption>{caption}</caption>
          <thead>
            <tr>
              <th scope="col">Period</th>
              <th scope="col">
                {measure === "units" ? "Units consumed" : "Amount billed"}
              </th>
            </tr>
          </thead>
          <tbody>
            {data.map((point) => (
              <tr key={`${point.year}-${point.month}-row`}>
                <th scope="row">{formatPeriodLong(point.month, point.year)}</th>
                <td>{formatValue(valueOf(point))}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/** Column with a rounded cap and a square foot on the baseline. */
function roundedTopBar(
  x: number,
  y: number,
  width: number,
  height: number,
): string {
  const radius = Math.min(BAR_RADIUS, width / 2, height);
  return [
    `M ${x} ${y + height}`,
    `L ${x} ${y + radius}`,
    `Q ${x} ${y} ${x + radius} ${y}`,
    `L ${x + width - radius} ${y}`,
    `Q ${x + width} ${y} ${x + width} ${y + radius}`,
    `L ${x + width} ${y + height}`,
    "Z",
  ].join(" ");
}

"use client";

import { Area, AreaChart, CartesianGrid, Line, ResponsiveContainer, XAxis, YAxis } from "recharts";
import { marginSeries } from "./home-data";

// The recharts chart itself. It is loaded on demand by margin-chart.tsx so the
// charting library stays out of the initial bundle until the chart scrolls in.
export default function MarginChartImpl({ reduced }: { reduced: boolean }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={marginSeries} margin={{ top: 8, right: 4, bottom: 0, left: 4 }}>
        <defs>
          <linearGradient id="reserves-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--acc)" stopOpacity={0.18} />
            <stop offset="100%" stopColor="var(--acc)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} stroke="var(--hair)" />
        <XAxis hide />
        <YAxis hide domain={[60, 170]} />
        <Area
          type="monotone"
          dataKey="reserves"
          stroke="var(--acc)"
          strokeWidth={3}
          fill="url(#reserves-fill)"
          dot={false}
          isAnimationActive={!reduced}
          animationDuration={1400}
        />
        <Line
          type="monotone"
          dataKey="liabilities"
          stroke="var(--sec)"
          strokeWidth={2.5}
          strokeDasharray="5 5"
          dot={false}
          isAnimationActive={!reduced}
          animationDuration={1300}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

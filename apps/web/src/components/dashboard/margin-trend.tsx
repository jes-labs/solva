"use client";

import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { CycleRecord } from "@/lib/mock/dashboard";
import { marginBps } from "@/lib/format";

// Margin (basis points of reserves over liabilities) across recent cycles.
export function MarginTrend({ cycles }: { cycles: CycleRecord[] }) {
  const series = [...cycles]
    .reverse()
    .map((cycle) => ({
      label: `#${cycle.proofId}`,
      margin: marginBps(cycle.reservesTotal, cycle.liabilitiesTotal),
    }));

  return (
    <section className="rounded-card border border-hair bg-surface p-6">
      <h2 className="font-display text-[16px] font-semibold tracking-tight">Margin trend</h2>
      <p className="mt-0.5 text-[13px] text-sec">
        Basis points of reserves over liabilities, per published cycle.
      </p>
      <div className="mt-5 h-[200px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={series} margin={{ top: 6, right: 6, bottom: 0, left: -16 }}>
            <defs>
              <linearGradient id="marginFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--acc)" stopOpacity={0.35} />
                <stop offset="100%" stopColor="var(--acc)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="var(--hair)" vertical={false} />
            <XAxis
              dataKey="label"
              tick={{ fill: "var(--sec)", fontSize: 11 }}
              axisLine={{ stroke: "var(--hair)" }}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: "var(--sec)", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              width={44}
            />
            <Tooltip
              cursor={{ stroke: "var(--hair-strong)" }}
              contentStyle={{
                background: "var(--panel)",
                border: "1px solid var(--hair)",
                borderRadius: 10,
                fontSize: 12,
              }}
              labelStyle={{ color: "var(--sec)" }}
              itemStyle={{ color: "var(--text)" }}
              formatter={(value: number) => [`${value} bps`, "Margin"]}
            />
            <Area
              type="monotone"
              dataKey="margin"
              stroke="var(--acc)"
              strokeWidth={2}
              fill="url(#marginFill)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}

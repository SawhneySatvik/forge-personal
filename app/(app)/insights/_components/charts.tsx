"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  XAxis,
  YAxis,
} from "recharts";
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import type { WeekActivity } from "@/lib/analytics";

const weeklyConfig = {
  dsa: { label: "DSA", color: "var(--chart-1)" },
  system_design: { label: "System Design", color: "var(--chart-2)" },
  gym: { label: "Gym", color: "var(--chart-3)" },
  x: { label: "X", color: "var(--chart-4)" },
  linkedin: { label: "LinkedIn", color: "var(--chart-5)" },
} satisfies ChartConfig;

const STACK_KEYS = ["dsa", "system_design", "gym", "x", "linkedin"] as const;

export function WeeklyActivityChart({ data }: { data: WeekActivity[] }) {
  return (
    <ChartContainer config={weeklyConfig} className="aspect-auto h-64 w-full">
      <BarChart data={data}>
        <CartesianGrid vertical={false} />
        <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={8} />
        <ChartTooltip content={<ChartTooltipContent />} />
        {STACK_KEYS.map((k, i) => (
          <Bar
            key={k}
            dataKey={k}
            stackId="a"
            fill={`var(--color-${k})`}
            radius={i === STACK_KEYS.length - 1 ? [3, 3, 0, 0] : 0}
          />
        ))}
      </BarChart>
    </ChartContainer>
  );
}

const difficultyConfig = {
  Easy: { label: "Easy", color: "var(--chart-3)" },
  Medium: { label: "Medium", color: "var(--chart-2)" },
  Hard: { label: "Hard", color: "var(--destructive)" },
} satisfies ChartConfig;

export function DsaDifficultyChart({
  data,
}: {
  data: { difficulty: "Easy" | "Medium" | "Hard"; count: number }[];
}) {
  return (
    <ChartContainer config={difficultyConfig} className="mx-auto aspect-square h-56">
      <PieChart>
        <ChartTooltip content={<ChartTooltipContent hideLabel />} />
        <Pie
          data={data}
          dataKey="count"
          nameKey="difficulty"
          innerRadius={50}
          outerRadius={82}
          paddingAngle={2}
        >
          {data.map((d) => (
            <Cell key={d.difficulty} fill={`var(--color-${d.difficulty})`} />
          ))}
        </Pie>
      </PieChart>
    </ChartContainer>
  );
}

const topicConfig = {
  count: { label: "Problems", color: "var(--chart-1)" },
} satisfies ChartConfig;

export function DsaTopicChart({
  data,
}: {
  data: { topic: string; count: number }[];
}) {
  return (
    <ChartContainer config={topicConfig} className="aspect-auto h-64 w-full">
      <BarChart data={data} layout="vertical" margin={{ left: 8 }}>
        <XAxis type="number" hide />
        <YAxis
          type="category"
          dataKey="topic"
          width={130}
          tickLine={false}
          axisLine={false}
        />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Bar dataKey="count" fill="var(--color-count)" radius={4} />
      </BarChart>
    </ChartContainer>
  );
}

const cumulativeConfig = {
  total: { label: "Total solved", color: "var(--chart-1)" },
} satisfies ChartConfig;

export function DsaCumulativeChart({
  data,
}: {
  data: { date: string; total: number }[];
}) {
  return (
    <ChartContainer config={cumulativeConfig} className="aspect-auto h-64 w-full">
      <AreaChart data={data}>
        <CartesianGrid vertical={false} />
        <XAxis dataKey="date" tickLine={false} axisLine={false} minTickGap={36} />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Area
          dataKey="total"
          type="monotone"
          stroke="var(--color-total)"
          fill="var(--color-total)"
          fillOpacity={0.15}
        />
      </AreaChart>
    </ChartContainer>
  );
}

const coverageConfig = {
  total: { label: "Topics covered", color: "var(--chart-2)" },
} satisfies ChartConfig;

export function SysDesignCoverageChart({
  data,
}: {
  data: { date: string; total: number }[];
}) {
  return (
    <ChartContainer config={coverageConfig} className="aspect-auto h-64 w-full">
      <AreaChart data={data}>
        <CartesianGrid vertical={false} />
        <XAxis dataKey="date" tickLine={false} axisLine={false} minTickGap={36} />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Area
          dataKey="total"
          type="monotone"
          stroke="var(--color-total)"
          fill="var(--color-total)"
          fillOpacity={0.15}
        />
      </AreaChart>
    </ChartContainer>
  );
}

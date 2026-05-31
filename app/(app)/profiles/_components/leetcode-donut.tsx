"use client";

import { Cell, Pie, PieChart } from "recharts";
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

const config = {
  easy: { label: "Easy", color: "var(--chart-3)" },
  medium: { label: "Medium", color: "var(--chart-2)" },
  hard: { label: "Hard", color: "var(--destructive)" },
} satisfies ChartConfig;

export function LeetcodeDonut({
  solved,
}: {
  solved: { all: number; easy: number; medium: number; hard: number };
}) {
  const data = [
    { key: "easy", value: solved.easy },
    { key: "medium", value: solved.medium },
    { key: "hard", value: solved.hard },
  ];

  return (
    <ChartContainer config={config} className="mx-auto aspect-square h-52">
      <PieChart>
        <ChartTooltip content={<ChartTooltipContent nameKey="key" hideLabel />} />
        <Pie
          data={data}
          dataKey="value"
          nameKey="key"
          innerRadius={52}
          outerRadius={82}
          paddingAngle={2}
        >
          {data.map((d) => (
            <Cell key={d.key} fill={`var(--color-${d.key})`} />
          ))}
        </Pie>
      </PieChart>
    </ChartContainer>
  );
}

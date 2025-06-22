"use client";

import {
  Label,
  PolarGrid,
  PolarRadiusAxis,
  RadialBar,
  RadialBarChart,
} from "recharts";

import { ChartConfig, ChartContainer } from "@/components/ui/chart";
import { WaterChartSkeleton } from "../layout/skeletons";
import { useMemo } from "react";

const chartConfig = {
  visitors: {
    label: "Nível de Água",
  },
  safari: {
    label: "Água",
    color: "var(--primary)",
  },
} satisfies ChartConfig;

export default function WaterChart({ data }: { data: number | undefined }) {
  // Criar os dados do gráfico usando o valor recebido
  const chartData = useMemo(() => {
    return [{ browser: "safari", visitors: data || 0, fill: "var(--primary)" }];
  }, [data]);

  if (data === undefined) {
    return (
      <ChartContainer config={chartConfig} className="h-72 w-full">
        <WaterChartSkeleton />
      </ChartContainer>
    );
  }

  return (
    <ChartContainer config={chartConfig} className="h-72 w-full">
      <RadialBarChart
        data={chartData}
        startAngle={180}
        endAngle={180 - data * 3.6} // Transforma a porcentagem em graus (100% = 360 graus, então 1% = 3.6 graus)
        innerRadius={80}
        outerRadius={110}
      >
        <PolarGrid
          gridType="circle"
          radialLines={false}
          stroke="none"
          className="first:fill-muted last:fill-background"
          polarRadius={[86, 74]}
        />
        <RadialBar
          dataKey="visitors"
          background={{ fill: "var(--muted)" }}
          cornerRadius={10}
          fill="var(--primary)"
        />
        <PolarRadiusAxis tick={false} tickLine={false} axisLine={false}>
          <Label
            content={({ viewBox }) => {
              if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                return (
                  <text
                    x={viewBox.cx}
                    y={viewBox.cy}
                    textAnchor="middle"
                    dominantBaseline="middle"
                  >
                    <tspan
                      x={viewBox.cx}
                      y={viewBox.cy}
                      className="fill-foreground text-4xl font-bold"
                    >
                      {data.toLocaleString()}%
                    </tspan>
                    <tspan
                      x={viewBox.cx}
                      y={(viewBox.cy || 0) + 24}
                      className="fill-muted-foreground"
                    >
                      Água
                    </tspan>
                  </text>
                );
              }
            }}
          />
        </PolarRadiusAxis>
      </RadialBarChart>
    </ChartContainer>
  );
}

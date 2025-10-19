"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Area,
  AreaChart,
} from "recharts";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { SensorReading } from "@/server/actions/dashboard";

interface SensorChartProps {
  data: SensorReading[];
  title: string;
  dataKey: keyof SensorReading;
  unit: string;
  color: string;
}

export function SensorChart({
  data,
  title,
  dataKey,
  unit,
  color,
}: SensorChartProps) {
  const formattedData = data.map((reading) => ({
    ...reading,
    timeLabel: format(new Date(reading.timecreated), "HH:mm", {
      locale: ptBR,
    }),
    value: Number(Number(reading[dataKey]).toFixed(2)),
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={formattedData}>
            <defs>
              <linearGradient
                id={`color-${dataKey}`}
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop offset="5%" stopColor={color} stopOpacity={0.8} />
                <stop offset="95%" stopColor={color} stopOpacity={0.1} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis
              dataKey="timeLabel"
              className="text-xs"
              tick={{ fill: "currentColor" }}
            />
            <YAxis
              className="text-xs"
              tick={{ fill: "currentColor" }}
              label={{
                value: unit,
                angle: -90,
                position: "insideLeft",
                style: { textAnchor: "middle" },
              }}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="rounded-lg border bg-background p-2 shadow-sm">
                      <div className="grid grid-cols-2 gap-2">
                        <div className="flex flex-col">
                          <span className="text-[0.70rem] uppercase text-muted-foreground">
                            Valor
                          </span>
                          <span className="font-bold text-muted-foreground">
                            {Number(payload[0].value).toFixed(2)} {unit}
                          </span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[0.70rem] uppercase text-muted-foreground">
                            Horário
                          </span>
                          <span className="font-bold text-muted-foreground">
                            {payload[0].payload.timeLabel}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Area
              type="monotone"
              dataKey="value"
              stroke={color}
              fillOpacity={1}
              fill={`url(#color-${dataKey})`}
              strokeWidth={2}
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

export function SensorChartSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-5 w-48" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-[300px] w-full" />
      </CardContent>
    </Card>
  );
}

// Gráfico combinado com múltiplas métricas
interface MultiMetricChartProps {
  data: SensorReading[];
  title: string;
  metrics: {
    dataKey: keyof SensorReading;
    name: string;
    color: string;
  }[];
}

export function MultiMetricChart({
  data,
  title,
  metrics,
}: MultiMetricChartProps) {
  const formattedData = data.map((reading) => ({
    timeLabel: format(new Date(reading.timecreated), "HH:mm", {
      locale: ptBR,
    }),
    ...metrics.reduce(
      (acc, metric) => {
        acc[metric.name] = Number(Number(reading[metric.dataKey]).toFixed(2));
        return acc;
      },
      {} as Record<string, number>
    ),
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={formattedData}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis
              dataKey="timeLabel"
              className="text-xs"
              tick={{ fill: "currentColor" }}
            />
            <YAxis className="text-xs" tick={{ fill: "currentColor" }} />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="rounded-lg border bg-background p-2 shadow-sm">
                      <div className="grid gap-2">
                        <div className="flex flex-col">
                          <span className="text-[0.70rem] uppercase text-muted-foreground">
                            Horário
                          </span>
                          <span className="font-bold text-muted-foreground">
                            {payload[0].payload.timeLabel}
                          </span>
                        </div>
                        {payload.map((entry, index) => (
                          <div key={index} className="flex flex-col">
                            <span className="text-[0.70rem] uppercase text-muted-foreground">
                              {entry.name}
                            </span>
                            <span
                              className="font-bold"
                              style={{ color: entry.color }}
                            >
                              {Number(entry.value).toFixed(2)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Legend />
            {metrics.map((metric) => (
              <Line
                key={metric.name}
                type="monotone"
                dataKey={metric.name}
                stroke={metric.color}
                strokeWidth={2}
                dot={false}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

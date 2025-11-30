"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
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
  BarChart,
  Bar,
} from "recharts";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { SensorReading } from "@/server/actions/dashboard";
import { DailySummary } from "@/server/actions/irrigation";
import { Droplets } from "lucide-react";

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
  const formattedData = data
    .filter((reading) => reading.timecreated || reading.timestamp) // Accept both field names
    .map((reading) => {
      // Use timecreated or timestamp (aggregated data uses timestamp)
      const dateStr = reading.timecreated || reading.timestamp || "";
      const date = new Date(dateStr);
      const isValidDate = !isNaN(date.getTime());

      return {
        ...reading,
        timeLabel: isValidDate
          ? format(date, "HH:mm", { locale: ptBR })
          : "--:--",
        value: Number(Number(reading[dataKey]).toFixed(2)),
      };
    });

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
  const formattedData = data
    .filter((reading) => reading.timecreated || reading.timestamp)
    .map((reading) => {
      // Use timecreated or timestamp (aggregated data uses timestamp)
      const dateStr = reading.timecreated || reading.timestamp || "";
      const date = new Date(dateStr);
      const isValidDate = !isNaN(date.getTime());

      return {
        timeLabel: isValidDate
          ? format(date, "HH:mm", { locale: ptBR })
          : "--:--",
        ...metrics.reduce(
          (acc, metric) => {
            acc[metric.name] = Number(
              Number(reading[metric.dataKey]).toFixed(2)
            );
            return acc;
          },
          {} as Record<string, number>
        ),
      };
    });

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

// Gráfico de Irrigação
interface IrrigationChartProps {
  data: DailySummary[];
  totalCount: number;
  totalVolumeMl: number;
  period: string;
}

export function IrrigationChart({
  data,
  totalCount,
  totalVolumeMl,
  period,
}: IrrigationChartProps) {
  const formattedData = data.map((item) => {
    const date = new Date(item.date);
    return {
      ...item,
      dateLabel: format(date, "dd/MM", { locale: ptBR }),
      volumeLiters: (item.totalVolumeMl / 1000).toFixed(2),
    };
  });

  const periodLabel =
    {
      day: "Hoje",
      week: "Última Semana",
      month: "Último Mês",
      year: "Último Ano",
      all: "Todo o Período",
    }[period] || period;

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Droplets className="h-5 w-5 text-blue-500" />
            <CardTitle className="text-base font-medium">
              Histórico de Irrigação
            </CardTitle>
          </div>
          <span className="text-xs text-muted-foreground">{periodLabel}</span>
        </div>
        <CardDescription>
          <span className="font-semibold text-foreground">{totalCount}</span>{" "}
          irrigações •
          <span className="font-semibold text-foreground ml-1">
            {(totalVolumeMl / 1000).toFixed(2)}L
          </span>{" "}
          total
          <span className="text-xs ml-1">(≈40ml/s)</span>
        </CardDescription>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <div className="flex items-center justify-center h-[200px] text-muted-foreground">
            Nenhuma irrigação no período selecionado
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={formattedData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                dataKey="dateLabel"
                className="text-xs"
                tick={{ fill: "currentColor" }}
              />
              <YAxis
                className="text-xs"
                tick={{ fill: "currentColor" }}
                label={{
                  value: "mL",
                  angle: -90,
                  position: "insideLeft",
                  style: { textAnchor: "middle" },
                }}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const item = payload[0].payload;
                    return (
                      <div className="rounded-lg border bg-background p-2 shadow-sm">
                        <div className="grid gap-1">
                          <span className="text-xs text-muted-foreground">
                            {item.dateLabel}
                          </span>
                          <div className="flex items-center gap-2">
                            <Droplets className="h-3 w-3 text-blue-500" />
                            <span className="font-bold">
                              {item.count} irrigação(ões)
                            </span>
                          </div>
                          <span className="text-sm text-muted-foreground">
                            Volume: {item.volumeLiters}L ({item.totalVolumeMl}
                            mL)
                          </span>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar
                dataKey="totalVolumeMl"
                fill="#3b82f6"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}

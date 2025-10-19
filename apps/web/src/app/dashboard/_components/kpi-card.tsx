"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Thermometer,
  Droplet,
  Sun,
  Droplets,
  TrendingUp,
  TrendingDown,
  Minus,
  AlertTriangle,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface KPICardProps {
  title: string;
  value: number | string;
  unit: string;
  icon: React.ReactNode;
  trend?: "up" | "down" | "neutral";
  trendValue?: string;
  description?: string;
  colorClass?: string;
}

export function KPICard({
  title,
  value,
  unit,
  icon,
  trend,
  trendValue,
  description,
  colorClass = "text-primary",
}: KPICardProps) {
  const TrendIcon =
    trend === "up" ? TrendingUp : trend === "down" ? TrendingDown : Minus;

  const trendColorClass =
    trend === "up"
      ? "text-green-600 dark:text-green-400"
      : trend === "down"
        ? "text-red-600 dark:text-red-400"
        : "text-muted-foreground";

  return (
    <Card className="overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <div className={cn("p-2 rounded-lg bg-muted", colorClass)}>{icon}</div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">
          {value}
          <span className="text-sm font-normal text-muted-foreground ml-1">
            {unit}
          </span>
        </div>
        {(trend || description) && (
          <div className="flex items-center gap-2 mt-2">
            {trend && trendValue && (
              <div
                className={cn(
                  "flex items-center gap-1 text-xs",
                  trendColorClass
                )}
              >
                <TrendIcon className="h-3 w-3" />
                <span>{trendValue}</span>
              </div>
            )}
            {description && (
              <p className="text-xs text-muted-foreground">{description}</p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function KPICardSkeleton() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-10 w-10 rounded-lg" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-8 w-32 mb-2" />
        <Skeleton className="h-3 w-40" />
      </CardContent>
    </Card>
  );
}

// Predefined KPI Cards for common metrics

interface MetricKPIProps {
  value: number;
  trend?: "up" | "down" | "neutral";
  trendValue?: string;
  description?: string;
}

export function TemperatureKPI({
  value,
  trend,
  trendValue,
  description,
}: MetricKPIProps) {
  return (
    <KPICard
      title="Temperatura do Ar"
      value={value.toFixed(1)}
      unit="°C"
      icon={<Thermometer className="h-4 w-4" />}
      colorClass="text-orange-600 dark:text-orange-400"
      trend={trend}
      trendValue={trendValue}
      description={description}
    />
  );
}

export function HumidityKPI({
  value,
  trend,
  trendValue,
  description,
}: MetricKPIProps) {
  return (
    <KPICard
      title="Umidade do Ar"
      value={value.toFixed(1)}
      unit="%"
      icon={<Droplet className="h-4 w-4" />}
      colorClass="text-blue-600 dark:text-blue-400"
      trend={trend}
      trendValue={trendValue}
      description={description}
    />
  );
}

export function SoilMoistureKPI({
  value,
  trend,
  trendValue,
  description,
}: MetricKPIProps) {
  return (
    <KPICard
      title="Umidade do Solo"
      value={value.toFixed(1)}
      unit="%"
      icon={<Droplets className="h-4 w-4" />}
      colorClass="text-teal-600 dark:text-teal-400"
      trend={trend}
      trendValue={trendValue}
      description={description}
    />
  );
}

export function WaterLevelKPI({
  value,
  trend,
  trendValue,
  description,
}: MetricKPIProps) {
  return (
    <KPICard
      title="Nível de Água"
      value={value.toFixed(1)}
      unit="%"
      icon={<Droplets className="h-4 w-4" />}
      colorClass="text-cyan-600 dark:text-cyan-400"
      trend={trend}
      trendValue={trendValue}
      description={description}
    />
  );
}

export function LightIntensityKPI({
  value,
  trend,
  trendValue,
  description,
}: MetricKPIProps) {
  return (
    <KPICard
      title="Intensidade Luminosa"
      value={value.toFixed(0)}
      unit="lux"
      icon={<Sun className="h-4 w-4" />}
      colorClass="text-yellow-600 dark:text-yellow-400"
      trend={trend}
      trendValue={trendValue}
      description={description}
    />
  );
}

interface AlertsKPIProps {
  activeAlerts: number;
  criticalAlerts?: number;
  description?: string;
}

export function AlertsKPI({
  activeAlerts,
  criticalAlerts = 0,
  description,
}: AlertsKPIProps) {
  const alertLevel =
    criticalAlerts > 0
      ? "critical"
      : activeAlerts > 3
        ? "warning"
        : activeAlerts > 0
          ? "info"
          : "success";

  const colorClass =
    alertLevel === "critical"
      ? "text-red-600 dark:text-red-400"
      : alertLevel === "warning"
        ? "text-yellow-600 dark:text-yellow-400"
        : alertLevel === "info"
          ? "text-blue-600 dark:text-blue-400"
          : "text-green-600 dark:text-green-400";

  return (
    <KPICard
      title="Alertas"
      value={activeAlerts}
      unit={activeAlerts === 1 ? "ativo" : "ativos"}
      icon={<AlertTriangle className="h-4 w-4" />}
      colorClass={colorClass}
      description={
        description ||
        (activeAlerts === 0 ? "Tudo normal" : `${criticalAlerts} críticos`)
      }
    />
  );
}

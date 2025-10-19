"use client";

import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import {
  getDashboardData,
  getHourlyAggregatedData,
  DashboardFilters as DashboardFiltersType,
} from "@/server/actions/dashboard";
import {
  TemperatureKPI,
  HumidityKPI,
  SoilMoistureKPI,
  WaterLevelKPI,
  AlertsKPI,
  KPICardSkeleton,
} from "@/app/dashboard/_components/kpi-card";
import {
  SensorChart,
  SensorChartSkeleton,
  MultiMetricChart,
} from "@/app/dashboard/_components/sensor-chart";
import { DashboardFilters } from "@/app/dashboard/_components/dashboard-filters";
import { generateAlerts } from "@/app/dashboard/_components/alerts-widget";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import PlantSelect from "@/components/home/plant-select";

interface DashboardContentProps {
  plantId: string;
}

export function DashboardContent({ plantId }: DashboardContentProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Ler parâmetros da URL ou usar valores padrão
  const period =
    (searchParams.get("period") as "today" | "week" | "month") || "today";
  const hours = Number(searchParams.get("hours")) || 24;

  // Atualizar URL quando plantId, period ou hours mudarem
  useEffect(() => {
    const params = new URLSearchParams();
    params.set("plantId", plantId);
    params.set("period", period);
    params.set("hours", hours.toString());

    router.replace(`?${params.toString()}`, { scroll: false });
  }, [plantId, period, hours, router]);

  // Funções para atualizar parâmetros da URL
  const setPeriod = (newPeriod: "today" | "week" | "month") => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("period", newPeriod);
    router.push(`?${params.toString()}`, { scroll: false });
  };

  const setHours = (newHours: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("hours", newHours.toString());
    router.push(`?${params.toString()}`, { scroll: false });
  };

  // Criar filtros com hours incluído
  const filters: DashboardFiltersType = {
    period,
    hours,
  };

  // Query para dados do dashboard
  const {
    data: dashboardData,
    isLoading: isDashboardLoading,
    refetch: refetchDashboard,
  } = useQuery({
    queryKey: ["dashboard", plantId, period, hours],
    queryFn: () => getDashboardData(plantId, filters),
    refetchInterval: 60000, // Atualizar a cada 1 minuto
    enabled: !!plantId,
  });

  // Query para dados agregados (para gráficos)
  const { data: hourlyData, isLoading: isHourlyLoading } = useQuery({
    queryKey: ["hourly-data", plantId, period, hours],
    queryFn: () => getHourlyAggregatedData(plantId, filters),
    refetchInterval: 300000, // Atualizar a cada 5 minutos
    enabled: !!plantId,
  });

  const isLoading = isDashboardLoading || isHourlyLoading;
  const latest = dashboardData?.latest;
  const kpis = dashboardData?.kpis;
  const history = dashboardData?.history || [];

  // Calcular tendência comparando valor atual com o primeiro valor do período
  const calculateTrend = (
    currentValue: number,
    dataKey: string
  ): { trend: "up" | "down" | "neutral"; percentage: string } => {
    if (history.length < 2) return { trend: "neutral", percentage: "0" };

    const firstValue = Number(history[0][dataKey as keyof (typeof history)[0]]);
    const diff = currentValue - firstValue;
    const percentChange = ((diff / firstValue) * 100).toFixed(1);

    if (Math.abs(diff) < 0.5) return { trend: "neutral", percentage: "0" };

    return {
      trend: diff > 0 ? "up" : "down",
      percentage: `${Math.abs(Number(percentChange))}%`,
    };
  };

  // Gerar alertas
  const alerts = latest && kpis ? generateAlerts(latest, kpis) : [];

  return (
    <div className="space-y-6">
      {/* Header com filtros */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 w-full">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Monitore os dados da sua estufa em tempo real
          </p>
        </div>
        <PlantSelect />
      </div>

      {/* Filtros de período */}
      <DashboardFilters
        period={period}
        onPeriodChange={setPeriod}
        hours={hours}
        onHoursChange={setHours}
      />

      {/* KPIs - Métricas atuais */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {isLoading ? (
          <>
            <KPICardSkeleton />
            <KPICardSkeleton />
            <KPICardSkeleton />
            <KPICardSkeleton />
            <KPICardSkeleton />
          </>
        ) : latest ? (
          <>
            <TemperatureKPI
              value={latest.air_temperature}
              trend={
                calculateTrend(latest.air_temperature, "air_temperature").trend
              }
              trendValue={
                calculateTrend(latest.air_temperature, "air_temperature")
                  .percentage
              }
              description={`Média: ${kpis?.avgTemperature.toFixed(1)}°C`}
            />
            <HumidityKPI
              value={latest.air_humidity}
              trend={calculateTrend(latest.air_humidity, "air_humidity").trend}
              trendValue={
                calculateTrend(latest.air_humidity, "air_humidity").percentage
              }
              description={`Média: ${kpis?.avgHumidity.toFixed(1)}%`}
            />
            <SoilMoistureKPI
              value={latest.soil_moisture}
              trend={
                calculateTrend(latest.soil_moisture, "soil_moisture").trend
              }
              trendValue={
                calculateTrend(latest.soil_moisture, "soil_moisture").percentage
              }
              description={`Média: ${kpis?.avgSoilMoisture.toFixed(1)}%`}
            />
            <WaterLevelKPI
              value={latest.water_level}
              trend={calculateTrend(latest.water_level, "water_level").trend}
              trendValue={
                calculateTrend(latest.water_level, "water_level").percentage
              }
              description={`Média: ${kpis?.avgWaterLevel.toFixed(1)}%`}
            />
            <AlertsKPI
              activeAlerts={alerts.length}
              criticalAlerts={alerts.filter((a) => a.type === "error").length}
            />
          </>
        ) : (
          <Card className="col-span-full">
            <CardContent className="py-10 text-center text-muted-foreground">
              Nenhum dado disponível. Aguardando leituras dos sensores...
            </CardContent>
          </Card>
        )}
      </div>

      {/* Estatísticas gerais */}
      {!isLoading && kpis && (
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">
                Total de Leituras
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{kpis.totalReadings}</div>
              <p className="text-xs text-muted-foreground">
                No período selecionado
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">
                Variação de Temperatura
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {(kpis.maxTemperature - kpis.minTemperature).toFixed(1)}°C
              </div>
              <p className="text-xs text-muted-foreground">
                {kpis.minTemperature.toFixed(1)}°C -{" "}
                {kpis.maxTemperature.toFixed(1)}°C
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">
                Variação de Umidade
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {(kpis.maxHumidity - kpis.minHumidity).toFixed(1)}%
              </div>
              <p className="text-xs text-muted-foreground">
                {kpis.minHumidity.toFixed(1)}% - {kpis.maxHumidity.toFixed(1)}%
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Gráficos de evolução temporal */}
      <div className="grid gap-4 md:grid-cols-2">
        {isLoading ? (
          <>
            <SensorChartSkeleton />
            <SensorChartSkeleton />
            <SensorChartSkeleton />
            <SensorChartSkeleton />
          </>
        ) : hourlyData && hourlyData.length > 0 ? (
          <>
            <SensorChart
              data={hourlyData}
              title="Temperatura do Ar"
              dataKey="air_temperature"
              unit="°C"
              color="#f97316"
            />
            <SensorChart
              data={hourlyData}
              title="Umidade do Ar"
              dataKey="air_humidity"
              unit="%"
              color="#3b82f6"
            />
            <SensorChart
              data={hourlyData}
              title="Umidade do Solo"
              dataKey="soil_moisture"
              unit="%"
              color="#14b8a6"
            />
            <SensorChart
              data={hourlyData}
              title="Nível de Água"
              dataKey="water_level"
              unit="%"
              color="#06b6d4"
            />
          </>
        ) : (
          <Card className="col-span-full">
            <CardContent className="py-10 text-center text-muted-foreground">
              Nenhum dado histórico disponível para o período selecionado.
            </CardContent>
          </Card>
        )}
      </div>

      {/* Gráfico combinado */}
      {!isLoading && hourlyData && hourlyData.length > 0 && (
        <MultiMetricChart
          data={hourlyData}
          title="Visão Geral - Todas as Métricas"
          metrics={[
            {
              dataKey: "air_temperature",
              name: "Temperatura",
              color: "#f97316",
            },
            { dataKey: "air_humidity", name: "Umidade", color: "#3b82f6" },
            { dataKey: "soil_moisture", name: "Solo", color: "#14b8a6" },
          ]}
        />
      )}
    </div>
  );
}

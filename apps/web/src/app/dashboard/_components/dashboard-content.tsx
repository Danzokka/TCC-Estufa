"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
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
import { WeatherForecast } from "@/components/dashboard/weather-forecast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import PlantSelect from "@/components/home/plant-select";
import { usePlant } from "@/context/plant-provider";

export function DashboardContent() {
  const { selectedPlant, isLoading: isPlantLoading } = usePlant();
  const plantId = selectedPlant?.id;

  // State para controle de período e horas
  const [period] = useState<"today" | "week" | "month">("today");
  const [hours, setHours] = useState(24);

  // Criar filtros com hours incluído
  const filters: DashboardFiltersType = {
    period,
    hours,
  };

  // Query para dados do dashboard
  const { data: dashboardData, isLoading: isDashboardLoading } = useQuery({
    queryKey: ["dashboard", plantId, period, hours],
    queryFn: () => getDashboardData(plantId!, filters),
    refetchInterval: 60000, // Atualizar a cada 1 minuto
    enabled: !!plantId,
  });

  // Query para dados agregados (para gráficos)
  const { data: hourlyData, isLoading: isHourlyLoading } = useQuery({
    queryKey: ["hourly-data", plantId, period, hours],
    queryFn: () => getHourlyAggregatedData(plantId!, filters),
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
    const percentChange = ((diff / firstValue) * 100)?.toFixed(1);

    if (Math.abs(diff) < 0.5) return { trend: "neutral", percentage: "0" };

    return {
      trend: diff > 0 ? "up" : "down",
      percentage: `${Math.abs(Number(percentChange))}%`,
    };
  };

  // Gerar alertas
  const alerts = latest && kpis ? generateAlerts(latest, kpis) : [];

  // Se não há plantId selecionado, mostrar mensagem
  if (!plantId) {
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

        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center space-y-4">
            <h2 className="text-2xl font-bold">Selecione uma planta</h2>
            <p className="text-muted-foreground">
              Escolha uma planta no seletor acima para visualizar os dados do
              dashboard.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Obter o greenhouseId da planta selecionada
  const greenhouseId = selectedPlant?.greenhouseId;

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
        hours={hours}
        onHoursChange={setHours}
      />

      {/* Previsão do Tempo - Só mostra se tiver greenhouseId */}
      {greenhouseId && <WeatherForecast greenhouseId={greenhouseId} />}

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
              description={
                kpis?.avgTemperature != null
                  ? `Média: ${kpis.avgTemperature.toFixed(1)}°C`
                  : "Sem dados suficientes"
              }
            />
            <HumidityKPI
              value={latest.air_humidity}
              trend={calculateTrend(latest.air_humidity, "air_humidity").trend}
              trendValue={
                calculateTrend(latest.air_humidity, "air_humidity").percentage
              }
              description={
                kpis?.avgHumidity != null
                  ? `Média: ${kpis.avgHumidity.toFixed(1)}%`
                  : "Sem dados suficientes"
              }
            />
            <SoilMoistureKPI
              value={latest.soil_moisture}
              trend={
                calculateTrend(latest.soil_moisture, "soil_moisture").trend
              }
              trendValue={
                calculateTrend(latest.soil_moisture, "soil_moisture").percentage
              }
              description={
                kpis?.avgSoilMoisture != null
                  ? `Média: ${kpis.avgSoilMoisture.toFixed(1)}%`
                  : "Sem dados suficientes"
              }
            />
            <WaterLevelKPI
              value={latest.water_level}
              trend={calculateTrend(latest.water_level, "water_level").trend}
              trendValue={
                calculateTrend(latest.water_level, "water_level").percentage
              }
              description={
                kpis?.avgWaterLevel != null
                  ? `Média: ${kpis.avgWaterLevel.toFixed(1)}%`
                  : "Sem dados suficientes"
              }
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
              <div className="text-2xl font-bold">
                {kpis.totalReadings ?? 0}
              </div>
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
                {kpis.maxTemperature != null && kpis.minTemperature != null
                  ? `${(kpis.maxTemperature - kpis.minTemperature).toFixed(1)}°C`
                  : "--"}
              </div>
              <p className="text-xs text-muted-foreground">
                {kpis.minTemperature != null && kpis.maxTemperature != null
                  ? `${kpis.minTemperature.toFixed(1)}°C - ${kpis.maxTemperature.toFixed(1)}°C`
                  : "Sem dados suficientes"}
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
                {kpis.maxHumidity != null && kpis.minHumidity != null
                  ? `${(kpis.maxHumidity - kpis.minHumidity).toFixed(1)}%`
                  : "--"}
              </div>
              <p className="text-xs text-muted-foreground">
                {kpis.minHumidity != null && kpis.maxHumidity != null
                  ? `${kpis.minHumidity.toFixed(1)}% - ${kpis.maxHumidity.toFixed(1)}%`
                  : "Sem dados suficientes"}
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

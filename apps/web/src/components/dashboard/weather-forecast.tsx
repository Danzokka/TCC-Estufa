"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { WeatherCard } from "@/components/analytics/weather-card";
import { Cloud, Loader2 } from "lucide-react";
import { getDashboardForecast } from "@/server/actions/greenhouse";

interface WeatherForecastProps {
  greenhouseId: string;
}

interface ForecastData {
  id: string;
  date: string;
  maxTemp: number;
  minTemp: number;
  avgTemp: number;
  avgHumidity: number;
  totalPrecip: number;
  condition: string;
}

export function WeatherForecast({ greenhouseId }: WeatherForecastProps) {
  const [forecastData, setForecastData] = useState<ForecastData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadForecast = async () => {
      if (!greenhouseId) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);
        
        const data = await getDashboardForecast(greenhouseId);
        setForecastData(data);
      } catch (err) {
        console.error("Erro ao carregar previsão:", err);
        setError("Erro ao carregar previsão do tempo");
      } finally {
        setIsLoading(false);
      }
    };

    loadForecast();
  }, [greenhouseId]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Cloud className="h-5 w-5" />
            Previsão do Tempo
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin mr-2" />
            <span className="text-muted-foreground">Carregando previsão...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Cloud className="h-5 w-5" />
            Previsão do Tempo
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-muted-foreground">{error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (forecastData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Cloud className="h-5 w-5" />
            Previsão do Tempo
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-muted-foreground">
              Configure a localização da sua estufa para ver a previsão do tempo
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Cloud className="h-5 w-5" />
          Previsão do Tempo
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex overflow-x-auto gap-4 pb-2">
          {forecastData.slice(0, 3).map((day, index) => (
            <WeatherCard
              key={day.id || index}
              date={day.date}
              maxTemp={day.maxTemp}
              minTemp={day.minTemp}
              avgTemp={day.avgTemp}
              avgHumidity={day.avgHumidity}
              totalPrecip={day.totalPrecip}
              condition={day.condition}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

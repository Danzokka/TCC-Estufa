"use client";

import React from "react";
import { WeatherCard } from "./weather-card";
import { Sun } from "lucide-react";

interface WeatherImpactProps {
  weatherSummary?: {
    daily?: Array<{
      date: string;
      maxTemp: number;
      minTemp: number;
      avgTemp: number;
      avgHumidity: number;
      totalPrecip: number;
      condition: string;
    }>;
    weekly?: Array<{
      weekNumber: number;
      startDate: string;
      endDate: string;
      avgTemp: number;
      avgHumidity: number;
      totalPrecip: number;
      dominantCondition: string;
    }>;
  };
  reportType: "weekly" | "monthly" | "general";
}

export function WeatherImpact({ weatherSummary, reportType }: WeatherImpactProps) {
  // Não exibe se for relatório geral ou não houver dados climáticos
  if (reportType === "general" || !weatherSummary) {
    return null;
  }

  const hasDailyData = weatherSummary.daily && weatherSummary.daily.length > 0;
  const hasWeeklyData = weatherSummary.weekly && weatherSummary.weekly.length > 0;

  if (!hasDailyData && !hasWeeklyData) {
    return null;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Sun className="h-5 w-5" />
        <h3 className="font-semibold">Impacto Climático</h3>
      </div>
      
      <div className="flex overflow-x-auto gap-4 pb-2">
        {hasDailyData && weatherSummary.daily?.map((day, index) => (
          <WeatherCard
            key={index}
            date={day.date}
            maxTemp={day.maxTemp}
            minTemp={day.minTemp}
            avgTemp={day.avgTemp}
            avgHumidity={day.avgHumidity}
            totalPrecip={day.totalPrecip}
            condition={day.condition}
          />
        ))}
        
        {hasWeeklyData && weatherSummary.weekly?.map((week, index) => (
          <WeatherCard
            key={index}
            date={week.startDate}
            maxTemp={week.avgTemp}
            minTemp={week.avgTemp}
            avgTemp={week.avgTemp}
            avgHumidity={week.avgHumidity}
            totalPrecip={week.totalPrecip}
            condition={week.dominantCondition}
            isWeekly={true}
            weekNumber={week.weekNumber}
          />
        ))}
      </div>
    </div>
  );
}

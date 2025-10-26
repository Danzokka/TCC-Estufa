"use client";

import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Sun, 
  Cloud, 
  CloudRain, 
  CloudSnow, 
  CloudDrizzle,
  Thermometer,
  Droplets,
  Wind
} from "lucide-react";

interface WeatherCardProps {
  date: string;
  maxTemp: number;
  minTemp: number;
  avgTemp: number;
  avgHumidity: number;
  totalPrecip: number;
  condition: string;
  isWeekly?: boolean;
  weekNumber?: number;
  isToday?: boolean;
}

const getWeatherIcon = (condition: string) => {
  const normalizedCondition = condition.toLowerCase();
  
  if (normalizedCondition.includes('sun') || normalizedCondition.includes('clear')) {
    return <Sun className="h-6 w-6 text-yellow-500" />;
  }
  if (normalizedCondition.includes('cloud') && !normalizedCondition.includes('rain')) {
    return <Cloud className="h-6 w-6 text-gray-500" />;
  }
  if (normalizedCondition.includes('rain')) {
    return <CloudRain className="h-6 w-6 text-blue-500" />;
  }
  if (normalizedCondition.includes('drizzle')) {
    return <CloudDrizzle className="h-6 w-6 text-blue-400" />;
  }
  if (normalizedCondition.includes('snow')) {
    return <CloudSnow className="h-6 w-6 text-blue-200" />;
  }
  
  return <Cloud className="h-6 w-6 text-gray-500" />;
};

const translateWeatherCondition = (condition: string): string => {
  const normalizedCondition = condition.toLowerCase();
  
  if (normalizedCondition.includes('sun') || normalizedCondition.includes('clear')) {
    return 'Ensolarado';
  }
  if (normalizedCondition.includes('partly_cloudy') || normalizedCondition.includes('partly cloudy')) {
    return 'Parcialmente Nublado';
  }
  if (normalizedCondition.includes('cloudy') || normalizedCondition.includes('overcast')) {
    return 'Nublado';
  }
  if (normalizedCondition.includes('rain')) {
    return 'Chuvoso';
  }
  if (normalizedCondition.includes('drizzle')) {
    return 'Garoa';
  }
  if (normalizedCondition.includes('snow')) {
    return 'Nevando';
  }
  if (normalizedCondition.includes('fog') || normalizedCondition.includes('mist')) {
    return 'Nebuloso';
  }
  if (normalizedCondition.includes('thunder') || normalizedCondition.includes('storm')) {
    return 'Tempestade';
  }
  
  return 'Desconhecido';
};

const formatDate = (dateString: string, isWeekly?: boolean, weekNumber?: number) => {
  const date = new Date(dateString);
  
  if (isWeekly && weekNumber) {
    const endDate = new Date(dateString);
    endDate.setDate(date.getDate() + 6);
    
    return `Semana ${weekNumber}: ${date.getDate()}/${date.getMonth() + 1} - ${endDate.getDate()}/${endDate.getMonth() + 1}`;
  }
  
  return `${date.getDate()}/${date.getMonth() + 1}`;
};

export function WeatherCard({ 
  date, 
  maxTemp, 
  minTemp, 
  avgTemp, 
  avgHumidity, 
  totalPrecip, 
  condition,
  isWeekly = false,
  weekNumber,
  isToday = false
}: WeatherCardProps) {
  return (
    <Card className={`min-w-[200px] flex-shrink-0 ${isToday ? 'ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-950' : ''}`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h4 className="font-semibold text-sm">
              {formatDate(date, isWeekly, weekNumber)}
              {isToday && <span className="ml-2 text-xs bg-blue-500 text-white px-2 py-1 rounded">Hoje</span>}
            </h4>
            <p className="text-xs text-muted-foreground">
              {translateWeatherCondition(condition)}
            </p>
          </div>
          {getWeatherIcon(condition)}
        </div>
        
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Thermometer className="h-4 w-4 text-red-500" />
            <div className="text-sm">
              <span className="font-medium">{avgTemp.toFixed(1)}°C</span>
              <span className="text-muted-foreground ml-1">
                ({minTemp.toFixed(0)}°-{maxTemp.toFixed(0)}°)
              </span>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Droplets className="h-4 w-4 text-blue-500" />
            <span className="text-sm text-muted-foreground">
              {avgHumidity.toFixed(0)}% umidade
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            <Wind className="h-4 w-4 text-gray-500" />
            <span className="text-sm text-muted-foreground">
              {totalPrecip.toFixed(1)}mm chuva
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

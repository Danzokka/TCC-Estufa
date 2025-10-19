"use client";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Clock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface DashboardFiltersProps {
  period: "today" | "week" | "month";
  onPeriodChange?: (period: "today" | "week" | "month") => void;
  hours?: number;
  onHoursChange?: (hours: number) => void;
}

export function DashboardFilters({
  period,
  onPeriodChange,
  hours = 24,
  onHoursChange,
}: DashboardFiltersProps) {
  // Unificar período e horas em um único seletor
  const getPeriodDisplay = () => {
    if (hours <= 24) {
      return `Últimas ${hours} ${hours === 1 ? "hora" : "horas"}`;
    } else if (hours <= 168) {
      // 7 dias
      const days = Math.floor(hours / 24);
      return `Últimos ${days} ${days === 1 ? "dia" : "dias"}`;
    } else {
      const weeks = Math.floor(hours / 168);
      return `Últimas ${weeks} ${weeks === 1 ? "semana" : "semanas"}`;
    }
  };

  const handlePeriodHoursChange = (value: string) => {
    const hoursValue = parseInt(value);
    if (onHoursChange) {
      onHoursChange(hoursValue);
    }
  };

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Período:</span>
          </div>

          <Select
            value={hours.toString()}
            onValueChange={handlePeriodHoursChange}
          >
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Selecione o período">
                {getPeriodDisplay()}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">Última 1 hora</SelectItem>
              <SelectItem value="3">Últimas 3 horas</SelectItem>
              <SelectItem value="6">Últimas 6 horas</SelectItem>
              <SelectItem value="12">Últimas 12 horas</SelectItem>
              <SelectItem value="24">Últimas 24 horas</SelectItem>
              <SelectItem value="48">Últimos 2 dias</SelectItem>
              <SelectItem value="72">Últimos 3 dias</SelectItem>
              <SelectItem value="168">Últimos 7 dias</SelectItem>
              <SelectItem value="336">Últimas 2 semanas</SelectItem>
              <SelectItem value="504">Últimas 3 semanas</SelectItem>
              <SelectItem value="720">Último mês</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
}

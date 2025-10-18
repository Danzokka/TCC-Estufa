"use client";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar, Clock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface DashboardFiltersProps {
  period: "today" | "week" | "month";
  onPeriodChange: (period: "today" | "week" | "month") => void;
  hours?: number;
  onHoursChange?: (hours: number) => void;
}

export function DashboardFilters({
  period,
  onPeriodChange,
  hours = 24,
  onHoursChange,
}: DashboardFiltersProps) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Período:</span>
          </div>

          <Select
            value={period}
            onValueChange={(value) => onPeriodChange(value as any)}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Selecione o período" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Hoje</SelectItem>
              <SelectItem value="week">Última semana</SelectItem>
              <SelectItem value="month">Último mês</SelectItem>
            </SelectContent>
          </Select>

          <div className="flex gap-2 flex-wrap">
            <Button
              variant={period === "today" ? "default" : "outline"}
              size="sm"
              onClick={() => onPeriodChange("today")}
            >
              Hoje
            </Button>
            <Button
              variant={period === "week" ? "default" : "outline"}
              size="sm"
              onClick={() => onPeriodChange("week")}
            >
              7 dias
            </Button>
            <Button
              variant={period === "month" ? "default" : "outline"}
              size="sm"
              onClick={() => onPeriodChange("month")}
            >
              30 dias
            </Button>
          </div>

          {/* Seletor de horas */}
          {onHoursChange && (
            <>
              <div className="h-6 w-px bg-border hidden sm:block" />
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Horas:</span>
              </div>

              <Select
                value={hours.toString()}
                onValueChange={(value) => onHoursChange(parseInt(value))}
              >
                <SelectTrigger className="w-[120px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 hora</SelectItem>
                  <SelectItem value="3">3 horas</SelectItem>
                  <SelectItem value="6">6 horas</SelectItem>
                  <SelectItem value="12">12 horas</SelectItem>
                  <SelectItem value="24">24 horas</SelectItem>
                  <SelectItem value="48">48 horas</SelectItem>
                  <SelectItem value="72">72 horas</SelectItem>
                </SelectContent>
              </Select>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

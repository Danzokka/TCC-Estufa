"use client";

import * as React from "react";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { generateAlerts } from "@/components/dashboard/alerts-widget";
import { usePlant } from "@/context/plant-provider";

export function AlertsBadge() {
  const { userPlants } = usePlant();
  const [alerts, setAlerts] = React.useState<any[]>([]);
  const [isOpen, setIsOpen] = React.useState(false);

  // Buscar dados dos sensores de TODAS as plantas do usuário e gerar alertas
  React.useEffect(() => {
    if (!userPlants || userPlants.length === 0) return;

    const fetchAllAlerts = async () => {
      try {
        const allAlerts: any[] = [];

        // Buscar alertas de todas as plantas
        for (const plant of userPlants) {
          try {
            const response = await fetch(
              `/api/sensors/latest?plantId=${plant.id}`
            );
            if (response.ok) {
              const data = await response.json();
              const plantAlerts = generateAlerts(data.latest, data.kpis);

              // Adicionar nome da planta ao alerta
              const alertsWithPlant = plantAlerts.map((alert) => ({
                ...alert,
                plantName: plant.nickname || plant.plant.name,
                plantId: plant.id,
              }));

              allAlerts.push(...alertsWithPlant);
            }
          } catch (error) {
            console.error(
              `Erro ao buscar alertas da planta ${plant.nickname || plant.plant.name}:`,
              error
            );
          }
        }

        setAlerts(allAlerts);
      } catch (error) {
        console.error("Erro ao buscar alertas:", error);
      }
    };

    fetchAllAlerts();
    // Atualizar a cada minuto
    const interval = setInterval(fetchAllAlerts, 60000);
    return () => clearInterval(interval);
  }, [userPlants]);

  const criticalCount = alerts.filter((a) => a.type === "error").length;
  const warningCount = alerts.filter((a) => a.type === "warning").length;
  const totalCount = alerts.length;

  const getAlertColor = (type: string) => {
    switch (type) {
      case "error":
        return "text-red-600 dark:text-red-400";
      case "warning":
        return "text-yellow-600 dark:text-yellow-400";
      case "info":
        return "text-blue-600 dark:text-blue-400";
      case "success":
        return "text-green-600 dark:text-green-400";
      default:
        return "";
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            "h-9 w-9 relative",
            totalCount > 0 && "text-yellow-600 dark:text-yellow-400"
          )}
        >
          <Bell className="h-4 w-4" />
          {totalCount > 0 && (
            <Badge
              variant={criticalCount > 0 ? "destructive" : "secondary"}
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {totalCount}
            </Badge>
          )}
          <span className="sr-only">
            {totalCount} alerta{totalCount !== 1 ? "s" : ""} ativo
            {totalCount !== 1 ? "s" : ""}
          </span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="end">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Alertas Ativos</h3>
            <Badge variant="outline">
              {totalCount} {totalCount === 1 ? "alerta" : "alertas"}
            </Badge>
          </div>

          {totalCount === 0 ? (
            <div className="text-center py-6 text-muted-foreground">
              <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Nenhum alerta ativo</p>
              <p className="text-xs mt-1">Tudo funcionando normalmente</p>
            </div>
          ) : (
            <>
              {/* Resumo */}
              <div className="flex gap-2 text-xs">
                {criticalCount > 0 && (
                  <Badge variant="destructive" className="text-xs">
                    {criticalCount} crítico{criticalCount !== 1 ? "s" : ""}
                  </Badge>
                )}
                {warningCount > 0 && (
                  <Badge variant="secondary" className="text-xs">
                    {warningCount} aviso{warningCount !== 1 ? "s" : ""}
                  </Badge>
                )}
              </div>

              {/* Lista de alertas */}
              <div className="max-h-[300px] overflow-y-auto space-y-2">
                {alerts.slice(0, 5).map((alert, index) => (
                  <div
                    key={`${alert.plantId}-${alert.id}-${index}`}
                    className="p-2 rounded-md border bg-card text-card-foreground"
                  >
                    <div className="flex items-start gap-2">
                      <Bell
                        className={cn(
                          "h-4 w-4 mt-0.5",
                          getAlertColor(alert.type)
                        )}
                      />
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium leading-none">
                            {alert.title}
                          </p>
                          {alert.plantName && (
                            <Badge variant="outline" className="text-xs">
                              {alert.plantName}
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {alert.message}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {alerts.length > 5 && (
                <p className="text-xs text-center text-muted-foreground">
                  + {alerts.length - 5} alertas adicionais
                </p>
              )}
            </>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

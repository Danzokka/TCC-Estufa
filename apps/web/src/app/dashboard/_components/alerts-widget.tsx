"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, CheckCircle, Info, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface Alert {
  id: string;
  type: "success" | "warning" | "error" | "info";
  title: string;
  message: string;
  timestamp: Date;
}

interface AlertsWidgetProps {
  alerts: Alert[];
}

export function AlertsWidget({ alerts }: AlertsWidgetProps) {
  const getAlertIcon = (type: Alert["type"]) => {
    switch (type) {
      case "success":
        return <CheckCircle className="h-4 w-4" />;
      case "warning":
        return <AlertTriangle className="h-4 w-4" />;
      case "error":
        return <XCircle className="h-4 w-4" />;
      case "info":
        return <Info className="h-4 w-4" />;
    }
  };

  const getAlertColor = (type: Alert["type"]) => {
    switch (type) {
      case "success":
        return "text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950";
      case "warning":
        return "text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-950";
      case "error":
        return "text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950";
      case "info":
        return "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950";
    }
  };

  const getBadgeVariant = (type: Alert["type"]) => {
    switch (type) {
      case "success":
        return "default";
      case "warning":
        return "secondary";
      case "error":
        return "destructive";
      case "info":
        return "outline";
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-medium flex items-center gap-2">
          <AlertTriangle className="h-5 w-5" />
          Alertas e Notificações
        </CardTitle>
      </CardHeader>
      <CardContent>
        {alerts.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <CheckCircle className="h-12 w-12 mx-auto mb-2 text-green-500" />
            <p className="text-sm">Nenhum alerta ativo</p>
            <p className="text-xs mt-1">Tudo está funcionando normalmente</p>
          </div>
        ) : (
          <div className="space-y-3">
            {alerts.map((alert) => (
              <div
                key={alert.id}
                className={cn(
                  "p-3 rounded-lg border",
                  getAlertColor(alert.type)
                )}
              >
                <div className="flex items-start gap-3">
                  <div className="mt-0.5">{getAlertIcon(alert.type)}</div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium">{alert.title}</p>
                      <Badge
                        variant={getBadgeVariant(alert.type)}
                        className="text-xs"
                      >
                        {alert.type}
                      </Badge>
                    </div>
                    <p className="text-xs opacity-90">{alert.message}</p>
                    <p className="text-xs opacity-70 mt-2">
                      {new Date(alert.timestamp).toLocaleString("pt-BR", {
                        day: "2-digit",
                        month: "2-digit",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Função helper para gerar alertas baseado nos dados dos sensores
export function generateAlerts(latest: any, kpis: any): Alert[] {
  const alerts: Alert[] = [];

  // Alerta de temperatura alta
  if (latest?.air_temperature > 32) {
    alerts.push({
      id: "temp-high",
      type: "warning",
      title: "Temperatura Elevada",
      message: `Temperatura do ar em ${latest.air_temperature.toFixed(1)}°C. Considere melhorar a ventilação.`,
      timestamp: new Date(),
    });
  }

  // Alerta de temperatura muito alta
  if (latest?.air_temperature > 38) {
    alerts.push({
      id: "temp-critical",
      type: "error",
      title: "Temperatura Crítica",
      message: `Temperatura do ar em ${latest.air_temperature.toFixed(1)}°C. Ação imediata necessária!`,
      timestamp: new Date(),
    });
  }

  // Alerta de umidade do solo baixa
  if (latest?.soil_moisture < 30) {
    alerts.push({
      id: "soil-low",
      type: "warning",
      title: "Solo Seco",
      message: `Umidade do solo em ${latest.soil_moisture.toFixed(1)}%. Considere irrigar.`,
      timestamp: new Date(),
    });
  }

  // Alerta de nível de água baixo
  if (latest?.water_level < 20) {
    alerts.push({
      id: "water-low",
      type: "error",
      title: "Nível de Água Baixo",
      message: `Reservatório em ${latest.water_level.toFixed(1)}%. Reabasteça em breve.`,
      timestamp: new Date(),
    });
  }

  // Alerta de umidade do ar muito baixa
  if (latest?.air_humidity < 40) {
    alerts.push({
      id: "humidity-low",
      type: "info",
      title: "Umidade do Ar Baixa",
      message: `Umidade em ${latest.air_humidity.toFixed(1)}%. Considere nebulização.`,
      timestamp: new Date(),
    });
  }

  // Mensagem de sucesso se tudo estiver ok
  if (alerts.length === 0) {
    alerts.push({
      id: "all-ok",
      type: "success",
      title: "Tudo Normal",
      message: "Todos os parâmetros estão dentro da faixa ideal.",
      timestamp: new Date(),
    });
  }

  return alerts;
}

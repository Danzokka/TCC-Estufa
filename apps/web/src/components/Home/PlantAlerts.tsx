"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { AnimatedList } from "../magicui/animated-list";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Sun, Thermometer, Droplet, Sprout } from "lucide-react";

type AlertType = "soil" | "temperature" | "humidity" | "light";

interface PlantAlertsProps {
  className?: string;
}

interface AlertData {
  props: {
    type: AlertType;
    title: string;
    description: string;
    date: Date;
  };
  className?: string;
}

const PlantAlert = ({ className, props }: AlertData) => {
  const timeAgo = (date: Date) => {
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (seconds < 60) return `${seconds} segundos atrás`;
    if (minutes < 60) return `${minutes} minutos atrás`;
    if (hours < 24) return `${hours} horas atrás`;
    return `${days} dias atrás`;
  };

  const typeColor = {
    soil: "bg-green-500",
    temperature: "bg-red-500",
    humidity: "bg-blue-500",
    light: "bg-yellow-500",
  };

  const icon = {
    soil: <Sprout className="w-5 h-5 text-white" />,
    temperature: <Thermometer className="w-5 h-5 text-white" />,
    humidity: <Droplet className="w-5 h-5 text-white" />,
    light: <Sun className="w-5 h-5 text-white" />,
  };

  return (
    <Alert className="border-secondary bg-transparent flex justify-between items-center w-full h-auto">
      <div className="flex items-center gap-4">
        <div className={`p-2 ${typeColor[props.type]} rounded-lg`}>{icon[props.type]}</div>
        <div>
          <AlertTitle className="text-primary">{props.title}</AlertTitle>
          <AlertDescription>{props.description}</AlertDescription>
        </div>
      </div>
      <span className="h-full flex items-center justify-center text-foreground/65">
        {timeAgo(props.date)}
      </span>
    </Alert>
  );
};

const PlantAlerts = ({ className }: PlantAlertsProps) => {
  // Mock data for alerts

  const alerts: {
    id: number;
    title: string;
    description: string;
    date: Date;
    type: AlertType;
  }[] = [
    {
      id: 1,
      title: "Alerta de Temperatura",
      description: "A temperatura está acima do limite recomendado.",
      date: new Date("2025-04-19T12:00:00Z"),
      type: "temperature",
    },
    {
      id: 2,
      title: "Alerta de Umidade",
      description: "A umidade do solo está abaixo do ideal.",
      date: new Date("2025-04-19T17:00:00Z"),
      type: "humidity",
    },
    {
      id: 3,
      title: "Alerta de Luz",
      description: "A planta está recebendo luz excessiva.",
      date: new Date("2025-04-19T20:00:00Z"),
      type: "light",
    },
    {
      id: 4,
      title: "Alerta de Solo",
      description: "O solo está seco e precisa de irrigação.",
      date: new Date("2025-04-19T22:00:00Z"),
      type: "soil",
    },
  ];

  // Sort alerts by date in ascending order
  alerts.sort((a, b) => a.date.getTime() - b.date.getTime());

  return (
    <div className={cn("w-full flex flex-col gap-4", className)}>
      <h2 className="text-2xl font-bold">Alertas</h2>
      <p className="text-foreground/65">Principais alertas do seu cultivo</p>
      <AnimatedList>
        {alerts.map((alert) => (
          <PlantAlert
            key={alert.id}
            className="mb-4"
            props={{
              title: alert.title,
              description: alert.description,
              date: alert.date,
              type: alert.type,
            }}
          />
        ))}
      </AnimatedList>
    </div>
  );
};

export default PlantAlerts;

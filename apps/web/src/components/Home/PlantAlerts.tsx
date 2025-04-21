import React from "react";
import { cn } from "@/lib/utils";
import { AnimatedList } from "../magicui/animated-list";
import { NotificationType } from "@/data/notifications";
import { getAlerts } from "@/app/actions";
import { NotificationCard } from "../Notifications";

interface PlantAlertsProps {
  className?: string;
}

const PlantAlerts = async ({ className }: PlantAlertsProps) => {

  const alerts: NotificationType[] = await getAlerts();

  return (
    <div className={cn("w-full flex flex-col gap-4", className)}>
      <h2 className="text-2xl font-bold">Alertas</h2>
      <p className="text-foreground/65">Principais alertas do seu cultivo</p>
      <AnimatedList>
        {alerts.map((alert) => (
          <NotificationCard
            key={alert.id}
            className="mb-4"
            props={{
              id: alert.id,
              title: alert.title,
              description: alert.description,
              timestamp: alert.timestamp,
              type: alert.type,
            }}
          />
        ))}
      </AnimatedList>
    </div>
  );
};

export default PlantAlerts;

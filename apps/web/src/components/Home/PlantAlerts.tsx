"use client";
import React from "react";
import { cn } from "@/lib/utils";
import { AnimatedList } from "../magicui/animated-list";
import { getAlerts } from "@/server/actions/plant";
import { NotificationCard } from "../Notifications";
import { useQuery } from "@tanstack/react-query";
import { PlantAlertsSkeleton } from "../Skeletons";
import { usePlant } from "@/context/PlantContext";

interface PlantAlertsProps {
  className?: string;
}

const PlantAlerts = ({ className }: PlantAlertsProps) => {
  const { selectedPlant } = usePlant();

  const { data: alerts, isLoading } = useQuery({
    queryKey: ["alerts", selectedPlant?.id],
    queryFn: async () => await getAlerts(),	
    enabled: !!selectedPlant,
  });

  return (
    <div className={cn("w-full flex flex-col gap-4", className)}>
      <h2 className="text-2xl font-bold">Alertas</h2>
      <p className="text-foreground/65">Principais alertas do seu cultivo</p>
      {isLoading ? (
        <PlantAlertsSkeleton />
      ) : (
        <AnimatedList>
          {alerts?.map((alert) => (
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
      )}
    </div>
  );
};

export default PlantAlerts;

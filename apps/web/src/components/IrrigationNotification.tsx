"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Droplets, AlertTriangle, X, CheckCircle } from "lucide-react";
import { useIrrigationNotifications } from "@/hooks/useIrrigationNotifications";

interface IrrigationNotificationProps {
  onClose?: () => void;
}

export function IrrigationNotification({
  onClose,
}: IrrigationNotificationProps) {
  const router = useRouter();
  const { notifications, markAsRead, clearNotifications } =
    useIrrigationNotifications();

  const handleNotificationClick = (notification: any) => {
    markAsRead(notification.id);

    if (notification.type === "irrigation_detected") {
      // Redirect to irrigation confirmation page
      router.push(`/dashboard/irrigation?id=${notification.id}`);
    } else if (notification.type === "pump_activated") {
      // Show pump activation details
      router.push("/dashboard/pump");
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "pump_activated":
        return <Droplets className="h-4 w-4" />;
      case "irrigation_detected":
        return <AlertTriangle className="h-4 w-4" />;
      default:
        return <CheckCircle className="h-4 w-4" />;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case "pump_activated":
        return "default";
      case "irrigation_detected":
        return "destructive";
      default:
        return "secondary";
    }
  };

  if (notifications.length === 0) {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm">
      {notifications.slice(0, 3).map((notification) => (
        <Alert
          key={notification.id}
          className="cursor-pointer hover:shadow-lg transition-shadow"
          onClick={() => handleNotificationClick(notification)}
        >
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-2">
              {getNotificationIcon(notification.type)}
              <div className="flex-1">
                <AlertDescription className="font-medium">
                  {notification.message}
                </AlertDescription>
                <div className="mt-2 space-y-1">
                  {notification.data.duration && (
                    <p className="text-xs text-muted-foreground">
                      Duração: {notification.data.duration}s
                    </p>
                  )}
                  {notification.data.waterAmount && (
                    <p className="text-xs text-muted-foreground">
                      Água: {notification.data.waterAmount}L
                    </p>
                  )}
                  {notification.data.moistureIncrease && (
                    <p className="text-xs text-muted-foreground">
                      Umidade: +{notification.data.moistureIncrease.toFixed(1)}%
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    {new Date(notification.data.timestamp).toLocaleString(
                      "pt-BR"
                    )}
                  </p>
                </div>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={(e) => {
                e.stopPropagation();
                markAsRead(notification.id);
              }}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        </Alert>
      ))}

      {notifications.length > 3 && (
        <Card className="p-2">
          <CardContent className="p-0">
            <Button
              variant="ghost"
              size="sm"
              onClick={clearNotifications}
              className="w-full text-xs"
            >
              Limpar todas ({notifications.length})
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

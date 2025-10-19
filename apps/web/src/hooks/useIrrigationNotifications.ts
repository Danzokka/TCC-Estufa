import { useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";

interface IrrigationNotification {
  id: string;
  type: "pump_activated" | "irrigation_detected";
  message: string;
  data: {
    pumpId?: string;
    duration?: number;
    waterAmount?: number;
    moistureIncrease?: number;
    greenhouseId: string;
    timestamp: string;
  };
}

export function useIrrigationNotifications() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [notifications, setNotifications] = useState<IrrigationNotification[]>(
    []
  );
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Connect to WebSocket
    const socketInstance = io(
      process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:5000",
      {
        transports: ["websocket"],
        auth: {
          token: localStorage.getItem("auth-token"), // Adjust based on your auth system
        },
      }
    );

    socketInstance.on("connect", () => {
      setIsConnected(true);
      console.log("Connected to irrigation notifications");
    });

    socketInstance.on("disconnect", () => {
      setIsConnected(false);
      console.log("Disconnected from irrigation notifications");
    });

    socketInstance.on(
      "irrigation-notification",
      (notification: IrrigationNotification) => {
        console.log("Received irrigation notification:", notification);
        setNotifications((prev) => [notification, ...prev]);

        // Show browser notification if supported
        if ("Notification" in window && Notification.permission === "granted") {
          new Notification("Sistema de Irrigação", {
            body: notification.message,
            icon: "/icons/notification-icon.png",
            tag: `irrigation-${notification.id}`,
          });
        }
      }
    );

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, []);

  const requestNotificationPermission = async () => {
    if ("Notification" in window) {
      const permission = await Notification.requestPermission();
      return permission === "granted";
    }
    return false;
  };

  const markAsRead = (notificationId: string) => {
    setNotifications((prev) =>
      prev.map((notification) =>
        notification.id === notificationId
          ? { ...notification, read: true }
          : notification
      )
    );
  };

  const clearNotifications = () => {
    setNotifications([]);
  };

  return {
    notifications,
    isConnected,
    requestNotificationPermission,
    markAsRead,
    clearNotifications,
  };
}

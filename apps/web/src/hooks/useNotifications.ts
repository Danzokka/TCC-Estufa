import { useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";
import axios from "axios";

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  data?: any;
  isRead?: boolean;
  createdAt?: string;
  timestamp: string;
}

export function useNotifications() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // Função para tocar som de notificação
  const playNotificationSound = () => {
    try {
      // Tentar tocar som personalizado
      const audio = new Audio("/sounds/notification.mp3");
      audio.volume = 0.3;
      audio.play().catch(() => {
        // Fallback: usar som do sistema
        console.log("Tocando som do sistema");
        // Criar um beep simples
        const context = new (window.AudioContext ||
          (window as any).webkitAudioContext)();
        const oscillator = context.createOscillator();
        const gainNode = context.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(context.destination);

        oscillator.frequency.setValueAtTime(800, context.currentTime);
        gainNode.gain.setValueAtTime(0.3, context.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(
          0.01,
          context.currentTime + 0.5
        );

        oscillator.start(context.currentTime);
        oscillator.stop(context.currentTime + 0.5);
      });
    } catch (error) {
      console.log("Erro ao tocar som de notificação:", error);
    }
  };

  // Função para carregar notificações do banco (sem tocar som)
  const loadNotifications = async (playSound = false) => {
    try {
      const token = localStorage.getItem("token");

      // Usar proxy do Next.js ou URL direta
      const apiUrl = process.env.NEXT_PUBLIC_API_URL
        ? `${process.env.NEXT_PUBLIC_API_URL}/test-notifications/load-test`
        : "/api/test-notifications/load-test";

      const response = await axios.get(apiUrl);

      if (response.data && response.data.notifications) {
        // Ordenar por data de criação (mais recentes primeiro)
        const sortedNotifications = response.data.notifications.sort(
          (a: any, b: any) => {
            const dateA = new Date(a.createdAt || a.timestamp);
            const dateB = new Date(b.createdAt || b.timestamp);
            return dateB.getTime() - dateA.getTime();
          }
        );

        setNotifications(sortedNotifications);
        setUnreadCount(
          sortedNotifications.filter((n: any) => !n.isRead).length
        );
        console.log("Notificações carregadas:", sortedNotifications.length);

        // Tocar som apenas se solicitado (para notificações em tempo real)
        if (playSound) {
          playNotificationSound();
        }
      }
    } catch (error) {
      console.error("Erro ao carregar notificações:", error);
    }
  };

  // Função para marcar como lida
  const markNotificationAsRead = async (notificationId: string) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      await axios.put(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/notifications/${notificationId}/read`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      // Atualizar estado local
      setNotifications((prev) =>
        prev.map((notification) =>
          notification.id === notificationId
            ? { ...notification, isRead: true }
            : notification
        )
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error("Erro ao marcar como lida:", error);
    }
  };

  // Função para marcar todas como lidas
  const markAllAsRead = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      await axios.put(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/notifications/mark-all-read`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      // Atualizar estado local
      setNotifications((prev) =>
        prev.map((notification) => ({ ...notification, isRead: true }))
      );
      setUnreadCount(0);
    } catch (error) {
      console.error("Erro ao marcar todas como lidas:", error);
    }
  };

  useEffect(() => {
    // Get token from localStorage
    const token = localStorage.getItem("token");

    // Carregar notificações existentes do banco (sem som)
    const initializeNotifications = async () => {
      try {
        await loadNotifications(false); // false = não tocar som
        console.log("Notificações carregadas do banco");
      } catch (error) {
        console.error("Erro ao carregar notificações:", error);
      }
    };

    // Carregar imediatamente
    initializeNotifications();

    // Connect to WebSocket (with or without token for testing)
    const socketInstance = io(
      `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/greenhouse`,
      {
        auth: token ? { token: token } : {},
        transports: ["websocket"],
        forceNew: true,
      }
    );

    socketInstance.on("connect", () => {
      setIsConnected(true);
      console.log("Connected to notifications");
    });

    socketInstance.on("disconnect", () => {
      setIsConnected(false);
      console.log("Disconnected from notifications");
    });

    socketInstance.on("notification", async (notification: Notification) => {
      console.log("Received notification:", notification);

      // Tocar som de notificação
      playNotificationSound();

      // Adicionar notificação ao estado imediatamente (para UI responsiva)
      setNotifications((prev) => [notification, ...prev]);
      setUnreadCount((prev) => prev + 1);

      // Sync automático com backend para persistir
      try {
        const saveUrl = process.env.NEXT_PUBLIC_API_URL
          ? `${process.env.NEXT_PUBLIC_API_URL}/notifications/public/save`
          : "/api/notifications/public/save";

        await axios.post(saveUrl, {
          userId: notification.data?.userId || "test-user-id",
          type: notification.type,
          title: notification.title,
          message: notification.message,
          data: notification.data,
        });
        console.log("Notificação salva no backend:", notification.id);
      } catch (error) {
        console.error("Erro ao salvar notificação no backend:", error);
      }

      // Show browser notification if supported
      if ("Notification" in window && Notification.permission === "granted") {
        new Notification(notification.title || "Sistema de Irrigação", {
          body: notification.message,
          icon: "/icons/plantpot.svg",
          tag: `notification-${notification.id}`,
        });
      }
    });

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

  const clearNotifications = () => {
    setNotifications([]);
  };

  return {
    notifications,
    isConnected,
    unreadCount,
    requestNotificationPermission,
    markNotificationAsRead,
    markAllAsRead,
    clearNotifications,
    loadNotifications,
  };
}

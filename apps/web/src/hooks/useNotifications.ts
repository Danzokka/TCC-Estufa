import { useEffect, useState, useCallback } from "react";
import { io, Socket } from "socket.io-client";
import axios from "axios";
import { 
  markNotificationAsRead, 
  markAllNotificationsAsRead, 
  clearReadNotifications, 
  saveNotification 
} from "@/server/actions/notifications";

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  data?: Record<string, unknown>;
  isRead?: boolean;
  createdAt?: string;
  timestamp: string;
}

export function useNotifications() {
  const [, setSocket] = useState<Socket | null>(null);
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
          (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
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
    } catch (error: unknown) {
      console.log("Erro ao tocar som de notificação:", error);
    }
  };

  // Função para carregar notificações do banco (sem tocar som)
  const loadNotifications = useCallback(async (playSound = false) => {
    try {
      // Token para autenticação futura
      const token = localStorage.getItem("token");

      // Usar proxy do Next.js ou URL direta
      const apiUrl = process.env.NEXT_PUBLIC_API_URL
        ? `${process.env.NEXT_PUBLIC_API_URL}/test-notifications/load-test`
        : "/api/test-notifications/load-test";

      const response = await axios.get(apiUrl);

      if (response.data && response.data.notifications) {
        // Ordenar por data de criação (mais recentes primeiro)
        const sortedNotifications = response.data.notifications.sort(
          (a: Notification, b: Notification) => {
            const dateA = new Date(a.createdAt || a.timestamp);
            const dateB = new Date(b.createdAt || b.timestamp);
            return dateB.getTime() - dateA.getTime();
          }
        );

        setNotifications(sortedNotifications);
        setUnreadCount(
          sortedNotifications.filter((n: Notification) => !n.isRead).length
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
  }, []);

  // Função para marcar como lida (remove da visualização)
  const markNotificationAsReadAction = async (notificationId: string) => {
    try {
      // Remover da visualização imediatamente (mas mantém no DB)
      setNotifications((prev) =>
        prev.filter((notification) => notification.id !== notificationId)
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));

      // Chamar server action para persistir no backend
      const result = await markNotificationAsRead(notificationId);
      
      if (!result.success) {
        console.error("Erro ao marcar como lida:", result.message);
        // Reverter estado em caso de erro
        await loadNotifications(false);
      }
    } catch (error) {
      console.error("Erro ao marcar como lida:", error);
      // Reverter estado em caso de erro
      await loadNotifications(false);
    }
  };

  // Função para marcar todas como lidas (remove opções individuais, exceto preencher dados)
  const markAllAsRead = async () => {
    try {
      // Remover todas as notificações da visualização, exceto as de "preencher dados"
      setNotifications((prev) =>
        prev.filter((notification) => 
          notification.type === 'irrigation_detected' || 
          notification.type === 'pump_activated'
        )
      );
      setUnreadCount(0);

      // Chamar server action para persistir no backend
      const result = await markAllNotificationsAsRead();
      
      if (!result.success) {
        console.error("Erro ao marcar todas como lidas:", result.message);
        // Reverter estado em caso de erro
        await loadNotifications(false);
      }
    } catch (error) {
      console.error("Erro ao marcar todas como lidas:", error);
      // Reverter estado em caso de erro
      await loadNotifications(false);
    }
  };

  // Função para limpar TODAS as notificações (incluindo preencher dados)
  const clearReadNotificationsAction = async () => {
    try {
      // Chamar server action para limpar no backend
      const result = await clearReadNotifications();

      if (result.success) {
        // Remover TODAS as notificações da visualização (incluindo preencher dados)
        setNotifications([]);
        setUnreadCount(0);
        console.log(`✅ ${result.count} notificações foram removidas da visualização`);
      } else {
        console.error("Erro ao limpar notificações:", result.message);
        // Reverter estado em caso de erro
        await loadNotifications(false);
      }
    } catch (error) {
      console.error("Erro ao limpar notificações:", error);
      // Reverter estado em caso de erro
      await loadNotifications(false);
    }
  };

  useEffect(() => {
    // Get token from localStorage (for future authentication)
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

      // Sync automático com backend para persistir usando Server Action
      try {
        await saveNotification({
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
  }, [loadNotifications]);

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
    markNotificationAsRead: markNotificationAsReadAction,
    markAllAsRead,
    clearReadNotifications: clearReadNotificationsAction,
    clearNotifications,
    loadNotifications,
  };
}

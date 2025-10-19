"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { getRelativeTime } from "@/utils/timeUtils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Bell,
  CircleCheck,
  Droplet,
  Rss,
  Siren,
  TriangleAlert,
  Wrench,
  X,
} from "lucide-react";
import { useNotifications } from "@/hooks/useNotifications";
import { useRouter } from "next/navigation";

// ===== TIPOS =====
export interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  data?: any;
  isRead?: boolean;
  timestamp: string;
}

// ===== UTILITÁRIOS =====
const getNotificationIcon = (type: string) => {
  const size = "size-6";
  const color = "text-white";

  switch (type) {
    case "pump_activated":
      return { icon: <Rss className={cn(size, color)} />, color: "#1E86FF" };
    case "irrigation_detected":
      return {
        icon: (
          <Droplet
            className={cn(size, color, "text-blue-500")}
            fill="currentColor"
          />
        ),
        color: "#FFB800",
      };
    case "irrigation_confirmed":
      return {
        icon: <CircleCheck className={cn(size, color, "text-green-500")} />,
        color: "#00C9A7",
      };
    case "system_alert":
      return { icon: <Siren className={cn(size, color)} />, color: "#FF3D71" };
    case "maintenance":
      return { icon: <Wrench className={cn(size, color)} />, color: "#8B5CF6" };
    default:
      return {
        icon: <Bell className={cn(size, color, "text-yellow-300")} />,
        color: "#6B7280",
      };
  }
};

// ===== COMPONENTES INTERNOS =====

// ItemIcon - Ícone da notificação
interface NotificationItemIconProps {
  type: string;
  className?: string;
}

const NotificationItemIcon = React.forwardRef<
  HTMLDivElement,
  NotificationItemIconProps
>(({ type, className }, ref) => {
  const { icon, color } = getNotificationIcon(type);

  return (
    <div
      ref={ref}
      className={cn(
        "flex h-12 w-12 items-center justify-center rounded-lg flex-shrink-0",
        className
      )}
    >
      <span className="text-xl">{icon}</span>
    </div>
  );
});
NotificationItemIcon.displayName = "NotificationItemIcon";

// Item - Item individual da notificação
interface NotificationItemProps {
  notification: Notification;
  onMarkAsRead?: (id: string) => void;
  onClick?: (notification: Notification) => void;
  className?: string;
}

const NotificationItem = React.forwardRef<
  HTMLDivElement,
  NotificationItemProps
>(({ notification, onMarkAsRead, onClick, className }, ref) => {
  const timeAgo = getRelativeTime(
    notification.data?.timestamp || notification.timestamp
  );

  return (
    <div
      ref={ref}
      className={cn(
        "relative w-full cursor-pointer rounded-xl p-4 transition-all duration-200",
        "",
        "",
        "border border-gray-200 dark:border-gray-700",
        "shadow-sm hover:shadow-md",
        className
      )}
      onClick={() => onClick?.(notification)}
    >
      <div className="flex items-start gap-3">
        <NotificationItemIcon type={notification.type} />

        <div className="flex-1 min-w-0 grid grid-cols-[1fr_auto] gap-x-2">
          {/* Coluna esquerda: Título e mensagem */}
          <div className="min-w-0">
            <h4 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wide mb-1">
              {notification.title}
            </h4>
            <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
              {notification.message}
            </p>
          </div>

          {/* Coluna direita: Tempo e botão */}
          <div className="flex flex-col items-end gap-1 flex-shrink-0">
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {timeAgo}
              </span>
              {!notification.isRead && (
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              )}
            </div>
            {!notification.isRead && onMarkAsRead && (
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onMarkAsRead(notification.id);
                }}
                className="text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium h-6 px-2"
              >
                Marcar como lida
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
});
NotificationItem.displayName = "NotificationItem";

// Header - Cabeçalho da lista
interface NotificationHeaderProps {
  unreadCount: number;
  onMarkAllAsRead?: () => void;
  className?: string;
}

const NotificationHeader = React.forwardRef<
  HTMLDivElement,
  NotificationHeaderProps
>(({ unreadCount, onMarkAllAsRead, className }, ref) => {
  return (
    <div
      ref={ref}
      className={cn("flex items-center justify-between mb-3", className)}
    >
      <h4 className="text-sm font-medium text-muted-foreground">
        Notificações do Sistema
      </h4>
      {unreadCount > 0 && onMarkAllAsRead && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onMarkAllAsRead}
          className="text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
        >
          Marcar todas como lida
        </Button>
      )}
    </div>
  );
});
NotificationHeader.displayName = "NotificationHeader";

// Container - Container da lista
interface NotificationContainerProps {
  children: React.ReactNode;
  className?: string;
}

const NotificationContainer = React.forwardRef<
  HTMLDivElement,
  NotificationContainerProps
>(({ children, className }, ref) => {
  return (
    <div
      ref={ref}
      className={cn(
        "relative flex h-[600px] w-[600px] flex-col overflow-hidden",
        className
      )}
    >
      {children}
    </div>
  );
});
NotificationContainer.displayName = "NotificationContainer";

// ===== COMPONENTE PRINCIPAL =====
interface NotificationsProps {
  notifications: Notification[];
  unreadCount: number;
  onNotificationClick?: (notification: Notification) => void;
  onMarkAsRead?: (id: string) => void;
  onMarkAllAsRead?: () => void;
  className?: string;
}

export const Notifications = React.forwardRef<
  HTMLDivElement,
  NotificationsProps
>(
  (
    {
      notifications,
      unreadCount,
      onNotificationClick,
      onMarkAsRead,
      onMarkAllAsRead,
      className,
    },
    ref
  ) => {
    if (notifications.length === 0) {
      return null;
    }

    return (
      <div ref={ref} className={className}>
        <NotificationHeader
          unreadCount={unreadCount}
          onMarkAllAsRead={onMarkAllAsRead}
        />

        <NotificationContainer>
          {/* Scrollable container */}
          <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent">
            <div className="space-y-2 p-2">
              {notifications.map((notification) => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  onMarkAsRead={onMarkAsRead}
                  onClick={onNotificationClick}
                />
              ))}
            </div>
          </div>

          {/* Gradient overlay at bottom */}
        </NotificationContainer>
      </div>
    );
  }
);
Notifications.displayName = "Notifications";

// ===== CENTRO DE NOTIFICAÇÕES =====
export function NotificationCenter() {
  const [isOpen, setIsOpen] = React.useState(false);
  const {
    notifications: allNotifications,
    isConnected: isWebSocketConnected,
    unreadCount: notificationsUnreadCount,
    markNotificationAsRead,
    markAllAsRead,
    loadNotifications,
  } = useNotifications();

  const handleNotificationClick = (notification: any) => {
    console.log("Notification clicked:", notification);
    // Aqui você pode implementar lógica específica para cada tipo de notificação
    if (notification.type === "irrigation_detected") {
      // Redirecionar para página de confirmação de irrigação
      console.log("Redirecionando para confirmação de irrigação");
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="relative">
          <Bell className="h-4 w-4" />
          {notificationsUnreadCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
              {notificationsUnreadCount > 9 ? "9+" : notificationsUnreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[620px]" align="end">
        <div className="space-y-3">
          {/* Header */}
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Centro de Notificações</h3>
            <Button variant="ghost" size="sm" onClick={() => setIsOpen(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Status de conexão */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <div
              className={`w-2 h-2 rounded-full ${
                isWebSocketConnected ? "bg-green-500" : "bg-red-500"
              }`}
            />
            {isWebSocketConnected
              ? "Conectado em tempo real"
              : "Desconectado - reconectando..."}
          </div>

          {/* Container de notificações */}
          <Notifications
            notifications={allNotifications}
            unreadCount={notificationsUnreadCount}
            onNotificationClick={handleNotificationClick}
            onMarkAsRead={markNotificationAsRead}
            onMarkAllAsRead={markAllAsRead}
          />

          {/* Footer com ações */}
          {allNotifications.length > 0 && (
            <div className="flex justify-between items-center pt-3 border-t">
              <Button
                variant="outline"
                size="sm"
                onClick={() => loadNotifications()}
              >
                Atualizar
              </Button>
              <span className="text-xs text-muted-foreground">
                {allNotifications.length} notificação
                {allNotifications.length !== 1 ? "ões" : ""}
              </span>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

// ===== BADGE DE ALERTAS =====
export function AlertsBadge() {
  const router = useRouter();
  const [isOpen, setIsOpen] = React.useState(false);

  // Hook para notificações em tempo real
  const {
    notifications: allNotifications,
    isConnected: isWebSocketConnected,
    unreadCount: notificationsUnreadCount,
    markNotificationAsRead,
    markAllAsRead,
    loadNotifications,
  } = useNotifications();

  const handleNotificationClick = async (notification: any) => {
    // Marcar como lida se não estiver lida
    if (!notification.isRead) {
      await markNotificationAsRead(notification.id);
    }

    // Redirecionamento baseado no tipo
    if (notification.type === "irrigation_detected") {
      router.push(`/dashboard/irrigation/confirm/${notification.data.id}`);
    } else if (notification.type === "pump_activated") {
      router.push("/dashboard/irrigation");
    } else if (notification.type === "system_alert") {
      router.push("/dashboard/alerts");
    } else if (notification.type === "maintenance") {
      router.push("/dashboard/maintenance");
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
            allNotifications.length > 0 &&
              "text-yellow-600 dark:text-yellow-400"
          )}
        >
          <Bell className="h-4 w-4" />
          {notificationsUnreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {notificationsUnreadCount > 9 ? "9+" : notificationsUnreadCount}
            </Badge>
          )}
          <span className="sr-only">
            {allNotifications.length} notificação
            {allNotifications.length !== 1 ? "ões" : ""}
          </span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[620px]" align="end">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Notificações</h3>
            <div className="flex gap-2">
              <Badge variant="outline">
                {allNotifications.length}{" "}
                {allNotifications.length === 1 ? "notificação" : "notificações"}
              </Badge>
              {isWebSocketConnected && (
                <Badge variant="secondary" className="text-xs">
                  🔴 Online
                </Badge>
              )}
            </div>
          </div>

          {allNotifications.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground">
              <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Nenhuma notificação</p>
              <p className="text-xs mt-1">Tudo funcionando normalmente</p>
            </div>
          ) : (
            <Notifications
              notifications={allNotifications}
              unreadCount={notificationsUnreadCount}
              onNotificationClick={handleNotificationClick}
              onMarkAsRead={markNotificationAsRead}
              onMarkAllAsRead={markAllAsRead}
            />
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

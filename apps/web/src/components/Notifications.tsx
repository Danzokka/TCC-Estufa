import { Button } from "@/components/ui/button";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Bell, Sun, Sprout, Droplet, Thermometer } from "lucide-react";
import { AnimatedList } from "./magicui/animated-list";
import { NotificationType } from "@/data/notifications";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { getNotifications } from "@/server/actions/plant";

interface NotificationCardData {
  props: NotificationType;
  className?: string;
}

export const NotificationCard = ({ props }: NotificationCardData) => {
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
        <div className={`p-2 ${typeColor[props.type]} rounded-lg`}>
          {icon[props.type]}
        </div>
        <div>
          <AlertTitle className="text-primary">{props.title}</AlertTitle>
          <AlertDescription>{props.description}</AlertDescription>
        </div>
      </div>
      <span className="h-full flex items-center justify-center text-foreground/65">
        {timeAgo(props.timestamp)}
      </span>
    </Alert>
  );
};

export default async function Notifications() {
  const notifications: NotificationType[] = await getNotifications();

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" className="bg-background border-none relative">
          <Bell className="h-4 w-4" />
          {notifications.length > 0 && (
            <span className="absolute -top-1 -right-1 bg-secondary text-foreground font-semibold text-xs rounded-full px-1.5 py-0.5 min-w-[18px] h-[18px] flex items-center justify-center">
              {notifications.length}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[calc(95vw)] md:w-auto md:max-w-[w-1/2] bg-background border-secondary flex flex-col gap-4 p-8 max-h-[calc(100vh/2)] overflow-y-auto">
        <h2 className="font-semibold text-lg text-foreground">Notificações</h2>
        <AnimatedList>
          {notifications.map((notification) => (
            <NotificationCard
              key={notification.id}
              className="mb-4"
              props={{
                id: notification.id,
                title: notification.title,
                description: notification.description,
                timestamp: notification.timestamp,
                type: notification.type,
              }}
            />
          ))}
        </AnimatedList>
      </PopoverContent>
    </Popover>
  );
}

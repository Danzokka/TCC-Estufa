export type NotificationType = {
  id: number;
  title: string;
  description: string;
  timestamp: Date;
  type: AlertType;
};

export type AlertType = "soil" | "temperature" | "humidity" | "light";

export const notifications: NotificationType[] = [
  {
    id: 1,
    title: "Alerta de Temperatura",
    description: "A temperatura está acima do limite recomendado.",
    timestamp: new Date("2025-04-19T12:00:00Z"),
    type: "temperature",
  },
  {
    id: 2,
    title: "Alerta de Umidade",
    description: "A umidade do solo está abaixo do ideal.",
    timestamp: new Date("2025-04-19T17:00:00Z"),
    type: "humidity",
  },
  {
    id: 3,
    title: "Alerta de Luz",
    description: "A planta está recebendo luz excessiva.",
    timestamp: new Date("2025-04-19T20:00:00Z"),
    type: "light",
  },
  {
    id: 4,
    title: "Alerta de Solo",
    description: "O solo está seco e precisa de irrigação.",
    timestamp: new Date("2025-04-19T22:00:00Z"),
    type: "soil",
  },
];

"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowUpDown, CheckCircle, Droplet, Cloud, Zap, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export interface Irrigation {
  id: string;
  type: "manual" | "automatic" | "detected" | "rain";
  waterAmount?: number;
  notes?: string;
  createdAt: string;
  greenhouse?: {
    id: string;
    name: string;
  };
  user?: {
    id: string;
    name: string;
  };
  plant?: {
    id: string;
    name: string;
  };
}

const getTypeIcon = (type: string) => {
  switch (type) {
    case "automatic":
      return <Zap className="h-4 w-4" />;
    case "manual":
      return <Droplet className="h-4 w-4" />;
    case "rain":
      return <Cloud className="h-4 w-4" />;
    case "detected":
      return <AlertCircle className="h-4 w-4" />;
    default:
      return <Droplet className="h-4 w-4" />;
  }
};

const getTypeBadge = (type: string) => {
  const variants = {
    automatic: {
      variant: "default" as const,
      label: "Automático",
      color: "bg-blue-500",
    },
    manual: {
      variant: "secondary" as const,
      label: "Manual",
      color: "bg-green-500",
    },
    rain: {
      variant: "outline" as const,
      label: "Chuva",
      color: "bg-gray-500",
    },
    detected: {
      variant: "destructive" as const,
      label: "Detectado",
      color: "bg-yellow-500",
    },
  };

  const config = variants[type as keyof typeof variants] || variants.manual;

  return (
    <Badge variant={config.variant} className="flex items-center gap-1 w-fit">
      {getTypeIcon(type)}
      {config.label}
    </Badge>
  );
};

const getStatusBadge = (irrigation: Irrigation) => {
  if (irrigation.type === "detected") {
    return (
      <Badge
        variant="outline"
        className="bg-yellow-50 text-yellow-700 border-yellow-200"
      >
        Pendente
      </Badge>
    );
  }
  return (
    <Badge
      variant="outline"
      className="bg-green-50 text-green-700 border-green-200 flex items-center gap-1 w-fit"
    >
      <CheckCircle className="h-3 w-3" />
      Confirmado
    </Badge>
  );
};

export const columns: ColumnDef<Irrigation>[] = [
  {
    accessorKey: "createdAt",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Data/Hora
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const date = new Date(row.original.createdAt);
      return (
        <div className="flex flex-col">
          <span className="text-sm font-medium">
            {format(date, "dd/MM/yyyy", { locale: ptBR })}
          </span>
          <span className="text-xs text-muted-foreground">
            {format(date, "HH:mm", { locale: ptBR })}
          </span>
        </div>
      );
    },
  },
  {
    accessorKey: "type",
    header: "Tipo",
    cell: ({ row }) => getTypeBadge(row.original.type),
    filterFn: "equals",
  },
  {
    accessorKey: "waterAmount",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Quantidade (ml)
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const amount = row.original.waterAmount;
      return amount ? (
        <span className="font-medium">{amount} ml</span>
      ) : (
        <span className="text-muted-foreground">-</span>
      );
    },
  },
  {
    id: "status",
    header: "Status",
    cell: ({ row }) => getStatusBadge(row.original),
    filterFn: (row, id, value) => {
      const irrigation = row.original;
      const status = irrigation.type === "detected" ? "pendente" : "confirmado";
      return value === "all" || status === value;
    },
  },
  {
    accessorKey: "notes",
    header: "Observações",
    cell: ({ row }) => {
      const notes = row.original.notes;
      return notes ? (
        <span className="max-w-xs truncate block">{notes}</span>
      ) : (
        <span className="text-muted-foreground italic">Sem observações</span>
      );
    },
    filterFn: "fuzzy",
  },
  {
    id: "actions",
    header: "Ações",
    cell: ({ row }) => {
      const irrigation = row.original;
      if (irrigation.type === "detected") {
        return (
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              // A lógica de confirmação será passada via props ou context
              // Por enquanto, vamos usar um evento customizado
              const event = new CustomEvent('confirmIrrigation', { 
                detail: { irrigationId: irrigation.id } 
              });
              window.dispatchEvent(event);
            }}
          >
            Confirmar
          </Button>
        );
      }
      return null;
    },
  },
];

"use client";

import { ColumnDef } from "@tanstack/react-table";
import { UserPlantWithStats } from "@/server/actions/plant";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowUpDown } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { PlantActions } from "./plant-actions";

export const columns: ColumnDef<UserPlantWithStats>[] = [
  {
    accessorKey: "nickname",
    header: "Planta",
    cell: ({ row }) => {
      const displayName = row.original.nickname || row.original.plant.name;
      const plantType = row.original.plant.name;
      const firstLetter = displayName.charAt(0).toUpperCase();

      return (
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10">
            <AvatarFallback className="bg-primary/10 text-primary">
              {firstLetter}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <span className="font-medium">{displayName}</span>
            {row.original.nickname && (
              <span className="text-xs text-muted-foreground">{plantType}</span>
            )}
          </div>
        </div>
      );
    },
    filterFn: "fuzzy" as any, // Fuzzy search para nome
  },
  {
    id: "plant.name",
    accessorKey: "plant.name",
    header: "Tipo",
    cell: ({ row }) => (
      <span className="text-sm">{row.original.plant.name}</span>
    ),
    filterFn: "equals", // Filtro de igualdade exata para o select
  },
  {
    accessorKey: "dateAdded",
    header: "Data Cadastro",
    cell: ({ row }) => {
      const date = new Date(row.original.dateAdded);
      return (
        <span className="text-sm">
          {format(date, "dd/MM/yyyy", { locale: ptBR })}
        </span>
      );
    },
  },
  {
    id: "stats.daysWithPlant",
    accessorKey: "stats.daysWithPlant",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Dias
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => (
      <span className="text-sm font-medium">
        {row.original.stats.daysWithPlant}
      </span>
    ),
  },
  {
    id: "stats.totalReadings",
    accessorKey: "stats.totalReadings",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Medições
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => (
      <span className="text-sm font-medium">
        {row.original.stats.totalReadings}
      </span>
    ),
  },
  {
    id: "stats.lastReading.date",
    accessorKey: "stats.lastReading.date",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Última Medição
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const lastReading = row.original.stats.lastReading.date;

      if (!lastReading) {
        return (
          <span className="text-sm text-muted-foreground">Sem medições</span>
        );
      }

      const date = new Date(lastReading);
      return (
        <div className="flex flex-col">
          <span className="text-sm">
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
    id: "stats.lastReading.status",
    accessorKey: "stats.lastReading.status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.original.stats.lastReading.status;
      const isActive = status === "ativo";

      return (
        <Badge
          className={
            isActive
              ? "bg-green-500 hover:bg-green-600 text-white"
              : "bg-gray-500 hover:bg-gray-600 text-white"
          }
        >
          {isActive ? "Ativo" : "Inativo"}
        </Badge>
      );
    },
    filterFn: "equals", // Filtro de igualdade exata
  },
  {
    id: "actions",
    header: "Ações",
    cell: ({ row }) => {
      return <PlantActions plant={row.original} />;
    },
  },
];

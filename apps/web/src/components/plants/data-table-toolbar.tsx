"use client";

import * as React from "react";
import { Table } from "@tanstack/react-table";
import { X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { getPlantTypes } from "@/server/actions/plant";

interface DataTableToolbarProps<TData> {
  table: Table<TData>;
}

export function DataTableToolbar<TData>({
  table,
}: DataTableToolbarProps<TData>) {
  const [plantTypes, setPlantTypes] = React.useState<string[]>([]);

  // Buscar tipos de plantas disponíveis
  React.useEffect(() => {
    getPlantTypes().then(setPlantTypes);
  }, []);

  const isFiltered = table.getState().columnFilters.length > 0;

  return (
    <div className="flex items-center justify-between">
      <div className="flex flex-1 items-center space-x-2">
        {/* Filtro de nome (fuzzy search) */}
        <Input
          placeholder="Buscar planta..."
          value={
            (table.getColumn("nickname")?.getFilterValue() as string) ?? ""
          }
          onChange={(event) =>
            table.getColumn("nickname")?.setFilterValue(event.target.value)
          }
          className="h-9 w-[200px]"
        />

        {/* Filtro de tipo (select dinâmico) */}
        <Select
          value={
            (table.getColumn("plant.name")?.getFilterValue() as string) ?? "all"
          }
          onValueChange={(value) =>
            table
              .getColumn("plant.name")
              ?.setFilterValue(value === "all" ? "" : value)
          }
        >
          <SelectTrigger className="h-9 w-[180px]">
            <SelectValue placeholder="Tipo de planta" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os tipos</SelectItem>
            {plantTypes.map((type) => (
              <SelectItem key={type} value={type}>
                {type}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Filtro de status (select hardcoded) */}
        <Select
          value={
            (table
              .getColumn("stats.lastReading.status")
              ?.getFilterValue() as string) ?? "all"
          }
          onValueChange={(value) =>
            table
              .getColumn("stats.lastReading.status")
              ?.setFilterValue(value === "all" ? "" : value)
          }
        >
          <SelectTrigger className="h-9 w-[150px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os status</SelectItem>
            <SelectItem value="ativo">Ativo</SelectItem>
            <SelectItem value="inativo">Inativo</SelectItem>
          </SelectContent>
        </Select>

        {/* Botão para limpar filtros */}
        {isFiltered && (
          <Button
            variant="ghost"
            onClick={() => table.resetColumnFilters()}
            className="h-9 px-2 lg:px-3"
          >
            Limpar
            <X className="ml-2 h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
